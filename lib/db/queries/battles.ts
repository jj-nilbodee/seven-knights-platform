import { db } from "@/lib/db";
import { battles, members } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import type { BattleCreate, BattleUpdate } from "@/lib/validations/battle";
import { getWeekdayFromDate } from "@/lib/validations/battle";

export interface BattleFilters {
  memberId?: string;
  dateFrom?: string;
  dateTo?: string;
  result?: "win" | "loss";
  weekday?: "SAT" | "MON" | "WED";
  limit?: number;
  offset?: number;
}

export async function listBattles(guildId: string, filters: BattleFilters = {}) {
  const conditions = [eq(battles.guildId, guildId)];

  if (filters.memberId) {
    conditions.push(eq(battles.memberId, filters.memberId));
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
      battleNumber: battles.battleNumber,
      battleType: battles.battleType,
      result: battles.result,
      enemyGuildName: battles.enemyGuildName,
      enemyPlayerName: battles.enemyPlayerName,
      alliedTeam: battles.alliedTeam,
      enemyTeam: battles.enemyTeam,
      firstTurn: battles.firstTurn,
      videoUrl: battles.videoUrl,
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
      battleNumber: battles.battleNumber,
      battleType: battles.battleType,
      result: battles.result,
      enemyGuildName: battles.enemyGuildName,
      enemyPlayerName: battles.enemyPlayerName,
      alliedTeam: battles.alliedTeam,
      enemyTeam: battles.enemyTeam,
      firstTurn: battles.firstTurn,
      videoUrl: battles.videoUrl,
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
      battleNumber: data.battleNumber,
      battleType: data.battleType,
      result: data.result,
      enemyGuildName: data.enemyGuildName,
      enemyPlayerName: data.enemyPlayerName,
      alliedTeam: data.alliedTeam,
      enemyTeam: data.enemyTeam,
      firstTurn: data.firstTurn,
      videoUrl: data.videoUrl || null,
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
  if (data.battleNumber !== undefined) values.battleNumber = data.battleNumber;
  if (data.battleType !== undefined) values.battleType = data.battleType;
  if (data.result !== undefined) values.result = data.result;
  if (data.enemyGuildName !== undefined) values.enemyGuildName = data.enemyGuildName;
  if (data.enemyPlayerName !== undefined) values.enemyPlayerName = data.enemyPlayerName;
  if (data.alliedTeam !== undefined) values.alliedTeam = data.alliedTeam;
  if (data.enemyTeam !== undefined) values.enemyTeam = data.enemyTeam;
  if (data.firstTurn !== undefined) values.firstTurn = data.firstTurn;
  if (data.videoUrl !== undefined) values.videoUrl = data.videoUrl || null;

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
