import { requireOfficer } from "@/lib/auth";
import { getMemberPerformance } from "@/lib/db/queries/analytics";
import { MemberPerformanceTable } from "@/components/analytics/member-performance-table";
import { PeriodSelector } from "@/components/analytics/period-selector";

export default async function MembersPage({
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

  const members = await getMemberPerformance(user.guildId, days);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-text-primary">ผลงานสมาชิก</h2>
        <PeriodSelector currentDays={days} />
      </div>

      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
        <p className="text-xs text-text-muted mb-4">
          สถิติรายบุคคล รวมถึงอัตราบุก/รับ จัดทัพที่ใช้บ่อย และแนวโน้ม
        </p>
        <MemberPerformanceTable members={members} />
      </div>
    </div>
  );
}
