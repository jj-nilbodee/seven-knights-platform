import { Suspense } from "react";
import { requireGuild, NO_GUILD_MESSAGE } from "@/lib/auth";
import { getSpeedAnalysisCached } from "@/lib/db/queries/analytics";
import { FirstTurnCard } from "@/components/analytics/first-turn-card";
import { PeriodSelector } from "@/components/analytics/period-selector";
import { LazySpeedBracketChart, LazySpeedScatterChart } from "@/components/analytics/lazy-charts";

async function SpeedData({ guildId, days }: { guildId: string; days: number }) {
  const speedData = await getSpeedAnalysisCached(guildId, days);

  return (
    <>
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          ข้อได้เปรียบลำดับตา
        </h3>
        <FirstTurnCard analysis={speedData.firstTurnAnalysis} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-4">
            อัตราชนะตามช่วงความเร็ว
          </h3>
          <LazySpeedBracketChart brackets={speedData.speedBrackets} />
        </div>

        <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-4">
            ความเร็วฝ่ายเรา vs ศัตรู
          </h3>
          <LazySpeedScatterChart data={speedData.speedVsResult} />
        </div>
      </div>
    </>
  );
}

function SpeedSkeleton() {
  return (
    <>
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
        <div className="h-4 w-40 animate-pulse rounded bg-bg-elevated mb-4" />
        <div className="h-24 animate-pulse rounded-[var(--radius-md)] bg-bg-elevated" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
            <div className="h-4 w-40 animate-pulse rounded bg-bg-elevated mb-4" />
            <div className="h-[300px] animate-pulse rounded-[var(--radius-md)] bg-bg-elevated" />
          </div>
        ))}
      </div>
    </>
  );
}

export default async function SpeedPage({
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
        <h2 className="text-lg font-medium text-text-primary">วิเคราะห์ความเร็ว</h2>
        <PeriodSelector currentDays={days} />
      </div>

      <Suspense fallback={<SpeedSkeleton />}>
        <SpeedData guildId={result.guildId} days={days} />
      </Suspense>
    </div>
  );
}
