import { requireGuild, NO_GUILD_MESSAGE } from "@/lib/auth";
import { getEnemyGuilds } from "@/lib/db/queries/analytics";
import { EnemyGuildTable } from "@/components/analytics/enemy-guild-table";
import { PeriodSelector } from "@/components/analytics/period-selector";

export default async function EnemyGuildsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; guildId?: string }>;
}) {
  const params = await searchParams;
  const days = Number(params.days) || 30;
  const result = await requireGuild(params);

  if (!result) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        {NO_GUILD_MESSAGE}
      </div>
    );
  }
  const { guildId } = result;

  const guilds = await getEnemyGuilds(guildId, days);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-text-primary">กิลด์ศัตรู</h2>
        <PeriodSelector currentDays={days} />
      </div>

      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
        <p className="text-xs text-text-muted mb-4">
          สรุปสถิติกับแต่ละกิลด์ที่เคยเจอ
        </p>
        <EnemyGuildTable guilds={guilds} />
      </div>
    </div>
  );
}
