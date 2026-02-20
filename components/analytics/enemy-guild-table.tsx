"use client";

import { useState } from "react";
import { Swords, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnemyGuildSummary } from "@/lib/db/queries/analytics";

type SortField = "guildName" | "totalBattles" | "winRate" | "lastEncountered";

function winRateColor(rate: number) {
  if (rate >= 60) return "text-green";
  if (rate >= 40) return "text-gold";
  return "text-accent";
}

export function EnemyGuildTable({ guilds }: { guilds: EnemyGuildSummary[] }) {
  const [sortField, setSortField] = useState<SortField>("totalBattles");
  const [sortAsc, setSortAsc] = useState(false);

  if (guilds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Swords className="h-10 w-10 text-text-muted mb-3 opacity-50" />
        <p className="text-sm text-text-muted">ยังไม่มีข้อมูลกิลด์ศัตรู</p>
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

  const sorted = [...guilds].sort((a, b) => {
    const mul = sortAsc ? 1 : -1;
    if (sortField === "guildName")
      return mul * a.guildName.localeCompare(b.guildName);
    if (sortField === "lastEncountered")
      return mul * a.lastEncountered.localeCompare(b.lastEncountered);
    return mul * ((a[sortField] as number) - (b[sortField] as number));
  });

  const headers: { label: string; field: SortField }[] = [
    { label: "กิลด์", field: "guildName" },
    { label: "จำนวน", field: "totalBattles" },
    { label: "อัตราชนะ", field: "winRate" },
    { label: "ล่าสุด", field: "lastEncountered" },
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
          {sorted.map((g) => (
            <tr
              key={g.guildName}
              className="border-b border-border-dim/50 hover:bg-bg-elevated/50"
            >
              <td className="px-3 py-2.5 font-medium text-text-primary">
                {g.guildName}
              </td>
              <td className="px-3 py-2.5 text-text-secondary">
                {g.wins}/{g.totalBattles}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-14 rounded-full bg-bg-input overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        g.winRate >= 60
                          ? "bg-green/30"
                          : g.winRate >= 40
                            ? "bg-gold/30"
                            : "bg-accent/30",
                      )}
                      style={{ width: `${g.winRate}%` }}
                    />
                  </div>
                  <span
                    className={cn("text-xs font-medium", winRateColor(g.winRate))}
                  >
                    {g.winRate}%
                  </span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-text-muted text-xs">
                {g.lastEncountered}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
