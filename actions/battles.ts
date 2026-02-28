"use server";

import { requireOfficer } from "@/lib/auth";
import { revalidatePath, updateTag } from "next/cache";
import {
  battleCreateSchema,
  battleUpdateSchema,
} from "@/lib/validations/battle";
import {
  createBattle as dbCreateBattle,
  updateBattle as dbUpdateBattle,
  deleteBattle as dbDeleteBattle,
  getBattleById,
  getMemberBattleCountForDate,
  getEnemyGuildNameForDate,
  getEnemyPlayerNamesForDate,
  getHeroCooccurrence,
  getSkillSequenceHistory,
} from "@/lib/db/queries/battles";
import { validateUUID, parseOrError, ensureGuildContext } from "@/lib/action-helpers";

export async function createBattle(data: {
  memberId: string;
  date: string;
  battleType: string;
  result: string;
  enemyGuildName: string;
  enemyPlayerName: string;
  enemyCastleType?: string | null;
  enemyCastleNumber?: number | null;
  alliedTeam: unknown;
  enemyTeam: unknown;
  firstTurn: boolean | null;
  guildId?: string;
}) {
  const user = await requireOfficer();

  const guild = ensureGuildContext(user, data.guildId);
  if ("error" in guild) return guild;

  const parsed = parseOrError(battleCreateSchema, {
    ...data,
    guildId: guild.guildId,
    submittedByUserId: user.id,
  });
  if ("error" in parsed) return parsed;

  try {
    const battle = await dbCreateBattle(parsed.data);
    revalidatePath("/guild-war");
    updateTag(`battles-${guild.guildId}`);
    return { success: true, battleId: battle.id };
  } catch {
    return { error: "ไม่สามารถบันทึกการต่อสู้ได้" };
  }
}

export async function updateBattle(id: string, data: {
  memberId?: string;
  date?: string;
  battleType?: string;
  result?: string;
  enemyGuildName?: string;
  enemyPlayerName?: string;
  enemyCastleType?: string | null;
  enemyCastleNumber?: number | null;
  alliedTeam?: unknown;
  enemyTeam?: unknown;
  firstTurn?: boolean | null;
}) {
  const user = await requireOfficer();

  const invalid = validateUUID(id);
  if (invalid) return invalid;

  const existing = await getBattleById(id);
  if (!existing) return { error: "ไม่พบข้อมูลการต่อสู้" };
  if (user.role !== "admin" && existing.guildId !== user.guildId) return { error: "ไม่มีสิทธิ์" };

  const parsed = parseOrError(battleUpdateSchema, data);
  if ("error" in parsed) return parsed;

  try {
    const battle = await dbUpdateBattle(id, parsed.data);
    if (!battle) return { error: "ไม่พบข้อมูลการต่อสู้" };
    revalidatePath("/guild-war");
    updateTag(`battles-${existing.guildId}`);
    return { success: true };
  } catch {
    return { error: "ไม่สามารถอัปเดตการต่อสู้ได้" };
  }
}

export async function deleteBattle(id: string) {
  const user = await requireOfficer();

  const invalid = validateUUID(id);
  if (invalid) return invalid;

  const existing = await getBattleById(id);
  if (!existing) return { error: "ไม่พบข้อมูลการต่อสู้" };
  if (user.role !== "admin" && existing.guildId !== user.guildId) return { error: "ไม่มีสิทธิ์" };

  try {
    await dbDeleteBattle(id);
    revalidatePath("/guild-war");
    updateTag(`battles-${existing.guildId}`);
    return { success: true };
  } catch {
    return { error: "ไม่สามารถลบการต่อสู้ได้" };
  }
}

export async function getBattleContext(guildId: string, memberId: string, date: string) {
  await requireOfficer();

  const [memberCount, enemyGuildName, enemyPlayerNames] = await Promise.all([
    memberId
      ? getMemberBattleCountForDate(guildId, memberId, date)
      : Promise.resolve(0),
    getEnemyGuildNameForDate(guildId, date),
    getEnemyPlayerNamesForDate(guildId, date),
  ]);

  return {
    memberBattleCount: memberCount,
    enemyGuildName,
    enemyPlayerNames,
  };
}

export async function fetchSuggestionData(guildId: string) {
  await requireOfficer();

  const [heroCooccurrence, skillSequenceHistory] = await Promise.all([
    getHeroCooccurrence(guildId),
    getSkillSequenceHistory(guildId),
  ]);
  return { heroCooccurrence, skillSequenceHistory };
}
