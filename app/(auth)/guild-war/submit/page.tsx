import { requireGuild, NO_GUILD_MESSAGE } from "@/lib/auth";
import { listMembers } from "@/lib/db/queries/members";
import { listHeroes } from "@/lib/db/queries/heroes";
import { getHeroCooccurrence, getSkillSequenceHistory } from "@/lib/db/queries/battles";
import { BattleSubmitClient } from "./submit-client";

export default async function BattleSubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ guildId?: string }>;
}) {
  const result = await requireGuild(await searchParams);
  if (!result) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        {NO_GUILD_MESSAGE}
      </div>
    );
  }
  const { guildId } = result;

  const [members, heroes, heroCooccurrence, skillSequenceHistory] = await Promise.all([
    listMembers(guildId),
    listHeroes({ isActive: true }),
    getHeroCooccurrence(guildId),
    getSkillSequenceHistory(guildId),
  ]);

  return (
    <BattleSubmitClient
      members={members}
      heroes={heroes}
      guildId={guildId}
      heroCooccurrence={heroCooccurrence}
      skillSequenceHistory={skillSequenceHistory}
    />
  );
}
