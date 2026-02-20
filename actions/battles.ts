"use server";

import { z } from "zod";
import { requireOfficer } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  battleCreateSchema,
  battleUpdateSchema,
} from "@/lib/validations/battle";
import {
  createBattle as dbCreateBattle,
  updateBattle as dbUpdateBattle,
  deleteBattle as dbDeleteBattle,
  getBattleById,
} from "@/lib/db/queries/battles";

const uuidSchema = z.string().uuid();

export async function createBattle(data: {
  memberId: string;
  date: string;
  battleNumber: number;
  battleType: string;
  result: string;
  enemyGuildName: string;
  enemyPlayerName: string;
  alliedTeam: unknown;
  enemyTeam: unknown;
  firstTurn: boolean | null;
  videoUrl: string;
}) {
  const user = await requireOfficer();

  if (!user.guildId) {
    return { error: "คุณยังไม่ได้อยู่ในกิลด์" };
  }

  const parsed = battleCreateSchema.safeParse({
    ...data,
    guildId: user.guildId,
    submittedByUserId: user.id,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const battle = await dbCreateBattle(parsed.data);
    revalidatePath("/guild-war");
    return { success: true, battleId: battle.id };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique")) {
      return { error: "สมาชิกนี้มีข้อมูลการต่อสู้ในวันและครั้งที่นี้แล้ว" };
    }
    return { error: "ไม่สามารถบันทึกการต่อสู้ได้" };
  }
}

export async function updateBattle(id: string, data: {
  memberId?: string;
  date?: string;
  battleNumber?: number;
  battleType?: string;
  result?: string;
  enemyGuildName?: string;
  enemyPlayerName?: string;
  alliedTeam?: unknown;
  enemyTeam?: unknown;
  firstTurn?: boolean | null;
  videoUrl?: string;
}) {
  const user = await requireOfficer();

  if (!uuidSchema.safeParse(id).success) {
    return { error: "ID ไม่ถูกต้อง" };
  }

  const existing = await getBattleById(id);
  if (!existing) return { error: "ไม่พบข้อมูลการต่อสู้" };
  if (existing.guildId !== user.guildId) return { error: "ไม่มีสิทธิ์" };

  const parsed = battleUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const battle = await dbUpdateBattle(id, parsed.data);
    if (!battle) return { error: "ไม่พบข้อมูลการต่อสู้" };
    revalidatePath("/guild-war");
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique")) {
      return { error: "สมาชิกนี้มีข้อมูลการต่อสู้ในวันและครั้งที่นี้แล้ว" };
    }
    return { error: "ไม่สามารถอัปเดตการต่อสู้ได้" };
  }
}

export async function deleteBattle(id: string) {
  const user = await requireOfficer();

  if (!uuidSchema.safeParse(id).success) {
    return { error: "ID ไม่ถูกต้อง" };
  }

  const existing = await getBattleById(id);
  if (!existing) return { error: "ไม่พบข้อมูลการต่อสู้" };
  if (existing.guildId !== user.guildId) return { error: "ไม่มีสิทธิ์" };

  try {
    await dbDeleteBattle(id);
    revalidatePath("/guild-war");
    return { success: true };
  } catch {
    return { error: "ไม่สามารถลบการต่อสู้ได้" };
  }
}
