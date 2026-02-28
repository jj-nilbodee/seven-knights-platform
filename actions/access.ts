"use server";

import { requireOfficer } from "@/lib/auth";
import { validateUUID } from "@/lib/action-helpers";
import { updateAccessStatus } from "@/lib/db/queries/access";
import { revalidatePath } from "next/cache";

export async function approveAccessRequest(requestId: string) {
  const invalid = validateUUID(requestId);
  if (invalid) return invalid;

  try {
    const user = await requireOfficer();
    await updateAccessStatus(requestId, "approved", user.id);
    revalidatePath("/access-requests");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function rejectAccessRequest(requestId: string) {
  const invalid = validateUUID(requestId);
  if (invalid) return invalid;

  try {
    const user = await requireOfficer();
    await updateAccessStatus(requestId, "rejected", user.id);
    revalidatePath("/access-requests");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function revokeAccess(requestId: string) {
  const invalid = validateUUID(requestId);
  if (invalid) return invalid;

  try {
    const user = await requireOfficer();
    await updateAccessStatus(requestId, "rejected", user.id);
    revalidatePath("/access-requests");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}
