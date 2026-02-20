"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { guildCreateSchema, guildUpdateSchema } from "@/lib/validations/guild";
import {
  createGuild as dbCreateGuild,
  updateGuild as dbUpdateGuild,
  deleteGuild as dbDeleteGuild,
  getGuildOfficers as dbGetGuildOfficers,
  addOfficer as dbAddOfficer,
  removeOfficer as dbRemoveOfficer,
  getUserByEmail,
} from "@/lib/db/queries/guilds";

const uuidSchema = z.string().uuid();

export async function createGuild(formData: FormData) {
  await requireAdmin();

  const parsed = guildCreateSchema.safeParse({
    name: formData.get("name") as string,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await dbCreateGuild(parsed.data);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique constraint")) {
      return { error: "กิลด์ชื่อนี้มีอยู่แล้ว" };
    }
    return { error: "ไม่สามารถสร้างกิลด์ได้" };
  }

  revalidatePath("/admin/guilds");
  return { success: true };
}

export async function updateGuild(id: string, formData: FormData) {
  await requireAdmin();

  if (!uuidSchema.safeParse(id).success) {
    return { error: "ID ไม่ถูกต้อง" };
  }

  const parsed = guildUpdateSchema.safeParse({
    name: formData.get("name") as string,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const guild = await dbUpdateGuild(id, parsed.data);
    if (!guild) return { error: "ไม่พบกิลด์" };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique constraint")) {
      return { error: "กิลด์ชื่อนี้มีอยู่แล้ว" };
    }
    return { error: "ไม่สามารถอัปเดตกิลด์ได้" };
  }

  revalidatePath("/admin/guilds");
  return { success: true };
}

export async function deleteGuild(id: string) {
  await requireAdmin();

  if (!uuidSchema.safeParse(id).success) {
    return { error: "ID ไม่ถูกต้อง" };
  }

  const guild = await dbDeleteGuild(id);
  if (!guild) return { error: "ไม่พบกิลด์" };

  revalidatePath("/admin/guilds");
  return { success: true };
}

export async function fetchGuildOfficers(guildId: string) {
  await requireAdmin();

  if (!uuidSchema.safeParse(guildId).success) return [];

  return dbGetGuildOfficers(guildId);
}

export async function addOfficer(guildId: string, email: string) {
  await requireAdmin();

  if (!uuidSchema.safeParse(guildId).success) {
    return { error: "Guild ID ไม่ถูกต้อง" };
  }

  const emailParsed = z.string().email().safeParse(email);
  if (!emailParsed.success) {
    return { error: "อีเมลไม่ถูกต้อง" };
  }

  const user = await getUserByEmail(emailParsed.data);
  if (!user) {
    return { error: "ไม่พบผู้ใช้ที่ใช้อีเมลนี้" };
  }

  try {
    await dbAddOfficer(guildId, user.id);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique")) {
      return { error: "ผู้ใช้นี้เป็นเจ้าหน้าที่อยู่แล้ว" };
    }
    return { error: "ไม่สามารถเพิ่มเจ้าหน้าที่ได้" };
  }

  revalidatePath("/admin/guilds");
  return { success: true };
}

export async function removeOfficer(guildId: string, userId: string) {
  await requireAdmin();

  if (!uuidSchema.safeParse(guildId).success || !uuidSchema.safeParse(userId).success) {
    return { error: "ID ไม่ถูกต้อง" };
  }

  const removed = await dbRemoveOfficer(guildId, userId);
  if (!removed) return { error: "ไม่พบเจ้าหน้าที่" };

  revalidatePath("/admin/guilds");
  return { success: true };
}
