import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Settings,
  Swords,
  BarChart3,
  Search,
  TrendingUp,
  TrendingDown,
  Users,
  Shield,
  Zap,
} from "lucide-react";
import { requireUser, resolveGuildId } from "@/lib/auth";
import {
  getLastNWarDates,
  getDashboardKPIsFromWars,
  getHeroUsageWithWinRate,
  getFirstTurnAdvantage,
  getMemberWarPerformance,
  getTopHeroCombosFromWars,
  getHardestEnemyComps,
  getEnemyGuildsFromWars,
} from "@/lib/db/queries/analytics";
import type {
  DashboardKPIsFromWars,
  HeroUsageWithWinRate,
  FirstTurnAnalysis,
  MemberWarPerformance,
  HeroCombo,
  EnemyGuildSummary,
} from "@/lib/db/queries/analytics";
import { listGuilds } from "@/lib/db/queries/guilds";

// ── Async sub-components for Suspense streaming ──

async function KPISection({
  guildId,
  warDates,
}: {
  guildId: string;
  warDates: string[];
}) {
  const [kpis, firstTurn] = await Promise.all([
    getDashboardKPIsFromWars(guildId, warDates),
    getFirstTurnAdvantage(guildId, warDates),
  ]);

  const firstTurnTotal = firstTurn.alliedFirstTotal + firstTurn.enemyFirstTotal;

  const cards: {
    label: string;
    value: string;
    sub: string;
    trend?: number;
    icon: typeof Swords;
    accent: string;
  }[] = [
    {
      label: "อัตราชนะ",
      value: `${kpis.winRate}%`,
      sub: `${kpis.wins}W / ${kpis.losses}L`,
      trend: kpis.latestVsPrevTrend,
      icon: Swords,
      accent: "text-accent",
    },
    {
      label: "การต่อสู้ทั้งหมด",
      value: String(kpis.totalBattles),
      sub: kpis.latestWarDate
        ? `ล่าสุด: ${kpis.latestWarDate}`
        : "ยังไม่มีข้อมูล",
      icon: BarChart3,
      accent: "text-cyan",
    },
    {
      label: "สมาชิกแอคทีฟ",
      value: String(kpis.activeMembers),
      sub: "สมาชิกที่ใช้งานอยู่",
      icon: Users,
      accent: "text-green",
    },
    {
      label: "เทิร์นแรก",
      value:
        firstTurnTotal > 0 ? `${firstTurn.alliedFirstWinRate}%` : "—",
      sub:
        firstTurnTotal > 0
          ? `ได้เปรียบ ${firstTurn.advantageDelta > 0 ? "+" : ""}${firstTurn.advantageDelta}%`
          : "ยังไม่มีข้อมูล",
      icon: Zap,
      accent: "text-gold",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`animate-fade-in-up stagger-${i + 1} rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                {card.label}
              </p>
              <Icon className={`h-4 w-4 ${card.accent} opacity-60`} />
            </div>
            <div className="flex items-end gap-2">
              <p className="font-display text-2xl font-bold text-text-primary">
                {card.value}
              </p>
              {card.trend !== undefined && card.trend !== 0 && (
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium pb-0.5 ${
                    card.trend > 0 ? "text-green" : "text-accent"
                  }`}
                >
                  {card.trend > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {card.trend > 0 ? "+" : ""}
                  {card.trend}%
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-text-muted">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}

async function EnemyMatchupsSection({
  guildId,
  warDates,
}: {
  guildId: string;
  warDates: string[];
}) {
  const enemies = await getEnemyGuildsFromWars(guildId, warDates);
  return (
    <div className="animate-fade-in-up stagger-5 rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-accent opacity-60" />
          <h3 className="text-sm font-medium text-text-secondary">
            กิลด์ศัตรู
          </h3>
        </div>
        <Link
          href="/guild-war/analytics/enemy-guilds"
          className="text-xs text-accent hover:text-accent-bright transition-colors inline-flex items-center gap-1"
        >
          ดูเพิ่มเติม
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {enemies.length === 0 ? (
        <p className="text-xs text-text-muted py-6 text-center">
          ยังไม่มีข้อมูล
        </p>
      ) : (
        <div className="space-y-2">
          {enemies.map((enemy) => (
            <div
              key={enemy.guildName}
              className="flex items-center justify-between rounded-[var(--radius-sm)] border border-border-dim/50 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm text-text-primary font-medium truncate">
                  {enemy.guildName}
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  {enemy.lastEncountered}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <span className="text-xs text-text-secondary">
                  {enemy.wins}W / {enemy.losses}L
                </span>
                <span
                  className={`text-xs font-bold font-display min-w-[40px] text-right ${
                    enemy.winRate >= 60
                      ? "text-green"
                      : enemy.winRate >= 40
                        ? "text-gold"
                        : "text-accent"
                  }`}
                >
                  {enemy.winRate}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function HeroMetaSection({
  guildId,
  warDates,
}: {
  guildId: string;
  warDates: string[];
}) {
  const heroes = await getHeroUsageWithWinRate(guildId, warDates, 6);
  return (
    <div className="animate-fade-in-up stagger-6 rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Swords className="h-4 w-4 text-cyan opacity-60" />
        <h3 className="text-sm font-medium text-text-secondary">
          ฮีโร่ยอดนิยม
        </h3>
      </div>
      {heroes.length === 0 ? (
        <p className="text-xs text-text-muted py-6 text-center">
          ยังไม่มีข้อมูล
        </p>
      ) : (
        <div className="space-y-3">
          {heroes.map((hero) => (
            <div key={hero.heroId} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-primary truncate mr-2">
                  {hero.heroName}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-text-muted">
                    {hero.count} ครั้ง
                  </span>
                  <span
                    className={`text-xs font-bold font-display min-w-[40px] text-right ${
                      hero.winRate >= 60
                        ? "text-green"
                        : hero.winRate >= 40
                          ? "text-gold"
                          : "text-accent"
                    }`}
                  >
                    {hero.winRate}%
                  </span>
                </div>
              </div>
              {/* Usage bar */}
              <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    hero.winRate >= 60
                      ? "bg-green/60"
                      : hero.winRate >= 40
                        ? "bg-gold/60"
                        : "bg-accent/60"
                  }`}
                  style={{ width: `${hero.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function MemberSection({
  guildId,
  warDates,
}: {
  guildId: string;
  warDates: string[];
}) {
  const memberPerf = await getMemberWarPerformance(guildId, warDates);
  // Reversed so dates display oldest→newest left-to-right
  const sortedDates = [...warDates].reverse();

  return (
    <div className="animate-fade-in-up stagger-7 rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-green opacity-60" />
          <h3 className="text-sm font-medium text-text-secondary">
            ผลงานสมาชิก
          </h3>
        </div>
        <Link
          href="/guild-war/analytics/members"
          className="text-xs text-accent hover:text-accent-bright transition-colors inline-flex items-center gap-1"
        >
          ดูเพิ่มเติม
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {memberPerf.length === 0 ? (
        <p className="text-xs text-text-muted py-6 text-center">
          ยังไม่มีข้อมูล
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-dim">
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-text-muted uppercase tracking-wider">
                  สมาชิก
                </th>
                {sortedDates.map((d) => (
                  <th
                    key={d}
                    className="px-1.5 py-1.5 text-center text-[10px] font-medium text-text-muted"
                  >
                    {d.slice(5)}
                  </th>
                ))}
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-text-muted uppercase tracking-wider">
                  WR
                </th>
              </tr>
            </thead>
            <tbody>
              {memberPerf.map((m) => (
                <tr
                  key={m.memberId}
                  className="border-b border-border-dim/30 hover:bg-bg-elevated/30"
                >
                  <td className="px-2 py-1.5 text-text-primary text-xs font-medium truncate max-w-[100px]">
                    {m.ign}
                  </td>
                  {sortedDates.map((d) => {
                    const pd = m.perDate[d];
                    if (!pd) {
                      return (
                        <td
                          key={d}
                          className="px-1.5 py-1.5 text-center text-[10px] text-text-muted"
                        >
                          —
                        </td>
                      );
                    }
                    return (
                      <td
                        key={d}
                        className="px-1.5 py-1.5 text-center text-[10px]"
                      >
                        <span className="text-green">{pd.wins}W</span>
                        {pd.losses > 0 && (
                          <>
                            {" "}
                            <span className="text-accent">
                              {pd.losses}L
                            </span>
                          </>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5 text-right">
                    <span
                      className={`text-xs font-bold font-display ${
                        m.winRate === null
                          ? "text-text-muted"
                          : m.winRate >= 60
                            ? "text-green"
                            : m.winRate >= 40
                              ? "text-gold"
                              : "text-accent"
                      }`}
                    >
                      {m.winRate !== null ? `${m.winRate}%` : "—"}
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

async function TeamAnalysisSection({
  guildId,
  warDates,
}: {
  guildId: string;
  warDates: string[];
}) {
  const [bestAttacks, hardestDefenses] = await Promise.all([
    getTopHeroCombosFromWars(guildId, warDates, 2, 5),
    getHardestEnemyComps(guildId, warDates, 2, 5),
  ]);

  return (
    <div className="animate-fade-in-up stagger-8 rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-gold opacity-60" />
        <h3 className="text-sm font-medium text-text-secondary">
          วิเคราะห์ทีม
        </h3>
      </div>

      {/* Best attack compositions */}
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-green mb-2">
          ทีมโจมตีที่ดีที่สุด
        </p>
        {bestAttacks.length === 0 ? (
          <p className="text-xs text-text-muted py-3 text-center">
            ยังไม่มีข้อมูลเพียงพอ
          </p>
        ) : (
          <div className="space-y-2">
            {bestAttacks.map((combo, i) => (
              <ComboRow key={i} combo={combo} />
            ))}
          </div>
        )}
      </div>

      {/* Hardest enemy defenses */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-2">
          ทีมป้องกันที่ยากที่สุด
        </p>
        {hardestDefenses.length === 0 ? (
          <p className="text-xs text-text-muted py-3 text-center">
            ยังไม่มีข้อมูลเพียงพอ
          </p>
        ) : (
          <div className="space-y-2">
            {hardestDefenses.map((combo, i) => (
              <ComboRow key={i} combo={combo} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ComboRow({ combo }: { combo: HeroCombo }) {
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-border-dim/50 px-3 py-2">
      <div className="flex flex-wrap gap-1 min-w-0">
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
          className={`text-xs font-bold font-display ${
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
  );
}

// ── Skeleton fallbacks ──

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[100px] animate-pulse rounded-[var(--radius-md)] bg-bg-elevated"
        />
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
      <div className="h-4 w-32 animate-pulse rounded bg-bg-elevated mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-8 animate-pulse rounded bg-bg-elevated"
          />
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
              <Link
                href="/admin/guilds"
                className="text-accent hover:text-accent-bright"
              >
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

  // Fetch the last 6 guild war dates once — all sections use these
  const warDates = await getLastNWarDates(guildId, 6);

  return (
    <div className="space-y-6">
      {/* Header + Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            แดชบอร์ด
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            ภาพรวม {warDates.length} สงครามล่าสุด
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/guild-war/quick-submit"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors"
          >
            <Swords className="h-3.5 w-3.5" />
            บันทึกผล
          </Link>
          <Link
            href="/guild-war/analytics"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] bg-cyan/10 text-cyan border border-cyan/20 hover:bg-cyan/20 transition-colors"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            วิเคราะห์
          </Link>
          <Link
            href="/gvg-guides"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            ค้นหาไกด์
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <Suspense fallback={<KPISkeleton />}>
        <KPISection guildId={guildId} warDates={warDates} />
      </Suspense>

      {/* Row: Enemy Matchups + Hero Meta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<CardSkeleton />}>
          <EnemyMatchupsSection guildId={guildId} warDates={warDates} />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <HeroMetaSection guildId={guildId} warDates={warDates} />
        </Suspense>
      </div>

      {/* Row: Member Performance + Team Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<CardSkeleton />}>
          <MemberSection guildId={guildId} warDates={warDates} />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <TeamAnalysisSection guildId={guildId} warDates={warDates} />
        </Suspense>
      </div>
    </div>
  );
}
