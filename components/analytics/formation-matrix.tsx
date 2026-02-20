"use client";

import { cn } from "@/lib/utils";
import type { FormationStat } from "@/lib/db/queries/analytics";

const FORMATIONS = ["4-1", "3-2", "1-4", "2-3"];

function getCellBg(winRate: number) {
  if (winRate >= 70) return "bg-green/20 text-green";
  if (winRate >= 55) return "bg-green/10 text-green/80";
  if (winRate >= 45) return "bg-gold/10 text-gold";
  if (winRate >= 30) return "bg-accent/10 text-accent/80";
  return "bg-accent/20 text-accent";
}

export function FormationMatrix({ formations }: { formations: FormationStat[] }) {
  const statMap = new Map(formations.map((f) => [f.formation, f]));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span>ฝ่ายเรา ↓</span>
        <span className="text-text-muted/50">/</span>
        <span>ศัตรู →</span>
      </div>

      <div className="overflow-x-auto">
        <table className="text-sm">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted" />
              {FORMATIONS.map((f) => (
                <th
                  key={f}
                  className="px-3 py-2 text-center text-xs font-medium text-text-secondary min-w-[80px]"
                >
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FORMATIONS.map((allied) => {
              const stat = statMap.get(allied);
              return (
                <tr key={allied}>
                  <td className="px-3 py-2 text-xs font-medium text-text-secondary">
                    {allied}
                  </td>
                  {FORMATIONS.map((enemy) => {
                    const vs = stat?.vsEnemyFormations[enemy];
                    if (!vs || vs.total === 0) {
                      return (
                        <td
                          key={enemy}
                          className="px-3 py-2 text-center text-xs text-text-muted"
                        >
                          —
                        </td>
                      );
                    }
                    return (
                      <td key={enemy} className="px-3 py-2 text-center">
                        <div
                          className={cn(
                            "inline-flex flex-col items-center rounded-[var(--radius-sm)] px-2 py-1",
                            getCellBg(vs.winRate),
                          )}
                        >
                          <span className="text-xs font-medium">
                            {vs.winRate}%
                          </span>
                          <span className="text-[10px] opacity-70">
                            {vs.total} ครั้ง
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-accent/20" />
          ต่ำ
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-gold/10" />
          50%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-green/20" />
          สูง
        </span>
      </div>
    </div>
  );
}
