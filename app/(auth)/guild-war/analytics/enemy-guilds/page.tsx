import { Suspense } from "react";
import { requireGuild, NO_GUILD_MESSAGE } from "@/lib/auth";
import { getEnemyGuildsCached } from "@/lib/db/queries/analytics";
import { EnemyGuildTable } from "@/components/analytics/enemy-guild-table";
import { PeriodSelector } from "@/components/analytics/period-selector";

async function EnemyGuildData({ guildId, days }: { guildId: string; days: number }) {
  const guilds = await getEnemyGuildsCached(guildId, days);

  return (
    <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
      <p className="text-xs text-text-muted mb-4">
        สรุปสถิติกับแต่ละกิลด์ที่เคยเจอ
      </p>
      <EnemyGuildTable guilds={guilds} />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
      <div className="h-3 w-64 animate-pulse rounded bg-bg-elevated mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded bg-bg-elevated" />
        ))}
      </div>
    </div>
  );
}

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-text-primary">กิลด์ศัตรู</h2>
        <PeriodSelector currentDays={days} />
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <EnemyGuildData guildId={result.guildId} days={days} />
      </Suspense>
    </div>
  );
}
