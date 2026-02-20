"use server";

import { requireOfficer } from "@/lib/auth";
import { getCounterRecommendations } from "@/lib/db/queries/analytics";

export async function searchCounterRecommendations(
  enemyHeroIds: string[],
  formation: string | null,
) {
  const user = await requireOfficer();
  if (!user.guildId) {
    return { error: "ไม่พบกิลด์" };
  }

  if (enemyHeroIds.length === 0 || enemyHeroIds.length > 5) {
    return { error: "กรุณาเลือกฮีโร่ศัตรู 1-5 ตัว" };
  }

  const result = await getCounterRecommendations(
    user.guildId,
    enemyHeroIds,
    formation,
    90,
  );

  return { data: result };
}
