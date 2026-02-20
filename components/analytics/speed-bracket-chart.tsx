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
import { Timer } from "lucide-react";
import type { SpeedBracket } from "@/lib/db/queries/analytics";

function getBarColor(winRate: number) {
  if (winRate >= 60) return "#34d399";
  if (winRate >= 40) return "#f0a830";
  return "#e63946";
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: SpeedBracket }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as SpeedBracket;
  return (
    <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-3 shadow-lg text-sm">
      <p className="font-medium text-text-primary">
        ความเร็ว {d.minSpeed}–{d.maxSpeed}
      </p>
      <p className="text-text-muted text-xs mt-1">
        ชนะ {d.wins} / {d.total} ครั้ง
      </p>
      <p className="text-text-secondary text-xs mt-0.5">
        อัตราชนะ: {d.winRate}%
      </p>
    </div>
  );
}

export function SpeedBracketChart({ brackets }: { brackets: SpeedBracket[] }) {
  if (brackets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Timer className="h-10 w-10 text-text-muted mb-3 opacity-50" />
        <p className="text-sm text-text-muted">ยังไม่มีข้อมูลความเร็ว</p>
        <p className="text-xs text-text-muted mt-1">
          บันทึกการต่อสู้เพิ่มเติมเพื่อดูสถิติ
        </p>
      </div>
    );
  }

  const data = brackets.map((b) => ({
    ...b,
    label: `${b.minSpeed}–${b.maxSpeed}`,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2235" />
        <XAxis
          dataKey="label"
          tick={{ fill: "#5a5f78", fontSize: 10 }}
          tickLine={false}
          axisLine={{ stroke: "#1e2235" }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "#5a5f78", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#1e2235" }}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="winRate" radius={[4, 4, 0, 0]} barSize={32}>
          {data.map((d, i) => (
            <Cell key={i} fill={getBarColor(d.winRate)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
