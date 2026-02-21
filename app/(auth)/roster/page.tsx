import { requireGuild, NO_GUILD_MESSAGE } from "@/lib/auth";
import { listMembers, getMemberStats } from "@/lib/db/queries/members";
import { RosterClient } from "./roster-client";

export default async function RosterPage({
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

  const [members, stats] = await Promise.all([
    listMembers(guildId, true),
    getMemberStats(guildId),
  ]);

  return <RosterClient initialMembers={members} stats={stats} guildId={guildId} />;
}
