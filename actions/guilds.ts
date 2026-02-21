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
// Officer management via Supabase Auth app_metadata
// ---------------------------------------------------------------------------

export async function fetchGuildMembers(guildId: string) {
  await requireAdmin();

  if (!uuidSchema.safeParse(guildId).success) return [];

  const admin = createAdminClient();
  const allUsers = await listAllUsers(admin);

  return allUsers
    .filter(
      (u) =>
        u.app_metadata?.guildId === guildId &&
        u.app_metadata?.role === "member",
    )
    .map((u) => ({
      userId: u.id,
      email: u.email ?? "",
    }));
}

export async function fetchGuildOfficers(guildId: string) {
  await requireAdmin();

  if (!uuidSchema.safeParse(guildId).success) return [];

  const admin = createAdminClient();
  const allUsers = await listAllUsers(admin);

  return allUsers
    .filter(
      (u) =>
        u.app_metadata?.guildId === guildId &&
        u.app_metadata?.role === "officer",
    )
    .map((u) => ({
      userId: u.id,
      email: u.email ?? "",
    }));
}

// Paginate through all Supabase users (default listUsers returns max 50)
async function listAllUsers(admin: ReturnType<typeof createAdminClient>) {
  const perPage = 1000;
  let page = 1;
  let batch;
  const all = [] as Array<{ id: string; email?: string; app_metadata: Record<string, unknown> }>;

  do {
    const { data: { users } } = await admin.auth.admin.listUsers({ page, perPage });
    batch = users;
    for (const u of batch) all.push(u);
    page++;
  } while (batch.length >= perPage);

  return all;
}

export async function addOfficer(guildId: string, userId: string) {
  await requireAdmin();

  if (
    !uuidSchema.safeParse(guildId).success ||
    !uuidSchema.safeParse(userId).success
  ) {
    return { error: "ID ไม่ถูกต้อง" };
  }

  const admin = createAdminClient();

  // Verify the user exists and belongs to this guild
  const {
    data: { user },
  } = await admin.auth.admin.getUserById(userId);
  if (!user) return { error: "ไม่พบผู้ใช้" };
  if (user.app_metadata?.guildId !== guildId) {
    return { error: "ผู้ใช้ไม่ได้อยู่ในกิลด์นี้" };
  }
  if (user.app_metadata?.role === "officer") {
    return { error: "ผู้ใช้นี้เป็นเจ้าหน้าที่อยู่แล้ว" };
  }

  // Promote via app_metadata
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

  const admin = createAdminClient();

  // Verify the user is an officer of this guild
  const {
    data: { user },
  } = await admin.auth.admin.getUserById(userId);
  if (!user) return { error: "ไม่พบผู้ใช้" };
  if (
    user.app_metadata?.guildId !== guildId ||
    user.app_metadata?.role !== "officer"
  ) {
    return { error: "ไม่พบเจ้าหน้าที่" };
  }

  // Demote to member (keep guildId)
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: "member", guildId },
  });

  revalidatePath("/admin/guilds");
  return { success: true };
}
