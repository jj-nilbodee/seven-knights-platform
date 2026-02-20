import { requireOfficer } from "@/lib/auth";
import { listBattles, getBattleStats } from "@/lib/db/queries/battles";
import { listMembers } from "@/lib/db/queries/members";
import { GuildWarClient } from "./guild-war-client";

export default async function GuildWarPage() {
  const user = await requireOfficer();

  if (!user.guildId) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        คุณยังไม่ได้อยู่ในกิลด์
      </div>
    );
  }

  const [battles, stats, members] = await Promise.all([
    listBattles(user.guildId, { limit: 50 }),
    getBattleStats(user.guildId),
    listMembers(user.guildId),
  ]);

  return (
    <GuildWarClient
      initialBattles={battles}
      stats={stats}
      members={members}
    />
  );
}
