import { requireOfficer } from "@/lib/auth";
import { getEnemyGuilds } from "@/lib/db/queries/analytics";
import { EnemyGuildTable } from "@/components/analytics/enemy-guild-table";
import { PeriodSelector } from "@/components/analytics/period-selector";

export default async function EnemyGuildsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const user = await requireOfficer();
  const params = await searchParams;
  const days = Number(params.days) || 30;

  if (!user.guildId) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        คุณยังไม่ได้อยู่ในกิลด์
      </div>
    );
  }

  const guilds = await getEnemyGuilds(user.guildId, days);

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
