"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  heroCreateSchema,
  heroUpdateSchema,
  heroBulkSchema,
} from "@/lib/validations/hero";
import { uuidSchema } from "@/lib/validations/shared";
import {
  createHero as dbCreateHero,
  updateHero as dbUpdateHero,
  deleteHero as dbDeleteHero,
  bulkCreateHeroes,
} from "@/lib/db/queries/heroes";

export async function createHero(formData: FormData) {
  await requireAdmin();

  const raw = {
    name: formData.get("name") as string,
    heroType: formData.get("heroType") as string,
    rarity: formData.get("rarity") as string,
    imageUrl: (formData.get("imageUrl") as string) || "",
    skill1Type: formData.get("skill1Type") as string,
    skill2Type: formData.get("skill2Type") as string,
    skill3Type: formData.get("skill3Type") as string,
  };

  const parsed = heroCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await dbCreateHero(parsed.data);
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.includes("unique constraint")
    ) {
      return { error: "ฮีโร่ชื่อนี้มีอยู่แล้ว" };
    }
    return { error: "ไม่สามารถสร้างฮีโร่ได้" };
  }

  revalidatePath("/admin/heroes");
  return { success: true };
}

export async function updateHero(id: string, formData: FormData) {
  await requireAdmin();

  if (!uuidSchema.safeParse(id).success) {
    return { error: "ID ไม่ถูกต้อง" };
  }

  const raw: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && value !== "") {
      raw[key] = value;
    }
  }
  // imageUrl can be intentionally empty (remove image)
  const imageUrlValue = formData.get("imageUrl");
  if (typeof imageUrlValue === "string") {
    raw.imageUrl = imageUrlValue;
  }

  const parsed = heroUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const hero = await dbUpdateHero(id, parsed.data);
    if (!hero) return { error: "ไม่พบฮีโร่" };
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.includes("unique constraint")
    ) {
      return { error: "ฮีโร่ชื่อนี้มีอยู่แล้ว" };
    }
    return { error: "ไม่สามารถอัปเดตฮีโร่ได้" };
  }

  revalidatePath("/admin/heroes");
  return { success: true };
}

export async function deleteHero(id: string) {
  await requireAdmin();

  if (!uuidSchema.safeParse(id).success) {
    return { error: "ID ไม่ถูกต้อง" };
  }

  const hero = await dbDeleteHero(id);
  if (!hero) return { error: "ไม่พบฮีโร่" };

  revalidatePath("/admin/heroes");
  return { success: true };
}

export async function bulkAddHeroes(input: string) {
  await requireAdmin();

  const names = input
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const parsed = heroBulkSchema.safeParse({ names });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const result = await bulkCreateHeroes(parsed.data.names);
    revalidatePath("/admin/heroes");
    return { success: true, ...result };
  } catch {
    return { error: "ไม่สามารถนำเข้าฮีโร่ได้" };
  }
}
