"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Grid3X3 } from "lucide-react";
import type { FormationStat } from "@/lib/db/queries/analytics";

const FORMATION_COLORS: Record<string, string> = {
  "4-1": "#e63946",
  "3-2": "#22d3ee",
  "1-4": "#a78bfa",
  "2-3": "#f0a830",
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: FormationStat }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as FormationStat;
  return (
    <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-3 shadow-lg text-sm">
      <p className="font-medium text-text-primary">จัดทัพ {d.formation}</p>
      <p className="text-text-muted text-xs mt-1">
        ชนะ {d.wins} / แพ้ {d.losses} ({d.total} ครั้ง)
      </p>
      <p className="text-text-secondary text-xs mt-0.5">
        อัตราชนะ: {d.winRate}%
      </p>
    </div>
  );
}

export function FormationBarChart({ formations }: { formations: FormationStat[] }) {
  const hasData = formations.some((f) => f.total > 0);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Grid3X3 className="h-10 w-10 text-text-muted mb-3 opacity-50" />
        <p className="text-sm text-text-muted">ยังไม่มีข้อมูลจัดทัพ</p>
        <p className="text-xs text-text-muted mt-1">
          บันทึกการต่อสู้เพิ่มเติมเพื่อดูสถิติ
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={formations} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2235" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: "#5a5f78", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#1e2235" }}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="formation"
          tick={{ fill: "#e8eaf0", fontSize: 12, fontWeight: 500 }}
          tickLine={false}
          axisLine={{ stroke: "#1e2235" }}
          width={50}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="winRate" radius={[0, 4, 4, 0]} barSize={28}>
          {formations.map((f) => (
            <Cell
              key={f.formation}
              fill={FORMATION_COLORS[f.formation] ?? "#5a5f78"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
