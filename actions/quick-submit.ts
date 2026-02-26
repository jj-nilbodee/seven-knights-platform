"use server";

import { requireOfficer } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { battles } from "@/lib/db/schema";
import { quickSubmitSchema } from "@/lib/validations/quick-submit";
import { getWeekdayFromDate } from "@/lib/validations/battle";
import { eq, and, inArray } from "drizzle-orm";
import { ensureGuildContext, parseOrError } from "@/lib/action-helpers";

const EMPTY_TEAM = {
  heroes: [],
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
    battleType: string;
    enemyPlayerName: string;
    enemyCastleType: string | null;
    enemyCastleNumber: number | null;
  }[];
}) {
  const user = await requireOfficer();

  const guild = ensureGuildContext(user, data.guildId);
  if ("error" in guild) return guild;

  const parsed = parseOrError(quickSubmitSchema, data);
  if ("error" in parsed) return parsed;

  const { date, enemyGuildName, battles: battleList } = parsed.data;
  const weekday = getWeekdayFromDate(date);

  // Group incoming battles by member
  const byMember = new Map<string, typeof battleList>();
  for (const b of battleList) {
    const existing = byMember.get(b.memberId) ?? [];
    existing.push(b);
    byMember.set(b.memberId, existing);
  }

  const memberIds = [...byMember.keys()];

  // Single query to fetch all existing battles for these members on this date
  const existingRows = memberIds.length > 0
    ? await db
        .select({
          id: battles.id,
          memberId: battles.memberId,
          result: battles.result,
          enemyPlayerName: battles.enemyPlayerName,
        })
        .from(battles)
        .where(
          and(
            eq(battles.guildId, guild.guildId),
            eq(battles.date, date),
            inArray(battles.memberId, memberIds),
          ),
        )
    : [];

  // Group existing by member
  const existingByMember = new Map<string, typeof existingRows>();
  for (const row of existingRows) {
    const list = existingByMember.get(row.memberId) ?? [];
    list.push(row);
    existingByMember.set(row.memberId, list);
  }

  try {
    // Collect all updates and inserts, then batch them
    const updates: { id: string; values: Record<string, unknown> }[] = [];
    const inserts: (typeof battles.$inferInsert)[] = [];

    for (const [memberId, memberBattles] of byMember) {
      const existing = existingByMember.get(memberId) ?? [];
      const matched = new Set<string>();
      let rowCount = existing.length;

      for (const b of memberBattles) {
        const skeleton = existing.find(
          (r) =>
            !matched.has(r.id) &&
            r.result === b.result &&
            !r.enemyPlayerName,
        );
        const anyMatch = skeleton ?? existing.find(
          (r) => !matched.has(r.id) && r.result === b.result,
        );

        if (anyMatch) {
          matched.add(anyMatch.id);
          if (b.enemyPlayerName && !anyMatch.enemyPlayerName) {
            updates.push({
              id: anyMatch.id,
              values: {
                battleType: b.battleType || "attack",
                enemyGuildName,
                enemyPlayerName: b.enemyPlayerName || null,
                enemyCastleType: b.enemyCastleType,
                enemyCastleNumber: b.enemyCastleNumber,
                updatedAt: new Date(),
              },
            });
          }
        } else if (rowCount < 5) {
          rowCount++;
          inserts.push({
            guildId: guild.guildId,
            memberId,
            date,
            weekday,
            battleType: b.battleType || "attack",
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
    }

    if (updates.length === 0 && inserts.length === 0) {
      return { error: "ไม่มีข้อมูลที่จะบันทึก" };
    }

    // Batch insert (single query) and parallel updates (separate connections)
    await Promise.all([
      inserts.length > 0
        ? db.insert(battles).values(inserts)
        : null,
      ...updates.map((u) =>
        db.update(battles).set(u.values).where(eq(battles.id, u.id)),
      ),
    ]);

    revalidatePath("/guild-war");
    return { success: true, updated: updates.length, inserted: inserts.length };
  } catch (err: unknown) {
    console.error("Quick submit error:", err);
    return { error: "ไม่สามารถบันทึกข้อมูลได้" };
  }
}
