import { requireGuild, NO_GUILD_MESSAGE } from "@/lib/auth";
import { listMembers } from "@/lib/db/queries/members";
import { listHeroes } from "@/lib/db/queries/heroes";
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

  const [members, heroes] = await Promise.all([
    listMembers(guildId),
    listHeroes({ isActive: true }),
  ]);

  return <BattleSubmitClient members={members} heroes={heroes} guildId={guildId} />;
}
