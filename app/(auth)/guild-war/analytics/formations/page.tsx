import { requireOfficer } from "@/lib/auth";
import { getFormationStats } from "@/lib/db/queries/analytics";
import { FormationBarChart } from "@/components/analytics/formation-bar-chart";
import { FormationMatrix } from "@/components/analytics/formation-matrix";
import { PeriodSelector } from "@/components/analytics/period-selector";

export default async function FormationsPage({
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

  const formations = await getFormationStats(user.guildId, days);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-text-primary">สถิติจัดทัพ</h2>
        <PeriodSelector currentDays={days} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-4">
            อัตราชนะแต่ละจัดทัพ
          </h3>
          <FormationBarChart formations={formations} />
        </div>

        <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-4">
            ตารางจัดทัพ vs จัดทัพ
          </h3>
          <FormationMatrix formations={formations} />
        </div>
      </div>
    </div>
  );
}
