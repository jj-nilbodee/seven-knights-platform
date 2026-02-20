"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Crosshair } from "lucide-react";
import type { SpeedDataPoint } from "@/lib/db/queries/analytics";

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: SpeedDataPoint }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as SpeedDataPoint;
  return (
    <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-3 shadow-lg text-sm">
      <p className="font-medium text-text-primary">
        {d.result === "win" ? "ชนะ" : "แพ้"}
      </p>
      <p className="text-text-muted text-xs mt-1">
        ฝ่ายเรา: {d.alliedSpeed} / ศัตรู: {d.enemySpeed}
      </p>
      <p className="text-text-secondary text-xs mt-0.5">
        ผลต่าง: {d.speedDiff > 0 ? "+" : ""}
        {d.speedDiff}
      </p>
    </div>
  );
}

export function SpeedScatterChart({ data }: { data: SpeedDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Crosshair className="h-10 w-10 text-text-muted mb-3 opacity-50" />
        <p className="text-sm text-text-muted">
          ยังไม่มีข้อมูลเปรียบเทียบความเร็ว
        </p>
        <p className="text-xs text-text-muted mt-1">
          บันทึกการต่อสู้เพิ่มเติมเพื่อดูสถิติ
        </p>
      </div>
    );
  }

  const wins = data.filter((d) => d.result === "win");
  const losses = data.filter((d) => d.result === "loss");

  const allSpeeds = data.flatMap((d) => [d.alliedSpeed, d.enemySpeed]);
  const maxSpeed = Math.max(...allSpeeds, 100);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2235" />
        <XAxis
          type="number"
          dataKey="alliedSpeed"
          name="ฝ่ายเรา"
          domain={[0, maxSpeed + 50]}
          tick={{ fill: "#5a5f78", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#1e2235" }}
          label={{
            value: "ความเร็วฝ่ายเรา",
            position: "insideBottom",
            offset: -5,
            style: { fill: "#5a5f78", fontSize: 11 },
          }}
        />
        <YAxis
          type="number"
          dataKey="enemySpeed"
          name="ศัตรู"
          domain={[0, maxSpeed + 50]}
          tick={{ fill: "#5a5f78", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#1e2235" }}
          label={{
            value: "ความเร็วศัตรู",
            angle: -90,
            position: "insideLeft",
            style: { fill: "#5a5f78", fontSize: 11 },
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          segment={[
            { x: 0, y: 0 },
            { x: maxSpeed + 50, y: maxSpeed + 50 },
          ]}
          stroke="#282d42"
          strokeDasharray="5 5"
        />
        <Scatter name="ชนะ" data={wins} fill="#34d399" opacity={0.7} />
        <Scatter name="แพ้" data={losses} fill="#e63946" opacity={0.7} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
