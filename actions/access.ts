"use server";

import { requireOfficer } from "@/lib/auth";
import { updateAccessStatus } from "@/lib/db/queries/access";
import { revalidatePath } from "next/cache";

export async function approveAccessRequest(requestId: string) {
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
  try {
    const user = await requireOfficer();
    await updateAccessStatus(requestId, "rejected", user.id);
    revalidatePath("/access-requests");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}
