import { requireOfficer, resolveGuildId } from "@/lib/auth";
import { getSpeedAnalysis } from "@/lib/db/queries/analytics";
import { SpeedBracketChart } from "@/components/analytics/speed-bracket-chart";
import { FirstTurnCard } from "@/components/analytics/first-turn-card";
import { SpeedScatterChart } from "@/components/analytics/speed-scatter-chart";
import { PeriodSelector } from "@/components/analytics/period-selector";

export default async function SpeedPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; guildId?: string }>;
}) {
  const user = await requireOfficer();
  const params = await searchParams;
  const days = Number(params.days) || 30;
  const guildId = resolveGuildId(user, params);

  if (!guildId) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        คุณยังไม่ได้อยู่ในกิลด์
      </div>
    );
  }

  const speedData = await getSpeedAnalysis(guildId, days);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-text-primary">วิเคราะห์ความเร็ว</h2>
        <PeriodSelector currentDays={days} />
      </div>

      {/* First turn advantage */}
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          ข้อได้เปรียบลำดับตา
        </h3>
        <FirstTurnCard analysis={speedData.firstTurnAnalysis} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Speed brackets */}
        <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-4">
            อัตราชนะตามช่วงความเร็ว
          </h3>
          <SpeedBracketChart brackets={speedData.speedBrackets} />
        </div>

        {/* Speed scatter */}
        <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-4">
            ความเร็วฝ่ายเรา vs ศัตรู
          </h3>
          <SpeedScatterChart data={speedData.speedVsResult} />
        </div>
      </div>
    </div>
  );
}
