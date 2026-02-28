import { Suspense } from "react";
import { requireGuild, NO_GUILD_MESSAGE } from "@/lib/auth";
import { getWinRateTrendCached, getHeroUsageCached } from "@/lib/db/queries/analytics";
import { PeriodSelector } from "@/components/analytics/period-selector";
import { LazyWinRateTrendChart, LazyHeroUsageChart } from "@/components/analytics/lazy-charts";

async function OverviewData({ guildId, days }: { guildId: string; days: number }) {
  const [trendData, heroUsage] = await Promise.all([
    getWinRateTrendCached(guildId, days),
    getHeroUsageCached(guildId, days, 10),
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          อัตราชนะรายวัน
        </h3>
        <LazyWinRateTrendChart data={trendData} />
      </div>

      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          ฮีโร่ที่ใช้บ่อย
        </h3>
        <LazyHeroUsageChart data={heroUsage} />
      </div>
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
          <div className="h-4 w-32 animate-pulse rounded bg-bg-elevated mb-4" />
          <div className="h-[300px] animate-pulse rounded-[var(--radius-md)] bg-bg-elevated" />
        </div>
      ))}
    </div>
  );
}

export default async function AnalyticsOverviewPage({
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
        <h2 className="text-lg font-medium text-text-primary">ภาพรวม</h2>
        <PeriodSelector currentDays={days} />
      </div>

      <Suspense fallback={<ChartsSkeleton />}>
        <OverviewData guildId={result.guildId} days={days} />
      </Suspense>
    </div>
  );
}
