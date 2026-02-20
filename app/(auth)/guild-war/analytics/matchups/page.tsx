import { requireOfficer, resolveGuildId } from "@/lib/auth";
import { getHeroMatchups } from "@/lib/db/queries/analytics";
import { MatchupTable } from "@/components/analytics/matchup-table";
import { PeriodSelector } from "@/components/analytics/period-selector";

export default async function MatchupsPage({
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

  const matchups = await getHeroMatchups(guildId, days, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-text-primary">แมตช์อัพฮีโร่</h2>
        <PeriodSelector currentDays={days} />
      </div>

      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
        <p className="text-xs text-text-muted mb-4">
          อัตราชนะเมื่อฮีโร่ฝ่ายเราเจอกับฮีโร่ศัตรู (ขั้นต่ำ 3 ครั้ง)
        </p>
        <MatchupTable matchups={matchups} />
      </div>
    </div>
  );
}
