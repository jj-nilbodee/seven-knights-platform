"use client";

import { useState } from "react";
import {
  Trophy,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemberPerformance } from "@/lib/db/queries/analytics";

type SortField = "ign" | "winRate" | "totalBattles" | "attackWinRate" | "defenseWinRate";

function winRateColor(rate: number) {
  if (rate >= 60) return "text-green";
  if (rate >= 40) return "text-gold";
  return "text-accent";
}

function TrendIcon({ trend }: { trend: MemberPerformance["recentTrend"] }) {
  if (trend === "improving")
    return <TrendingUp className="h-3.5 w-3.5 text-green" />;
  if (trend === "declining")
    return <TrendingDown className="h-3.5 w-3.5 text-accent" />;
  return <Minus className="h-3.5 w-3.5 text-text-muted" />;
}

export function MemberPerformanceTable({
  members,
}: {
  members: MemberPerformance[];
}) {
  const [sortField, setSortField] = useState<SortField>("winRate");
  const [sortAsc, setSortAsc] = useState(false);

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Trophy className="h-10 w-10 text-text-muted mb-3 opacity-50" />
        <p className="text-sm text-text-muted">ยังไม่มีข้อมูลสมาชิก</p>
        <p className="text-xs text-text-muted mt-1">
          บันทึกการต่อสู้เพิ่มเติมเพื่อดูสถิติ
        </p>
      </div>
    );
  }

  function toggleSort(field: SortField) {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  }

  const sorted = [...members].sort((a, b) => {
    const mul = sortAsc ? 1 : -1;
    if (sortField === "ign") return mul * a.ign.localeCompare(b.ign);
    return mul * ((a[sortField] as number) - (b[sortField] as number));
  });

  const headers: { label: string; field: SortField; className?: string }[] = [
    { label: "สมาชิก", field: "ign" },
    { label: "รวม", field: "totalBattles", className: "text-center" },
    { label: "อัตราชนะ", field: "winRate", className: "text-center" },
    { label: "บุก", field: "attackWinRate", className: "text-center" },
    { label: "รับ", field: "defenseWinRate", className: "text-center" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-dim">
            {headers.map((h) => (
              <th
                key={h.field}
                onClick={() => toggleSort(h.field)}
                className={cn(
                  "px-3 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer select-none hover:text-text-primary transition-colors",
                  h.className,
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {h.label}
                  <ArrowUpDown className="h-3 w-3 opacity-40" />
                </span>
              </th>
            ))}
            <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase tracking-wider">
              จัดทัพ
            </th>
            <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase tracking-wider">
              แนวโน้ม
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m) => (
            <tr
              key={m.memberId}
              className="border-b border-border-dim/50 hover:bg-bg-elevated/50"
            >
              <td className="px-3 py-2.5 font-medium text-text-primary">
                {m.ign}
              </td>
              <td className="px-3 py-2.5 text-center text-text-secondary">
                {m.wins}/{m.totalBattles}
              </td>
              <td className="px-3 py-2.5 text-center">
                <span className={cn("font-medium", winRateColor(m.winRate))}>
                  {m.winRate}%
                </span>
              </td>
              <td className="px-3 py-2.5 text-center">
                {m.attackBattles > 0 ? (
                  <span className="text-text-secondary">
                    {m.attackWinRate}%{" "}
                    <span className="text-text-muted text-xs">
                      ({m.attackBattles})
                    </span>
                  </span>
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-center">
                {m.defenseBattles > 0 ? (
                  <span className="text-text-secondary">
                    {m.defenseWinRate}%{" "}
                    <span className="text-text-muted text-xs">
                      ({m.defenseBattles})
                    </span>
                  </span>
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-center text-text-secondary text-xs">
                {m.favoriteFormation ?? "—"}
              </td>
              <td className="px-3 py-2.5 text-center">
                <TrendIcon trend={m.recentTrend} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
