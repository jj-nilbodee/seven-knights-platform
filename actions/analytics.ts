"use server";

import { requireOfficer } from "@/lib/auth";
import { getCounterRecommendations } from "@/lib/db/queries/analytics";
import { ensureGuildContext } from "@/lib/action-helpers";

export async function searchCounterRecommendations(
  enemyHeroIds: string[],
  overrideGuildId?: string,
) {
  const user = await requireOfficer();

  const guild = ensureGuildContext(user, overrideGuildId);
  if ("error" in guild) return guild;

  if (enemyHeroIds.length === 0 || enemyHeroIds.length > 5) {
    return { error: "กรุณาเลือกฮีโร่ศัตรู 1-5 ตัว" };
  }

  const result = await getCounterRecommendations(
    guild.guildId,
    enemyHeroIds,
    90,
  );

  return { data: result };
}
