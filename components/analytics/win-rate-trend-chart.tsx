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
            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2235" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#5a5f78", fontSize: 11 }}
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
        <Area
          type="monotone"
          dataKey="winRate"
          stroke="#22d3ee"
          strokeWidth={2}
          fill="url(#winRateGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
