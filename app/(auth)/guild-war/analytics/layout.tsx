import { requireOfficer } from "@/lib/auth";
import { AnalyticsNav } from "@/components/analytics/analytics-nav";

export default async function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOfficer();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          วิเคราะห์สงครามกิลด์
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          สถิติและข้อมูลเชิงลึกจากการต่อสู้
        </p>
      </div>
      <AnalyticsNav />
      {children}
    </div>
  );
}
