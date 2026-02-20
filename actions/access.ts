"use server";

import { z } from "zod";
import { requireUser, requireOfficer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  updateAccessStatus,
  createAccessRequest,
  getAccessRequestByUser,
  getAccessRequestById,
} from "@/lib/db/queries/access";

const uuidSchema = z.string().uuid();

export async function requestAccess(guildId: string) {
  const user = await requireUser();

  if (!uuidSchema.safeParse(guildId).success) {
    return { error: "ID ไม่ถูกต้อง" };
  }

  try {
    await createAccessRequest(user.id, guildId);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique")) {
      return { error: "คุณได้ส่งคำขอไปแล้ว" };
    }
    return { error: "ไม่สามารถส่งคำขอได้" };
  }

  return { success: true };
}

export async function approveAccessRequest(requestId: string) {
  const officer = await requireOfficer();

  if (!uuidSchema.safeParse(requestId).success) {
    return { error: "ID ไม่ถูกต้อง" };
  }

  // Verify the request belongs to the officer's guild
  const existing = await getAccessRequestById(requestId);
  if (!existing) return { error: "ไม่พบคำขอ" };
  if (existing.guildId !== officer.guildId) return { error: "ไม่มีสิทธิ์" };

  const row = await updateAccessStatus(requestId, "approved", officer.id);
  if (!row) return { error: "ไม่พบคำขอ" };

  // Set user's app_metadata to grant access
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(row.userId, {
    app_metadata: {
      role: "member",
      guildId: row.guildId,
      accessStatus: "approved",
    },
  });

  revalidatePath("/access-requests");
  return { success: true };
}

export async function rejectAccessRequest(requestId: string) {
  const officer = await requireOfficer();

  if (!uuidSchema.safeParse(requestId).success) {
    return { error: "ID ไม่ถูกต้อง" };
  }

  // Verify the request belongs to the officer's guild
  const existing = await getAccessRequestById(requestId);
  if (!existing) return { error: "ไม่พบคำขอ" };
  if (existing.guildId !== officer.guildId) return { error: "ไม่มีสิทธิ์" };

  const row = await updateAccessStatus(requestId, "rejected", officer.id);
  if (!row) return { error: "ไม่พบคำขอ" };

  // Clear guild access from app_metadata on rejection
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(row.userId, {
    app_metadata: { role: "member", guildId: null, accessStatus: "rejected" },
  });

  revalidatePath("/access-requests");
  return { success: true };
}

export async function revokeAccess(requestId: string) {
  const officer = await requireOfficer();

  if (!uuidSchema.safeParse(requestId).success) {
    return { error: "ID ไม่ถูกต้อง" };
  }

  // Verify the request belongs to the officer's guild
  const existing = await getAccessRequestById(requestId);
  if (!existing) return { error: "ไม่พบคำขอ" };
  if (existing.guildId !== officer.guildId) return { error: "ไม่มีสิทธิ์" };

  const row = await updateAccessStatus(requestId, "rejected", officer.id);
  if (!row) return { error: "ไม่พบคำขอ" };

  // Remove guild access from app_metadata
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(row.userId, {
    app_metadata: { role: "member", guildId: null, accessStatus: "revoked" },
  });

  revalidatePath("/access-requests");
  return { success: true };
}
