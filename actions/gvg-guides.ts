"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  guideCreateSchema,
  guideUpdateSchema,
} from "@/lib/validations/guide";
import {
  createGuide as dbCreateGuide,
  updateGuide as dbUpdateGuide,
  deleteGuide as dbDeleteGuide,
  getGuideById,
} from "@/lib/db/queries/gvg-guides";
import { validateUUID, parseOrError } from "@/lib/action-helpers";

export async function createGuide(data: {
  title: string;
  defenseHeroes: string[];
  attackHeroes: string[];
  attackPriority: number;
  attackSkillOrder: unknown;
  defenseSkillOrder: unknown;
  strategyNotes: string;
  mediaUrls: string[];
  patchVersion: string;
  status: string;
}) {
  const user = await requireAdmin();

  const parsed = parseOrError(guideCreateSchema, data);
  if ("error" in parsed) return parsed;

  try {
    const guide = await dbCreateGuide({
      ...parsed.data,
      createdBy: user.id,
    });
    revalidatePath("/gvg-guides");
    revalidatePath("/admin/gvg-guides");
    return { success: true, guideId: guide.id };
  } catch {
    return { error: "ไม่สามารถสร้างคู่มือได้" };
  }
}

export async function updateGvgGuide(
  id: string,
  data: {
    title?: string;
    defenseHeroes?: string[];
    attackHeroes?: string[];
    attackPriority?: number;
    attackSkillOrder?: unknown;
    defenseSkillOrder?: unknown;
    strategyNotes?: string;
    mediaUrls?: string[];
    patchVersion?: string;
    status?: string;
  },
) {
  await requireAdmin();

  const invalid = validateUUID(id);
  if (invalid) return invalid;

  const existing = await getGuideById(id);
  if (!existing) return { error: "ไม่พบคู่มือ" };

  const parsed = parseOrError(guideUpdateSchema, data);
  if ("error" in parsed) return parsed;

  try {
    const guide = await dbUpdateGuide(id, parsed.data);
    if (!guide) return { error: "ไม่พบคู่มือ" };
    revalidatePath("/gvg-guides");
    revalidatePath(`/gvg-guides/${id}`);
    revalidatePath("/admin/gvg-guides");
    return { success: true };
  } catch {
    return { error: "ไม่สามารถอัปเดตคู่มือได้" };
  }
}

export async function deleteGvgGuide(id: string) {
  await requireAdmin();

  const invalid = validateUUID(id);
  if (invalid) return invalid;

  const existing = await getGuideById(id);
  if (!existing) return { error: "ไม่พบคู่มือ" };

  try {
    await dbDeleteGuide(id);
    revalidatePath("/gvg-guides");
    revalidatePath("/admin/gvg-guides");
    return { success: true };
  } catch {
    return { error: "ไม่สามารถลบคู่มือได้" };
  }
}
