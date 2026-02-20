import { requireOfficer, resolveGuildId } from "@/lib/auth";
import { listBattles, getBattleStats } from "@/lib/db/queries/battles";
import { listMembers } from "@/lib/db/queries/members";
import { GuildWarClient } from "./guild-war-client";

export default async function GuildWarPage({
  searchParams,
}: {
  searchParams: Promise<{ guildId?: string }>;
}) {
  const user = await requireOfficer();
  const params = await searchParams;
  const guildId = resolveGuildId(user, params);

  if (!guildId) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        คุณยังไม่ได้อยู่ในกิลด์
      </div>
    );
  }

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
