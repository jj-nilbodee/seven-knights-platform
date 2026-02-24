import { requireGuild, NO_GUILD_MESSAGE } from "@/lib/auth";
import { listBattles, getBattleStats } from "@/lib/db/queries/battles";
import { listMembers } from "@/lib/db/queries/members";
import { GuildWarClient } from "./guild-war-client";

export default async function GuildWarPage({
  searchParams,
}: {
  searchParams: Promise<{
    guildId?: string;
    member?: string;
    result?: string;
    day?: string;
  }>;
}) {
  const params = await searchParams;
  const guild = await requireGuild(params);
  if (!guild) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        {NO_GUILD_MESSAGE}
      </div>
    );
  }
  const { guildId } = guild;

  const filters: {
    memberIds?: string[];
    result?: "win" | "loss";
    weekday?: "SAT" | "MON" | "WED";
    limit?: number;
  } = { limit: 200 };

  if (params.member && params.member !== "all") {
    const ids = params.member.split(",").filter(Boolean);
    if (ids.length > 0) {
      filters.memberIds = ids;
    }
  }
  if (params.result === "win" || params.result === "loss") {
    filters.result = params.result;
  }
  if (params.day === "SAT" || params.day === "MON" || params.day === "WED") {
    filters.weekday = params.day;
  }

  const [battles, stats, members] = await Promise.all([
    listBattles(guildId, filters),
    getBattleStats(guildId),
    listMembers(guildId),
  ]);

  return (
    <GuildWarClient
      initialBattles={battles}
      stats={stats}
      members={members}
      filters={{
        member: params.member ?? "all",
        result: params.result ?? "all",
        day: params.day ?? "all",
      }}
    />
  );
}
