import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Settings } from "lucide-react";
import { requireUser, resolveGuildId } from "@/lib/auth";
import {
  getDashboardKPIs,
  getTopHeroCombos,
  getRecentBattles,
  getWinRateTrend,
} from "@/lib/db/queries/analytics";
import { listGuilds } from "@/lib/db/queries/guilds";
import { KPICards } from "@/components/analytics/kpi-cards";
import { LazyWinRateTrendChart } from "@/components/analytics/lazy-charts";
import { getResultBadgeClasses } from "@/lib/badge-utils";

// ── Async sub-components for Suspense streaming ──

async function KPISection({ guildId }: { guildId: string }) {
  const kpis = await getDashboardKPIs(guildId, 30);
  return <KPICards kpis={kpis} />;
}

async function TrendSection({ guildId }: { guildId: string }) {
  const trendData = await getWinRateTrend(guildId, 30);
  return (
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
      <LazyWinRateTrendChart data={trendData} />
    </div>
  );
}

async function CombosSection({ guildId }: { guildId: string }) {
  const combos = await getTopHeroCombos(guildId, 30, 2, 5);
  return (
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
  );
}

async function RecentBattlesSection({ guildId }: { guildId: string }) {
  const recentBattles = await getRecentBattles(guildId, 8);
  return (
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
  );
}

// ── Skeleton fallbacks ──

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-[var(--radius-md)] bg-bg-elevated" />
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
      <div className="h-4 w-32 animate-pulse rounded bg-bg-elevated mb-4" />
      <div className="h-[300px] animate-pulse rounded-[var(--radius-md)] bg-bg-elevated" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
      <div className="h-4 w-32 animate-pulse rounded bg-bg-elevated mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded bg-bg-elevated" />
        ))}
      </div>
    </div>
  );
}

// ── Main page ──

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ guildId?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  let guildId = resolveGuildId(user, params);

  // Admins without a personal guild: auto-select the first available guild
  if (!guildId && user.role === "admin") {
    const allGuilds = await listGuilds();
    if (allGuilds.length > 0) {
      guildId = allGuilds[0].id;
    } else {
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
          <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-8 text-center">
            <Settings className="h-10 w-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-primary font-medium">
              ยังไม่มีกิลด์ในระบบ
            </p>
            <p className="text-sm text-text-muted mt-1">
              ไปที่{" "}
              <Link href="/admin/guilds" className="text-accent hover:text-accent-bright">
                จัดการกิลด์
              </Link>{" "}
              เพื่อสร้างกิลด์แรก
            </p>
          </div>
        </div>
      );
    }
  }

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
        <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-8 text-center">
          <Clock className="h-10 w-10 text-gold mx-auto mb-3" />
          <p className="text-text-primary font-medium">
            รอแอดมินกำหนดกิลด์
          </p>
          <p className="text-sm text-text-muted mt-1">
            กรุณาติดต่อแอดมินเพื่อขอเข้าร่วมกิลด์
          </p>
        </div>
      </div>
    );
  }

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

      {/* KPI Cards — stream in */}
      <Suspense fallback={<KPISkeleton />}>
        <KPISection guildId={guildId} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win Rate Trend — stream in */}
        <Suspense fallback={<CardSkeleton />}>
          <TrendSection guildId={guildId} />
        </Suspense>

        {/* Top Hero Combos — stream in */}
        <Suspense fallback={<CardSkeleton />}>
          <CombosSection guildId={guildId} />
        </Suspense>
      </div>

      {/* Recent Battles — stream in */}
      <Suspense fallback={<TableSkeleton />}>
        <RecentBattlesSection guildId={guildId} />
      </Suspense>
    </div>
  );
}
