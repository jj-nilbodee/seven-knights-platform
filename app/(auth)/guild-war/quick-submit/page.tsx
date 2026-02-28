import { requireGuild, NO_GUILD_MESSAGE } from "@/lib/auth";
import { listMembersCached } from "@/lib/db/queries/members";
import { getEnemyGuildNameForDate } from "@/lib/db/queries/battles";
import { getLatestGuildWarDate } from "@/lib/validations/battle";
import { QuickSubmitClient } from "./quick-submit-client";

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
    listMembersCached(guild.guildId),
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
