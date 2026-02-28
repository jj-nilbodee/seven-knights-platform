import { Suspense } from "react";
import { requireGuild, NO_GUILD_MESSAGE } from "@/lib/auth";
import { getHeroMatchupsCached } from "@/lib/db/queries/analytics";
import { MatchupTable } from "@/components/analytics/matchup-table";
import { PeriodSelector } from "@/components/analytics/period-selector";

async function MatchupData({ guildId, days }: { guildId: string; days: number }) {
  const matchups = await getHeroMatchupsCached(guildId, days, 3);

  return (
    <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
      <p className="text-xs text-text-muted mb-4">
        อัตราชนะเมื่อฮีโร่ฝ่ายเราเจอกับฮีโร่ศัตรู (ขั้นต่ำ 3 ครั้ง)
      </p>
      <MatchupTable matchups={matchups} />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
      <div className="h-3 w-64 animate-pulse rounded bg-bg-elevated mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded bg-bg-elevated" />
        ))}
      </div>
    </div>
  );
}

export default async function MatchupsPage({
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
        <h2 className="text-lg font-medium text-text-primary">แมตช์อัพฮีโร่</h2>
        <PeriodSelector currentDays={days} />
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <MatchupData guildId={result.guildId} days={days} />
      </Suspense>
    </div>
  );
}
