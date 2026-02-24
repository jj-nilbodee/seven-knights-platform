"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { UserCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { HeroUsageStat } from "@/lib/db/queries/analytics";

const COLORS = [
  "var(--cyan)",
  "var(--accent)",
  "var(--gold)",
  "var(--green)",
  "var(--purple)",
  "var(--bronze)",
  "var(--silver)",
  "var(--accent-bright)",
  "var(--cyan-dim)",
  "var(--green-dim)",
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: HeroUsageStat }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as HeroUsageStat;
  return (
    <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-3 shadow-lg text-sm">
      <p className="font-medium text-text-primary">{d.heroName}</p>
      <p className="text-text-muted text-xs mt-1">
        เลือกใช้ {d.count} ครั้ง ({d.percentage}%)
      </p>
    </div>
  );
}

export function HeroUsageChart({ data }: { data: HeroUsageStat[] }) {
  if (data.length === 0) {
    return (
      <EmptyState icon={UserCircle} message="ยังไม่มีข้อมูลการใช้ฮีโร่" detail="บันทึกการต่อสู้เพิ่มเติมเพื่อดูสถิติ" />
    );
  }

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="count"
            nameKey="heroName"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
        {data.slice(0, 8).map((d, i) => (
          <div key={d.heroId} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-text-secondary">{d.heroName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
