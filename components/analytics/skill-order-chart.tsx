"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Zap, Star } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { SkillOrderImpact } from "@/lib/db/queries/analytics";

const POSITION_COLORS = {
  position1: "var(--accent)",
  position2: "var(--cyan)",
  position3: "var(--gold)",
};

interface TooltipPayloadItem {
  dataKey: string;
  name: string;
  value: number;
  fill: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-3 shadow-lg text-sm">
      <p className="font-medium text-text-primary mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-xs text-text-secondary">
          <span style={{ color: p.fill }}>{p.name}</span>: {p.value}%
        </p>
      ))}
    </div>
  );
}

export function SkillOrderChart({ skills }: { skills: SkillOrderImpact[] }) {
  if (skills.length === 0) {
    return (
      <EmptyState icon={Zap} message="ยังไม่มีข้อมูลลำดับสกิล" detail="บันทึกการต่อสู้เพิ่มเติมเพื่อดูสถิติ" />
    );
  }

  const chartData = skills.slice(0, 15).map((s) => ({
    name: `${s.heroName}\n${s.skillLabel}`,
    label: s.skillLabel,
    "ลำดับ 1": s.position1.winRate,
    "ลำดับ 2": s.position2.winRate,
    "ลำดับ 3": s.position3.winRate,
    bestPosition: s.bestPosition,
  }));

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={Math.max(300, skills.length * 35)}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dim)" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border-dim)" }}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border-dim)" }}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "var(--text-secondary)" }}
          />
          <Bar dataKey="ลำดับ 1" fill={POSITION_COLORS.position1} radius={[0, 2, 2, 0]} barSize={8} />
          <Bar dataKey="ลำดับ 2" fill={POSITION_COLORS.position2} radius={[0, 2, 2, 0]} barSize={8} />
          <Bar dataKey="ลำดับ 3" fill={POSITION_COLORS.position3} radius={[0, 2, 2, 0]} barSize={8} />
        </BarChart>
      </ResponsiveContainer>

      {/* Best position table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-dim">
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">สกิล</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">ฮีโร่</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-text-muted">ลำดับที่ดีที่สุด</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-text-muted">ใช้ทั้งหมด</th>
            </tr>
          </thead>
          <tbody>
            {skills.slice(0, 20).map((s) => (
              <tr key={s.skillId} className="border-b border-border-dim/50 hover:bg-bg-elevated/50">
                <td className="px-3 py-2 font-medium text-text-primary">{s.skillLabel}</td>
                <td className="px-3 py-2 text-text-secondary">{s.heroName}</td>
                <td className="px-3 py-2 text-center">
                  <span className="inline-flex items-center gap-1 text-gold text-xs font-medium">
                    <Star className="h-3 w-3" />
                    ลำดับ {s.bestPosition}
                  </span>
                </td>
                <td className="px-3 py-2 text-center text-text-secondary">{s.totalUses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
