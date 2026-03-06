"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function uploadEquipmentImage(formData: FormData) {
  const memberId = formData.get("memberId") as string;
  const criterionId = formData.get("criterionId") as string;
  const file = formData.get("file") as File;

  if (!memberId || !criterionId || !file) {
    return { error: "ข้อมูลไม่ครบ" };
  }

  const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
  const path = `equipment/${memberId}/${criterionId}-${Date.now()}.${ext}`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from("hero-images")
    .upload(path, file, { upsert: true });

  if (error) {
    return { error: `อัปโหลดไม่สำเร็จ: ${error.message}` };
  }

  return { success: true };
}
