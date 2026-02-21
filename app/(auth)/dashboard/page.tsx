import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireUser, resolveGuildId, NO_GUILD_MESSAGE } from "@/lib/auth";
import {
  getDashboardKPIs,
  getTopHeroCombos,
  getRecentBattles,
  getWinRateTrend,
} from "@/lib/db/queries/analytics";
import { KPICards } from "@/components/analytics/kpi-cards";
import { WinRateTrendChart } from "@/components/analytics/win-rate-trend-chart";
import { getResultBadgeClasses } from "@/lib/badge-utils";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ guildId?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const guildId = resolveGuildId(user, params);

  if (!guildId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            แดชบอร์ด
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            ยินดีต้อนรับ, {user.email}
          </p>
        </div>
        <div className="flex items-center justify-center h-60 text-text-muted">
          {NO_GUILD_MESSAGE}
        </div>
      </div>
    );
  }

  const [kpis, combos, recentBattles, trendData] = await Promise.all([
    getDashboardKPIs(guildId, 30),
    getTopHeroCombos(guildId, 30, 2, 5),
    getRecentBattles(guildId, 8),
    getWinRateTrend(guildId, 30),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          แดชบอร์ด
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          ยินดีต้อนรับ, {user.email}
        </p>
      </div>

      {/* KPI Cards */}
      <KPICards kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win Rate Trend */}
        <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-secondary">
              อัตราชนะ 30 วัน
            </h3>
            <Link
              href="/guild-war/analytics"
              className="text-xs text-accent hover:text-accent-bright transition-colors inline-flex items-center gap-1"
            >
              ดูเพิ่มเติม
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <WinRateTrendChart data={trendData} />
        </div>

        {/* Top Hero Combos */}
        <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-4">
            ทีมยอดนิยม
          </h3>
          {combos.length === 0 ? (
            <p className="text-xs text-text-muted py-8 text-center">
              ยังไม่มีข้อมูลเพียงพอ
            </p>
          ) : (
            <div className="space-y-3">
              {combos.map((combo, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-[var(--radius-sm)] border border-border-dim/50 px-3 py-2"
                >
                  <div className="flex flex-wrap gap-1">
                    {combo.heroNames.map((name, j) => (
                      <span
                        key={j}
                        className="inline-block rounded-[var(--radius-sm)] bg-cyan/10 border border-cyan/20 px-1.5 py-0.5 text-[10px] text-cyan"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span
                      className={`text-xs font-medium ${
                        combo.winRate >= 60
                          ? "text-green"
                          : combo.winRate >= 40
                            ? "text-gold"
                            : "text-accent"
                      }`}
                    >
                      {combo.winRate}%
                    </span>
                    <span className="text-[10px] text-text-muted ml-1">
                      ({combo.total})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Battles */}
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-text-secondary">
            การต่อสู้ล่าสุด
          </h3>
          <Link
            href="/guild-war"
            className="text-xs text-accent hover:text-accent-bright transition-colors inline-flex items-center gap-1"
          >
            ดูทั้งหมด
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentBattles.length === 0 ? (
          <p className="text-xs text-text-muted py-8 text-center">
            ยังไม่มีข้อมูลการต่อสู้
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-dim">
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">
                    วันที่
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">
                    สมาชิก
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">
                    ศัตรู
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">
                    จัดทัพ
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">
                    ผล
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentBattles.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-border-dim/50 hover:bg-bg-elevated/50"
                  >
                    <td className="px-3 py-2 text-text-secondary text-xs">
                      {b.date}
                    </td>
                    <td className="px-3 py-2 text-text-primary">
                      {b.memberIgn ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {b.enemyGuildName || "—"}
                    </td>
                    <td className="px-3 py-2 text-text-muted text-xs">
                      {b.alliedFormation ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span className={getResultBadgeClasses(b.result)}>
                        {b.result === "win" ? "ชนะ" : "แพ้"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
