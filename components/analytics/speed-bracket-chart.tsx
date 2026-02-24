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
import { EmptyState } from "@/components/ui/empty-state";
import type { SpeedBracket } from "@/lib/db/queries/analytics";

function getBarColor(winRate: number) {
  if (winRate >= 60) return "var(--green)";
  if (winRate >= 40) return "var(--gold)";
  return "var(--accent)";
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
      <EmptyState icon={Timer} message="ยังไม่มีข้อมูลความเร็ว" detail="บันทึกการต่อสู้เพิ่มเติมเพื่อดูสถิติ" />
    );
  }

  const data = brackets.map((b) => ({
    ...b,
    label: `${b.minSpeed}–${b.maxSpeed}`,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dim)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--text-muted)", fontSize: 10 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border-dim)" }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border-dim)" }}
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
