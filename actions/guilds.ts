"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { guildCreateSchema, guildUpdateSchema } from "@/lib/validations/guild";
import { uuidSchema } from "@/lib/validations/shared";
import {
  createGuild as dbCreateGuild,
  updateGuild as dbUpdateGuild,
  deleteGuild as dbDeleteGuild,
} from "@/lib/db/queries/guilds";
import { createAdminClient } from "@/lib/supabase/admin";
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

// ---------------------------------------------------------------------------
// Officer management — DB is source of truth, app_metadata is cache
// ---------------------------------------------------------------------------

export async function fetchGuildMembers(guildId: string) {
  await requireAdmin();
  if (!uuidSchema.safeParse(guildId).success) return [];
  return dbListGuildMembers(guildId);
}

export async function fetchGuildOfficers(guildId: string) {
  await requireAdmin();
  if (!uuidSchema.safeParse(guildId).success) return [];
  return dbListGuildOfficers(guildId);
}

export async function addOfficer(guildId: string, userId: string) {
  await requireAdmin();

  if (
    !uuidSchema.safeParse(guildId).success ||
    !uuidSchema.safeParse(userId).success
  ) {
    return { error: "ID ไม่ถูกต้อง" };
  }

  const user = await getUserFromDb(userId);
  if (!user) return { error: "ไม่พบผู้ใช้" };
  if (user.guildId !== guildId) {
    return { error: "ผู้ใช้ไม่ได้อยู่ในกิลด์นี้" };
  }
  if (user.role === "officer") {
    return { error: "ผู้ใช้นี้เป็นเจ้าหน้าที่อยู่แล้ว" };
  }

  // DB write (source of truth)
  await updateUserFields(userId, { role: "officer" });

  // Sync app_metadata (cache)
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: "officer", guildId },
  });

  revalidatePath("/admin/guilds");
  return { success: true };
}

export async function removeOfficer(guildId: string, userId: string) {
  await requireAdmin();

  if (
    !uuidSchema.safeParse(guildId).success ||
    !uuidSchema.safeParse(userId).success
  ) {
    return { error: "ID ไม่ถูกต้อง" };
  }

  const user = await getUserFromDb(userId);
  if (!user) return { error: "ไม่พบผู้ใช้" };
  if (user.guildId !== guildId || user.role !== "officer") {
    return { error: "ไม่พบเจ้าหน้าที่" };
  }

  // DB write (source of truth)
  await updateUserFields(userId, { role: "member" });

  // Sync app_metadata (cache)
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: "member", guildId },
  });

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

  if (!uuidSchema.safeParse(userId).success) {
    return { error: "ID ไม่ถูกต้อง" };
  }

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

  if (
    !uuidSchema.safeParse(userId).success ||
    !uuidSchema.safeParse(guildId).success
  ) {
    return { error: "ID ไม่ถูกต้อง" };
  }

  const user = await getUserFromDb(userId);
  if (!user) return { error: "ไม่พบผู้ใช้" };

  // DB write (source of truth)
  await updateUserFields(userId, { role, guildId, accessStatus: "approved" });

  // Sync app_metadata (cache)
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role, guildId, accessStatus: "approved" },
  });

  revalidatePath("/admin/guilds");
  revalidatePath("/admin/users");
  return { success: true };
}

export async function removeUserFromGuild(userId: string) {
  await requireAdmin();

  if (!uuidSchema.safeParse(userId).success) {
    return { error: "ID ไม่ถูกต้อง" };
  }

  const user = await getUserFromDb(userId);
  if (!user) return { error: "ไม่พบผู้ใช้" };

  // DB write (source of truth)
  await updateUserFields(userId, { role: "member", guildId: null, accessStatus: null });

  // Sync app_metadata (cache)
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: "member", guildId: null, accessStatus: null },
  });

  revalidatePath("/admin/guilds");
  revalidatePath("/admin/users");
  return { success: true };
}

export async function promoteToAdmin(userId: string) {
  await requireAdmin();

  if (!uuidSchema.safeParse(userId).success) {
    return { error: "ID ไม่ถูกต้อง" };
  }

  const user = await getUserFromDb(userId);
  if (!user) return { error: "ไม่พบผู้ใช้" };

  // DB write (source of truth)
  await updateUserFields(userId, { role: "admin" });

  // Sync app_metadata (cache)
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: "admin" },
  });

  revalidatePath("/admin/guilds");
  revalidatePath("/admin/users");
  return { success: true };
}
