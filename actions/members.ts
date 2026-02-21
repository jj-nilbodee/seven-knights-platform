"use server";

import { requireOfficer } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  memberCreateSchema,
  memberUpdateSchema,
  memberBulkSchema,
} from "@/lib/validations/member";
import { uuidSchema } from "@/lib/validations/shared";
import {
  createMember as dbCreateMember,
  updateMember as dbUpdateMember,
  bulkCreateMembers,
} from "@/lib/db/queries/members";

export async function createMember(formData: FormData, overrideGuildId?: string) {
  const user = await requireOfficer();

  const effectiveGuildId = (user.role === "admin" && overrideGuildId) ? overrideGuildId : user.guildId;
  const parsed = memberCreateSchema.safeParse({
    guildId: effectiveGuildId,
    ign: formData.get("ign") as string,
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
  if (user.role !== "admin" && existing.guildId !== user.guildId) return { error: "ไม่มีสิทธิ์" };

  const raw: Record<string, unknown> = {};
  const ign = formData.get("ign") as string;
  const status = formData.get("status") as string;

  if (ign) raw.ign = ign;
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

export async function bulkAddMembers(input: string, overrideGuildId?: string) {
  const user = await requireOfficer();

  const effectiveGuildId = (user.role === "admin" && overrideGuildId) ? overrideGuildId : user.guildId;
  if (!effectiveGuildId) {
    return { error: "คุณยังไม่ได้อยู่ในกิลด์" };
  }

  // Parse input: each line is an IGN
  const entries = input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ ign: line }));

  const parsed = memberBulkSchema.safeParse({
    guildId: effectiveGuildId,
    entries,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const result = await bulkCreateMembers(effectiveGuildId, parsed.data.entries);
    revalidatePath("/roster");
    return { success: true, ...result };
  } catch {
    return { error: "ไม่สามารถนำเข้าสมาชิกได้" };
  }
}
