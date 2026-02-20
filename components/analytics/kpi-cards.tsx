"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import type { DashboardKPIs } from "@/lib/db/queries/analytics";

export function KPICards({ kpis }: { kpis: DashboardKPIs }) {
  const cards = [
    {
      label: "อัตราชนะ",
      value: `${kpis.winRate}%`,
      sub: `${kpis.wins} ชนะ / ${kpis.losses} แพ้`,
      trend: kpis.winRateTrend,
    },
    {
      label: "การต่อสู้ทั้งหมด",
      value: String(kpis.totalBattles),
      sub: kpis.mostRecentDate
        ? `ล่าสุด: ${kpis.mostRecentDate}`
        : "ยังไม่มีข้อมูล",
    },
    {
      label: "สมาชิกแอคทีฟ",
      value: String(kpis.activeMembers),
      sub: "สมาชิกที่ใช้งานอยู่",
    },
    {
      label: "วัน GvG ล่าสุด",
      value: kpis.mostRecentDate ?? "—",
      sub: kpis.totalBattles > 0 ? "วันที่ต่อสู้ล่าสุด" : "รอข้อมูล",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5"
        >
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
            {card.label}
          </p>
          <div className="flex items-end gap-2 mt-2">
            <p className="font-display text-3xl font-bold text-text-primary">
              {card.value}
            </p>
            {card.trend !== undefined && card.trend !== 0 && (
              <span
                className={`flex items-center gap-0.5 text-xs font-medium pb-1 ${
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
      ))}
    </div>
  );
}
