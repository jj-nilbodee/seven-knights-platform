"use server";

import { requireOfficer } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { battles } from "@/lib/db/schema";
import { quickSubmitSchema } from "@/lib/validations/quick-submit";
import { getWeekdayFromDate } from "@/lib/validations/battle";
import { getMemberBattleCountForDate } from "@/lib/db/queries/battles";

const EMPTY_TEAM = {
  heroes: [],
  formation: null,
  skillSequence: [],
  speed: 0,
};

export async function quickSubmitBattles(data: {
  date: string;
  enemyGuildName: string;
  guildId?: string;
  battles: {
    memberId: string;
    result: string;
    battleType: string | null;
    enemyPlayerName: string;
    enemyCastleType: string | null;
    enemyCastleNumber: number | null;
  }[];
}) {
  const user = await requireOfficer();

  const effectiveGuildId =
    user.role === "admin" && data.guildId
      ? data.guildId
      : user.guildId;
  if (!effectiveGuildId) {
    return { error: "คุณยังไม่ได้อยู่ในกิลด์" };
  }

  const parsed = quickSubmitSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { date, enemyGuildName, battles: battleList } = parsed.data;
  const weekday = getWeekdayFromDate(date);

  // Group battles by member to assign battle numbers
  const byMember = new Map<string, typeof battleList>();
  for (const b of battleList) {
    const existing = byMember.get(b.memberId) ?? [];
    existing.push(b);
    byMember.set(b.memberId, existing);
  }

  // Pre-check existing battle counts
  const existingCounts = new Map<string, number>();
  for (const memberId of byMember.keys()) {
    const count = await getMemberBattleCountForDate(
      effectiveGuildId,
      memberId,
      date,
    );
    existingCounts.set(memberId, count);
  }

  // Validate no member exceeds 5 battles
  for (const [memberId, memberBattles] of byMember) {
    const existing = existingCounts.get(memberId) ?? 0;
    if (existing + memberBattles.length > 5) {
      return {
        error: `สมาชิกบางคนมีการต่อสู้เกิน 5 ครั้ง (มีอยู่แล้ว ${existing} ครั้ง, กำลังเพิ่ม ${memberBattles.length} ครั้ง)`,
      };
    }
  }

  try {
    const rows: (typeof battles.$inferInsert)[] = [];

    for (const [memberId, memberBattles] of byMember) {
      const startNumber = (existingCounts.get(memberId) ?? 0) + 1;

      for (let i = 0; i < memberBattles.length; i++) {
        const b = memberBattles[i];
        rows.push({
          guildId: effectiveGuildId,
          memberId,
          date,
          weekday,
          battleNumber: startNumber + i,
          battleType: b.battleType,
          result: b.result,
          enemyGuildName,
          enemyPlayerName: b.enemyPlayerName || null,
          enemyCastleType: b.enemyCastleType,
          enemyCastleNumber: b.enemyCastleNumber,
          alliedTeam: EMPTY_TEAM,
          enemyTeam: EMPTY_TEAM,
          firstTurn: null,
          submittedByUserId: user.id,
        });
      }
    }

    await db.transaction(async (tx) => {
      await tx.insert(battles).values(rows);
    });

    revalidatePath("/guild-war");
    return { success: true, count: rows.length };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique")) {
      return { error: "พบข้อมูลการต่อสู้ซ้ำ — สมาชิกบางคนอาจมีข้อมูลในวันนี้แล้ว" };
    }
    console.error("Quick submit error:", err);
    return { error: "ไม่สามารถบันทึกข้อมูลได้" };
  }
}
