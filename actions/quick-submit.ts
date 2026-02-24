"use server";

import { requireOfficer } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { battles } from "@/lib/db/schema";
import { quickSubmitSchema } from "@/lib/validations/quick-submit";
import { getWeekdayFromDate } from "@/lib/validations/battle";
import { eq, and, asc } from "drizzle-orm";

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

  // Group incoming battles by member
  const byMember = new Map<string, typeof battleList>();
  for (const b of battleList) {
    const existing = byMember.get(b.memberId) ?? [];
    existing.push(b);
    byMember.set(b.memberId, existing);
  }

  // Fetch existing battle rows per member for this date (including result & enemy info)
  type ExistingRow = {
    id: string;
    battleNumber: number;
    result: string;
    enemyPlayerName: string | null;
  };
  const existingByMember = new Map<string, ExistingRow[]>();
  for (const memberId of byMember.keys()) {
    const rows = await db
      .select({
        id: battles.id,
        battleNumber: battles.battleNumber,
        result: battles.result,
        enemyPlayerName: battles.enemyPlayerName,
      })
      .from(battles)
      .where(
        and(
          eq(battles.guildId, effectiveGuildId),
          eq(battles.memberId, memberId),
          eq(battles.date, date),
        ),
      )
      .orderBy(asc(battles.battleNumber));
    existingByMember.set(memberId, rows);
  }

  try {
    let updated = 0;
    let inserted = 0;

    await db.transaction(async (tx) => {
      for (const [memberId, memberBattles] of byMember) {
        const existingRows = existingByMember.get(memberId) ?? [];
        const matched = new Set<string>(); // track which existing rows are already matched

        for (const b of memberBattles) {
          // Try to match an existing battle with the same result that lacks detail
          const match = existingRows.find(
            (r) =>
              !matched.has(r.id) &&
              r.result === b.result &&
              !r.enemyPlayerName,
          );

          if (match) {
            // Update skeleton battle with extracted detail
            matched.add(match.id);
            await tx
              .update(battles)
              .set({
                battleType: b.battleType,
                enemyGuildName,
                enemyPlayerName: b.enemyPlayerName || null,
                enemyCastleType: b.enemyCastleType,
                enemyCastleNumber: b.enemyCastleNumber,
                updatedAt: new Date(),
              })
              .where(eq(battles.id, match.id));
            updated++;
          } else if (existingRows.length < 5) {
            // No matching skeleton — insert as new if under limit
            const nextNumber = existingRows.length + 1;
            await tx.insert(battles).values({
              guildId: effectiveGuildId,
              memberId,
              date,
              weekday,
              battleNumber: nextNumber,
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
            // Add to existingRows so the count stays accurate
            existingRows.push({
              id: "",
              battleNumber: nextNumber,
              result: b.result,
              enemyPlayerName: b.enemyPlayerName || null,
            });
            inserted++;
          }
        }
      }
    });

    if (updated === 0 && inserted === 0) {
      return { error: "ไม่มีข้อมูลที่จะบันทึก" };
    }

    revalidatePath("/guild-war");
    return { success: true, updated, inserted };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique")) {
      return { error: "พบข้อมูลการต่อสู้ซ้ำ — สมาชิกบางคนอาจมีข้อมูลในวันนี้แล้ว" };
    }
    console.error("Quick submit error:", err);
    return { error: "ไม่สามารถบันทึกข้อมูลได้" };
  }
}
