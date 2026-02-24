"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { guildCreateSchema, guildUpdateSchema } from "@/lib/validations/guild";
import {
  createGuild as dbCreateGuild,
  updateGuild as dbUpdateGuild,
  deleteGuild as dbDeleteGuild,
} from "@/lib/db/queries/guilds";
import { db } from "@/lib/db";
import { users as usersTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  getUserFromDb,
  listGuildMembers as dbListGuildMembers,
  listGuildOfficers as dbListGuildOfficers,
  listAllUsersFromDb,
  listUnassignedUsers as dbListUnassignedUsers,
  updateUserFields,
} from "@/lib/db/queries/users";
import { validateUUID, parseOrError, handleDbError, syncUserMetadata } from "@/lib/action-helpers";

export async function createGuild(formData: FormData) {
  await requireAdmin();

  const parsed = parseOrError(guildCreateSchema, {
    name: formData.get("name") as string,
  });
  if ("error" in parsed) return parsed;

  try {
    await dbCreateGuild(parsed.data);
  } catch (err: unknown) {
    return handleDbError(err, { unique: "กิลด์ชื่อนี้มีอยู่แล้ว", generic: "ไม่สามารถสร้างกิลด์ได้" });
  }

  revalidatePath("/admin/guilds");
  return { success: true };
}

export async function updateGuild(id: string, formData: FormData) {
  await requireAdmin();

  const invalid = validateUUID(id);
  if (invalid) return invalid;

  const parsed = parseOrError(guildUpdateSchema, {
    name: formData.get("name") as string,
  });
  if ("error" in parsed) return parsed;

  try {
    const guild = await dbUpdateGuild(id, parsed.data);
    if (!guild) return { error: "ไม่พบกิลด์" };
  } catch (err: unknown) {
    return handleDbError(err, { unique: "กิลด์ชื่อนี้มีอยู่แล้ว", generic: "ไม่สามารถอัปเดตกิลด์ได้" });
  }

  revalidatePath("/admin/guilds");
  return { success: true };
}

export async function deleteGuild(id: string) {
  await requireAdmin();

  const invalid = validateUUID(id);
  if (invalid) return invalid;

  const guild = await dbDeleteGuild(id);
  if (!guild) return { error: "ไม่พบกิลด์" };

  revalidatePath("/admin/guilds");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Officer management — DB is source of truth, app_metadata is cache
// ---------------------------------------------------------------------------

export async function fetchGuildMembers(guildId: string) {
  await requireAdmin();
  if (validateUUID(guildId)) return [];
  return dbListGuildMembers(guildId);
}

export async function fetchGuildOfficers(guildId: string) {
  await requireAdmin();
  if (validateUUID(guildId)) return [];
  return dbListGuildOfficers(guildId);
}

export async function addOfficer(guildId: string, userId: string) {
  await requireAdmin();

  const invalidGuild = validateUUID(guildId);
  const invalidUser = validateUUID(userId);
  if (invalidGuild || invalidUser) return { error: "ID ไม่ถูกต้อง" };

  const user = await getUserFromDb(userId);
  if (!user) return { error: "ไม่พบผู้ใช้" };
  if (user.guildId !== guildId) return { error: "ผู้ใช้ไม่ได้อยู่ในกิลด์นี้" };
  if (user.role === "officer") return { error: "ผู้ใช้นี้เป็นเจ้าหน้าที่อยู่แล้ว" };

  await updateUserFields(userId, { role: "officer" });
  await syncUserMetadata(userId, { role: "officer", guildId });

  revalidatePath("/admin/guilds");
  return { success: true };
}

export async function removeOfficer(guildId: string, userId: string) {
  await requireAdmin();

  const invalidGuild = validateUUID(guildId);
  const invalidUser = validateUUID(userId);
  if (invalidGuild || invalidUser) return { error: "ID ไม่ถูกต้อง" };

  const user = await getUserFromDb(userId);
  if (!user) return { error: "ไม่พบผู้ใช้" };
  if (user.guildId !== guildId || user.role !== "officer") return { error: "ไม่พบเจ้าหน้าที่" };

  await updateUserFields(userId, { role: "member" });
  await syncUserMetadata(userId, { role: "member", guildId });

  revalidatePath("/admin/guilds");
  return { success: true };
}

// ---------------------------------------------------------------------------
// User management — assign / remove / promote
// ---------------------------------------------------------------------------

export async function fetchAllUsers() {
  await requireAdmin();

  const rows = await listAllUsersFromDb();
  return rows.map((u) => ({
    userId: u.userId,
    email: u.email,
    role: u.role,
    guildId: u.guildId,
    displayName: u.displayName ?? "",
    createdAt: u.createdAt ? u.createdAt.toISOString() : null,
  }));
}

export async function updateUserDisplayName(userId: string, displayName: string) {
  await requireAdmin();

  const invalid = validateUUID(userId);
  if (invalid) return invalid;

  const trimmed = displayName.trim();
  if (trimmed.length > 100) {
    return { error: "ชื่อยาวเกินไป (สูงสุด 100 ตัวอักษร)" };
  }

  await db.update(usersTable).set({ displayName: trimmed }).where(eq(usersTable.id, userId));

  revalidatePath("/admin/users");
  return { success: true };
}

export async function fetchUnassignedUsers() {
  await requireAdmin();

  const rows = await dbListUnassignedUsers();
  return rows.map((u) => ({
    userId: u.userId,
    email: u.email,
    createdAt: u.createdAt ? u.createdAt.toISOString() : null,
  }));
}

export async function assignUserToGuild(
  userId: string,
  guildId: string,
  role: "member" | "officer",
) {
  await requireAdmin();

  const invalidUser = validateUUID(userId);
  const invalidGuild = validateUUID(guildId);
  if (invalidUser || invalidGuild) return { error: "ID ไม่ถูกต้อง" };

  const user = await getUserFromDb(userId);
  if (!user) return { error: "ไม่พบผู้ใช้" };

  await updateUserFields(userId, { role, guildId, accessStatus: "approved" });
  await syncUserMetadata(userId, { role, guildId, accessStatus: "approved" });

  revalidatePath("/admin/guilds");
  revalidatePath("/admin/users");
  return { success: true };
}

export async function removeUserFromGuild(userId: string) {
  await requireAdmin();

  const invalid = validateUUID(userId);
  if (invalid) return invalid;

  const user = await getUserFromDb(userId);
  if (!user) return { error: "ไม่พบผู้ใช้" };

  await updateUserFields(userId, { role: "member", guildId: null, accessStatus: null });
  await syncUserMetadata(userId, { role: "member", guildId: null, accessStatus: null });

  revalidatePath("/admin/guilds");
  revalidatePath("/admin/users");
  return { success: true };
}

export async function promoteToAdmin(userId: string) {
  await requireAdmin();

  const invalid = validateUUID(userId);
  if (invalid) return invalid;

  const user = await getUserFromDb(userId);
  if (!user) return { error: "ไม่พบผู้ใช้" };

  await updateUserFields(userId, { role: "admin" });
  await syncUserMetadata(userId, { role: "admin" });

  revalidatePath("/admin/guilds");
  revalidatePath("/admin/users");
  return { success: true };
}
