"use client";

import dynamic from "next/dynamic";

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="animate-pulse rounded-[var(--radius-md)] bg-bg-elevated"
      style={{ height }}
    />
  );
}

export const LazyWinRateTrendChart = dynamic(
  () =>
    import("@/components/analytics/win-rate-trend-chart").then((m) => ({
      default: m.WinRateTrendChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

export const LazyHeroUsageChart = dynamic(
  () =>
    import("@/components/analytics/hero-usage-chart").then((m) => ({
      default: m.HeroUsageChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

export const LazySpeedBracketChart = dynamic(
  () =>
    import("@/components/analytics/speed-bracket-chart").then((m) => ({
      default: m.SpeedBracketChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

export const LazySpeedScatterChart = dynamic(
  () =>
    import("@/components/analytics/speed-scatter-chart").then((m) => ({
      default: m.SpeedScatterChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton height={350} /> },
);

export const LazySkillOrderChart = dynamic(
  () =>
    import("@/components/analytics/skill-order-chart").then((m) => ({
      default: m.SkillOrderChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
