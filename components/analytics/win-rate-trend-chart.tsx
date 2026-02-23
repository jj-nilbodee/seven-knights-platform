"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import type { DailyWinRate } from "@/lib/db/queries/analytics";

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: DailyWinRate }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as DailyWinRate;
  return (
    <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-3 shadow-lg text-sm">
      <p className="text-text-secondary">{d.date}</p>
      <p className="font-medium text-text-primary mt-1">
        อัตราชนะ: {d.winRate}%
      </p>
      <p className="text-text-muted text-xs">
        ชนะ {d.wins} / แพ้ {d.losses} ({d.total} ครั้ง)
      </p>
    </div>
  );
}

export function WinRateTrendChart({ data }: { data: DailyWinRate[] }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <TrendingUp className="h-10 w-10 text-text-muted mb-3 opacity-50" />
        <p className="text-sm text-text-muted">ยังไม่มีข้อมูลอัตราชนะ</p>
        <p className="text-xs text-text-muted mt-1">
          บันทึกการต่อสู้เพิ่มเติมเพื่อดูสถิติ
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="winRateGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--cyan)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--cyan)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dim)" />
        <XAxis
          dataKey="date"
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
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
        <Area
          type="monotone"
          dataKey="winRate"
          stroke="var(--cyan)"
          strokeWidth={2}
          fill="url(#winRateGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
