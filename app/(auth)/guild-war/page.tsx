import { requireGuild, NO_GUILD_MESSAGE } from "@/lib/auth";
import { listBattles, getBattleStats } from "@/lib/db/queries/battles";
import { listMembers } from "@/lib/db/queries/members";
import { GuildWarClient } from "./guild-war-client";

export default async function GuildWarPage({
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

  const [battles, stats, members] = await Promise.all([
    listBattles(guildId, { limit: 50 }),
    getBattleStats(guildId),
    listMembers(guildId),
  ]);

  return (
    <GuildWarClient
      initialBattles={battles}
      stats={stats}
      members={members}
    />
  );
}
