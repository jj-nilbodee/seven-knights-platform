import { db } from "@/lib/db";
import { battles, members } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, sql, inArray } from "drizzle-orm";
import type { BattleCreate, BattleUpdate } from "@/lib/validations/battle";
import { getWeekdayFromDate } from "@/lib/validations/battle";

export interface BattleFilters {
  memberId?: string;
  memberIds?: string[];
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  result?: "win" | "loss";
  weekday?: "SAT" | "MON" | "WED";
  limit?: number;
  offset?: number;
}

export async function listBattles(guildId: string, filters: BattleFilters = {}) {
  const conditions = [eq(battles.guildId, guildId)];

  if (filters.memberIds && filters.memberIds.length > 0) {
    conditions.push(inArray(battles.memberId, filters.memberIds));
  } else if (filters.memberId) {
    conditions.push(eq(battles.memberId, filters.memberId));
  }
  if (filters.date) {
    conditions.push(eq(battles.date, filters.date));
  }
  if (filters.dateFrom) {
    conditions.push(gte(battles.date, filters.dateFrom));
  }
  if (filters.dateTo) {
    conditions.push(lte(battles.date, filters.dateTo));
  }
  if (filters.result) {
    conditions.push(eq(battles.result, filters.result));
  }
  if (filters.weekday) {
    conditions.push(eq(battles.weekday, filters.weekday));
  }

  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const rows = await db
    .select({
      id: battles.id,
      guildId: battles.guildId,
      memberId: battles.memberId,
      memberIgn: members.ign,
      date: battles.date,
      weekday: battles.weekday,

      battleType: battles.battleType,
      result: battles.result,
      enemyGuildName: battles.enemyGuildName,
      enemyPlayerName: battles.enemyPlayerName,
      alliedTeam: battles.alliedTeam,
      enemyTeam: battles.enemyTeam,
      firstTurn: battles.firstTurn,
      submittedByUserId: battles.submittedByUserId,
      createdAt: battles.createdAt,
      updatedAt: battles.updatedAt,
    })
    .from(battles)
    .leftJoin(members, eq(battles.memberId, members.id))
    .where(and(...conditions))
    .orderBy(desc(battles.date), desc(battles.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
}

export async function getBattleById(id: string) {
  const [row] = await db
    .select({
      id: battles.id,
      guildId: battles.guildId,
      memberId: battles.memberId,
      memberIgn: members.ign,
      date: battles.date,
      weekday: battles.weekday,

      battleType: battles.battleType,
      result: battles.result,
      enemyGuildName: battles.enemyGuildName,
      enemyPlayerName: battles.enemyPlayerName,
      enemyCastleType: battles.enemyCastleType,
      enemyCastleNumber: battles.enemyCastleNumber,
      alliedTeam: battles.alliedTeam,
      enemyTeam: battles.enemyTeam,
      firstTurn: battles.firstTurn,
      submittedByUserId: battles.submittedByUserId,
      createdAt: battles.createdAt,
      updatedAt: battles.updatedAt,
    })
    .from(battles)
    .leftJoin(members, eq(battles.memberId, members.id))
    .where(eq(battles.id, id));

  return row ?? null;
}

export async function createBattle(data: BattleCreate) {
  const [battle] = await db
    .insert(battles)
    .values({
      guildId: data.guildId,
      memberId: data.memberId,
      date: data.date,
      weekday: data.weekday,

      battleType: data.battleType,
      result: data.result,
      enemyGuildName: data.enemyGuildName,
      enemyPlayerName: data.enemyPlayerName,
      enemyCastleType: data.enemyCastleType,
      enemyCastleNumber: data.enemyCastleNumber,
      alliedTeam: data.alliedTeam,
      enemyTeam: data.enemyTeam,
      firstTurn: data.firstTurn,
      submittedByUserId: data.submittedByUserId,
    })
    .returning();

  return battle;
}

export async function updateBattle(id: string, data: BattleUpdate) {
  const values: Record<string, unknown> = { updatedAt: new Date() };

  if (data.memberId !== undefined) values.memberId = data.memberId;
  if (data.date !== undefined) {
    values.date = data.date;
    values.weekday = getWeekdayFromDate(data.date);
  }

  if (data.battleType !== undefined) values.battleType = data.battleType;
  if (data.result !== undefined) values.result = data.result;
  if (data.enemyGuildName !== undefined) values.enemyGuildName = data.enemyGuildName;
  if (data.enemyPlayerName !== undefined) values.enemyPlayerName = data.enemyPlayerName;
  if (data.enemyCastleType !== undefined) values.enemyCastleType = data.enemyCastleType;
  if (data.enemyCastleNumber !== undefined) values.enemyCastleNumber = data.enemyCastleNumber;
  if (data.alliedTeam !== undefined) values.alliedTeam = data.alliedTeam;
  if (data.enemyTeam !== undefined) values.enemyTeam = data.enemyTeam;
  if (data.firstTurn !== undefined) values.firstTurn = data.firstTurn;

  const [battle] = await db
    .update(battles)
    .set(values)
    .where(eq(battles.id, id))
    .returning();

  return battle ?? null;
}

export async function deleteBattle(id: string) {
  const [battle] = await db
    .delete(battles)
    .where(eq(battles.id, id))
    .returning({ id: battles.id });

  return battle ?? null;
}

export async function getMemberBattleCountForDate(
  guildId: string,
  memberId: string,
  date: string,
) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(battles)
    .where(
      and(
        eq(battles.guildId, guildId),
        eq(battles.memberId, memberId),
        eq(battles.date, date),
      ),
    );
  return row?.count ?? 0;
}

export async function getEnemyGuildNameForDate(guildId: string, date: string) {
  const [row] = await db
    .select({ enemyGuildName: battles.enemyGuildName })
    .from(battles)
    .where(
      and(
        eq(battles.guildId, guildId),
        eq(battles.date, date),
        sql`${battles.enemyGuildName} IS NOT NULL AND ${battles.enemyGuildName} != ''`,
      ),
    )
    .limit(1);
  return row?.enemyGuildName ?? "";
}

export async function getEnemyPlayerNamesForDate(guildId: string, date: string) {
  const rows = await db
    .selectDistinct({ enemyPlayerName: battles.enemyPlayerName })
    .from(battles)
    .where(
      and(
        eq(battles.guildId, guildId),
        eq(battles.date, date),
        sql`${battles.enemyPlayerName} IS NOT NULL AND ${battles.enemyPlayerName} != ''`,
      ),
    );
  return rows.map((r) => r.enemyPlayerName!);
}

export async function getHeroCooccurrence(
  guildId: string,
): Promise<Record<string, string[]>> {
  const rows = await db
    .select({
      alliedTeam: battles.alliedTeam,
      enemyTeam: battles.enemyTeam,
    })
    .from(battles)
    .where(eq(battles.guildId, guildId));

  // Count how often each pair of heroes appears on the same team
  const pairCounts = new Map<string, Map<string, number>>();

  function addTeam(team: unknown) {
    const t = team as { heroes?: { heroId: string }[] } | null;
    const heroIds = (t?.heroes ?? []).map((h) => h.heroId);
    for (let i = 0; i < heroIds.length; i++) {
      for (let j = i + 1; j < heroIds.length; j++) {
        const a = heroIds[i];
        const b = heroIds[j];
        if (!pairCounts.has(a)) pairCounts.set(a, new Map());
        if (!pairCounts.has(b)) pairCounts.set(b, new Map());
        pairCounts.get(a)!.set(b, (pairCounts.get(a)!.get(b) ?? 0) + 1);
        pairCounts.get(b)!.set(a, (pairCounts.get(b)!.get(a) ?? 0) + 1);
      }
    }
  }

  for (const row of rows) {
    addTeam(row.alliedTeam);
    addTeam(row.enemyTeam);
  }

  // For each hero, return top 10 most common teammates sorted by count
  const result: Record<string, string[]> = {};
  for (const [heroId, teammates] of pairCounts) {
    result[heroId] = Array.from(teammates.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);
  }

  return result;
}

export async function getSkillSequenceHistory(
  guildId: string,
): Promise<Record<string, Array<{ heroId: string; skillId: string; order: number }[]>>> {
  const rows = await db
    .select({
      alliedTeam: battles.alliedTeam,
      enemyTeam: battles.enemyTeam,
    })
    .from(battles)
    .where(eq(battles.guildId, guildId));

  const result: Record<string, Array<{ heroId: string; skillId: string; order: number }[]>> = {};

  function addTeam(team: unknown) {
    const t = team as {
      heroes?: { heroId: string }[];
      skillSequence?: { heroId: string; skillId: string; order: number }[];
    } | null;
    const heroIds = (t?.heroes ?? []).map((h) => h.heroId);
    const seq = t?.skillSequence ?? [];
    if (heroIds.length === 0 || seq.length === 0) return;

    const key = [...heroIds].sort().join("|");
    if (!result[key]) result[key] = [];
    result[key].push(seq.map((s) => ({ heroId: s.heroId, skillId: s.skillId, order: s.order })));
  }

  for (const row of rows) {
    addTeam(row.alliedTeam);
    addTeam(row.enemyTeam);
  }

  return result;
}

export async function getBattleStats(guildId: string) {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      wins: sql<number>`count(*) filter (where ${battles.result} = 'win')::int`,
      losses: sql<number>`count(*) filter (where ${battles.result} = 'loss')::int`,
    })
    .from(battles)
    .where(eq(battles.guildId, guildId));

  return {
    total: row?.total ?? 0,
    wins: row?.wins ?? 0,
    losses: row?.losses ?? 0,
    winRate: row && row.total > 0 ? Math.round((row.wins / row.total) * 100) : 0,
  };
}

export async function getLatestBattleDate(guildId: string): Promise<string | null> {
  const [row] = await db
    .select({ date: battles.date })
    .from(battles)
    .where(eq(battles.guildId, guildId))
    .orderBy(desc(battles.date))
    .limit(1);
  return row?.date ?? null;
}
