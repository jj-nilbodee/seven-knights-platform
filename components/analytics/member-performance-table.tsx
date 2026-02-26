"use client";

import { useState } from "react";
import {
  Trophy,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, winRateColor } from "@/lib/utils";
import type { MemberPerformance } from "@/lib/db/queries/analytics";

type SortField = "ign" | "winRate" | "totalBattles" | "attackWinRate" | "defenseWinRate" | "participationRate";

function TrendIcon({ trend }: { trend: MemberPerformance["recentTrend"] }) {
  if (trend === "improving")
    return <TrendingUp className="h-3.5 w-3.5 text-green" />;
  if (trend === "declining")
    return <TrendingDown className="h-3.5 w-3.5 text-accent" />;
  return <Minus className="h-3.5 w-3.5 text-text-muted" />;
}

function RateCell({ rate, count }: { rate: number | null; count?: number }) {
  if (rate === null) return <span className="text-text-muted">—</span>;
  return (
    <span className="text-text-secondary">
      <span className={cn("font-medium", winRateColor(rate))}>{rate}%</span>
      {count !== undefined && (
        <span className="text-text-muted text-xs"> ({count})</span>
      )}
    </span>
  );
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
      <EmptyState icon={Trophy} message="ยังไม่มีข้อมูลสมาชิก" detail="บันทึกการต่อสู้เพิ่มเติมเพื่อดูสถิติ" />
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
    // null values sort last regardless of direction
    const aVal = a[sortField] as number | null;
    const bVal = b[sortField] as number | null;
    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    return mul * (aVal - bVal);
  });

  const headers: { label: string; field: SortField; className?: string }[] = [
    { label: "สมาชิก", field: "ign" },
    { label: "รวม", field: "totalBattles", className: "text-center" },
    { label: "อัตราชนะ", field: "winRate", className: "text-center" },
    { label: "บุก", field: "attackWinRate", className: "text-center" },
    { label: "รับ", field: "defenseWinRate", className: "text-center" },
    { label: "เข้าร่วม", field: "participationRate", className: "text-center" },
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
                {m.totalBattles > 0 ? `${m.wins}/${m.totalBattles}` : <span className="text-text-muted">—</span>}
              </td>
              <td className="px-3 py-2.5 text-center">
                <RateCell rate={m.winRate} />
              </td>
              <td className="px-3 py-2.5 text-center">
                <RateCell rate={m.attackWinRate} count={m.attackBattles > 0 ? m.attackBattles : undefined} />
              </td>
              <td className="px-3 py-2.5 text-center">
                <RateCell rate={m.defenseWinRate} count={m.defenseBattles > 0 ? m.defenseBattles : undefined} />
              </td>
              <td className="px-3 py-2.5 text-center">
                <RateCell rate={m.participationRate} count={m.eligibleWarDays > 0 ? m.eligibleWarDays : undefined} />
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
