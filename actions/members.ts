"use server";

import { requireOfficer } from "@/lib/auth";
import { revalidatePath, updateTag } from "next/cache";
import {
  memberCreateSchema,
  memberUpdateSchema,
  memberBulkSchema,
} from "@/lib/validations/member";
import {
  createMember as dbCreateMember,
  updateMember as dbUpdateMember,
  bulkCreateMembers,
  getMemberById,
} from "@/lib/db/queries/members";
import { validateUUID, parseOrError, ensureGuildContext, handleDbError } from "@/lib/action-helpers";

export async function createMember(formData: FormData, overrideGuildId?: string) {
  const user = await requireOfficer();

  const guild = ensureGuildContext(user, overrideGuildId);
  if ("error" in guild) return guild;

  const parsed = parseOrError(memberCreateSchema, {
    guildId: guild.guildId,
    ign: formData.get("ign") as string,
  });
  if ("error" in parsed) return parsed;

  try {
    await dbCreateMember(parsed.data);
  } catch (err: unknown) {
    return handleDbError(err, { unique: "IGN นี้มีอยู่ในกิลด์แล้ว", generic: "ไม่สามารถเพิ่มสมาชิกได้" });
  }

  revalidatePath("/roster");
  updateTag(`members-${guild.guildId}`);
  return { success: true };
}

export async function updateMember(id: string, formData: FormData) {
  const user = await requireOfficer();

  const invalid = validateUUID(id);
  if (invalid) return invalid;

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

  const parsed = parseOrError(memberUpdateSchema, raw);
  if ("error" in parsed) return parsed;

  try {
    const member = await dbUpdateMember(id, parsed.data);
    if (!member) return { error: "ไม่พบสมาชิก" };
  } catch (err: unknown) {
    return handleDbError(err, { unique: "IGN นี้มีอยู่ในกิลด์แล้ว", generic: "ไม่สามารถอัปเดตสมาชิกได้" });
  }

  revalidatePath("/roster");
  updateTag(`members-${existing.guildId}`);
  return { success: true };
}

export async function bulkAddMembers(input: string, overrideGuildId?: string) {
  const user = await requireOfficer();

  const guild = ensureGuildContext(user, overrideGuildId);
  if ("error" in guild) return guild;

  // Parse input: each line is an IGN
  const entries = input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ ign: line }));

  const parsed = parseOrError(memberBulkSchema, {
    guildId: guild.guildId,
    entries,
  });
  if ("error" in parsed) return parsed;

  try {
    const result = await bulkCreateMembers(guild.guildId, parsed.data.entries);
    revalidatePath("/roster");
    updateTag(`members-${guild.guildId}`);
    return { success: true, ...result };
  } catch {
    return { error: "ไม่สามารถนำเข้าสมาชิกได้" };
  }
}
