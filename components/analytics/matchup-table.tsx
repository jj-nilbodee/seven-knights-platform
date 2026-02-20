"use client";

import { useState } from "react";
import { Users, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeroMatchup } from "@/lib/db/queries/analytics";

type SortField = "winRate" | "total" | "alliedHeroName" | "enemyHeroName";

function winRateColor(rate: number) {
  if (rate >= 60) return "text-green";
  if (rate >= 40) return "text-gold";
  return "text-accent";
}

function winRateBarColor(rate: number) {
  if (rate >= 60) return "bg-green/30";
  if (rate >= 40) return "bg-gold/30";
  return "bg-accent/30";
}

export function MatchupTable({ matchups }: { matchups: HeroMatchup[] }) {
  const [sortField, setSortField] = useState<SortField>("winRate");
  const [sortAsc, setSortAsc] = useState(false);

  if (matchups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-10 w-10 text-text-muted mb-3 opacity-50" />
        <p className="text-sm text-text-muted">ยังไม่มีข้อมูลแมตช์อัพ</p>
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

  const sorted = [...matchups].sort((a, b) => {
    const mul = sortAsc ? 1 : -1;
    if (sortField === "alliedHeroName")
      return mul * a.alliedHeroName.localeCompare(b.alliedHeroName);
    if (sortField === "enemyHeroName")
      return mul * a.enemyHeroName.localeCompare(b.enemyHeroName);
    return mul * ((a[sortField] as number) - (b[sortField] as number));
  });

  const headers: { label: string; field: SortField }[] = [
    { label: "ฮีโร่ฝ่ายเรา", field: "alliedHeroName" },
    { label: "ฮีโร่ศัตรู", field: "enemyHeroName" },
    { label: "รวม", field: "total" },
    { label: "อัตราชนะ", field: "winRate" },
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
                className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer select-none hover:text-text-primary transition-colors"
              >
                <span className="inline-flex items-center gap-1">
                  {h.label}
                  <ArrowUpDown className="h-3 w-3 opacity-40" />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((m) => (
            <tr
              key={`${m.alliedHeroId}-${m.enemyHeroId}`}
              className="border-b border-border-dim/50 transition-colors hover:bg-bg-elevated/50"
            >
              <td className="px-3 py-2.5 font-medium text-cyan">
                {m.alliedHeroName}
              </td>
              <td className="px-3 py-2.5 text-accent-bright">
                {m.enemyHeroName}
              </td>
              <td className="px-3 py-2.5 text-text-secondary">
                {m.wins}/{m.total}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-bg-input overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", winRateBarColor(m.winRate))}
                      style={{ width: `${m.winRate}%` }}
                    />
                  </div>
                  <span className={cn("text-xs font-medium", winRateColor(m.winRate))}>
                    {m.winRate}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
