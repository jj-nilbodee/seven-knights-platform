import { requireOfficer, resolveGuildId } from "@/lib/auth";
import { getSkillOrderImpact } from "@/lib/db/queries/analytics";
import { SkillOrderChart } from "@/components/analytics/skill-order-chart";
import { PeriodSelector } from "@/components/analytics/period-selector";

export default async function SkillsPage({
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

  const skills = await getSkillOrderImpact(guildId, days);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-text-primary">ลำดับสกิล</h2>
        <PeriodSelector currentDays={days} />
      </div>

      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
        <p className="text-xs text-text-muted mb-4">
          เปรียบเทียบอัตราชนะเมื่อใช้สกิลในลำดับที่ 1, 2, หรือ 3 (ขั้นต่ำ 3
          ครั้ง)
        </p>
        <SkillOrderChart skills={skills} />
      </div>
    </div>
  );
}
