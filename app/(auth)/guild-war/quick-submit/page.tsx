import { requireGuild, NO_GUILD_MESSAGE } from "@/lib/auth";
import { listMembers } from "@/lib/db/queries/members";
import { getEnemyGuildNameForDate } from "@/lib/db/queries/battles";
import { QuickSubmitClient } from "./quick-submit-client";

function getLatestGuildWarDate() {
  const now = new Date();
  const day = now.getDay();
  const daysBack = [1, 0, 1, 0, 1, 1, 0];
  const target = new Date(now);
  target.setDate(target.getDate() - daysBack[day]);
  return target.toISOString().split("T")[0];
}

export default async function QuickSubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ guildId?: string }>;
}) {
  const params = await searchParams;
  const guild = await requireGuild(params);

  if (!guild) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        {NO_GUILD_MESSAGE}
      </div>
    );
  }

  const defaultDate = getLatestGuildWarDate();

  const [members, initialEnemyGuildName] = await Promise.all([
    listMembers(guild.guildId),
    getEnemyGuildNameForDate(guild.guildId, defaultDate),
  ]);

  return (
    <QuickSubmitClient
      members={members.map((m) => ({
        id: m.id,
        ign: m.ign,
      }))}
      guildId={guild.guildId}
      initialEnemyGuildName={initialEnemyGuildName}
    />
  );
}
