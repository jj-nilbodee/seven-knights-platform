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
import { EmptyState } from "@/components/ui/empty-state";
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
      <EmptyState icon={Crosshair} message="ยังไม่มีข้อมูลเปรียบเทียบความเร็ว" detail="บันทึกการต่อสู้เพิ่มเติมเพื่อดูสถิติ" />
    );
  }

  const wins = data.filter((d) => d.result === "win");
  const losses = data.filter((d) => d.result === "loss");

  const allSpeeds = data.flatMap((d) => [d.alliedSpeed, d.enemySpeed]);
  const maxSpeed = Math.max(...allSpeeds, 100);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dim)" />
        <XAxis
          type="number"
          dataKey="alliedSpeed"
          name="ฝ่ายเรา"
          domain={[0, maxSpeed + 50]}
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border-dim)" }}
          label={{
            value: "ความเร็วฝ่ายเรา",
            position: "insideBottom",
            offset: -5,
            style: { fill: "var(--text-muted)", fontSize: 11 },
          }}
        />
        <YAxis
          type="number"
          dataKey="enemySpeed"
          name="ศัตรู"
          domain={[0, maxSpeed + 50]}
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border-dim)" }}
          label={{
            value: "ความเร็วศัตรู",
            angle: -90,
            position: "insideLeft",
            style: { fill: "var(--text-muted)", fontSize: 11 },
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          segment={[
            { x: 0, y: 0 },
            { x: maxSpeed + 50, y: maxSpeed + 50 },
          ]}
          stroke="var(--border-default)"
          strokeDasharray="5 5"
        />
        <Scatter name="ชนะ" data={wins} fill="var(--green)" opacity={0.7} />
        <Scatter name="แพ้" data={losses} fill="var(--accent)" opacity={0.7} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
