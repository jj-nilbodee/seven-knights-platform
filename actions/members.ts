"use server";

import { z } from "zod";
import { requireOfficer } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  memberCreateSchema,
  memberUpdateSchema,
  memberBulkSchema,
} from "@/lib/validations/member";
import {
  createMember as dbCreateMember,
  updateMember as dbUpdateMember,
  bulkCreateMembers,
} from "@/lib/db/queries/members";

const uuidSchema = z.string().uuid();

export async function createMember(formData: FormData) {
  const user = await requireOfficer();

  const parsed = memberCreateSchema.safeParse({
    guildId: user.guildId,
    ign: formData.get("ign") as string,
    nickname: formData.get("nickname") as string,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await dbCreateMember(parsed.data);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique")) {
      return { error: "IGN นี้มีอยู่ในกิลด์แล้ว" };
    }
    return { error: "ไม่สามารถเพิ่มสมาชิกได้" };
  }

  revalidatePath("/roster");
  return { success: true };
}

export async function updateMember(id: string, formData: FormData) {
  const user = await requireOfficer();

  if (!uuidSchema.safeParse(id).success) {
    return { error: "ID ไม่ถูกต้อง" };
  }

  // Verify the member belongs to the officer's guild
  const { getMemberById } = await import("@/lib/db/queries/members");
  const existing = await getMemberById(id);
  if (!existing) return { error: "ไม่พบสมาชิก" };
  if (existing.guildId !== user.guildId) return { error: "ไม่มีสิทธิ์" };

  const raw: Record<string, unknown> = {};
  const ign = formData.get("ign") as string;
  const nickname = formData.get("nickname") as string;
  const status = formData.get("status") as string;

  if (ign) raw.ign = ign;
  if (nickname) raw.nickname = nickname;
  if (status) raw.status = status;

  // Handle isActive based on status
  if (status === "inactive") {
    raw.isActive = false;
  } else if (status === "active") {
    raw.isActive = true;
  }

  const parsed = memberUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const member = await dbUpdateMember(id, parsed.data);
    if (!member) return { error: "ไม่พบสมาชิก" };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique")) {
      return { error: "IGN นี้มีอยู่ในกิลด์แล้ว" };
    }
    return { error: "ไม่สามารถอัปเดตสมาชิกได้" };
  }

  revalidatePath("/roster");
  return { success: true };
}

export async function bulkAddMembers(input: string) {
  const user = await requireOfficer();

  if (!user.guildId) {
    return { error: "คุณยังไม่ได้อยู่ในกิลด์" };
  }

  // Parse CSV-like input: each line is "ign,nickname" or just "ign"
  const entries = input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return { ign: parts[0], nickname: parts[1] || parts[0] };
    });

  const parsed = memberBulkSchema.safeParse({
    guildId: user.guildId,
    entries,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const result = await bulkCreateMembers(user.guildId, parsed.data.entries);
    revalidatePath("/roster");
    return { success: true, ...result };
  } catch {
    return { error: "ไม่สามารถนำเข้าสมาชิกได้" };
  }
}
