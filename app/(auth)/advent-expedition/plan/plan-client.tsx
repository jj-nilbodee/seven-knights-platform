"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Skull,
  Copy,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generatePlan } from "@/actions/advent";
import type { UserRole } from "@/lib/auth";

const BOSSES = [
  { id: "teo", name: "Teo", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  { id: "yeonhee", name: "Yeonhee", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  { id: "kyle", name: "Kyle", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  { id: "karma", name: "Karma", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
] as const;

function formatHp(hp: number): string {
  if (hp <= 0) return "Dead";
  if (hp >= 1_000_000) return `${(hp / 1_000_000).toFixed(1)}M`;
  if (hp >= 1_000) return `${(hp / 1_000).toFixed(0)}K`;
  return hp.toLocaleString();
}

interface DailyPlan {
  date: string;
  dayNumber: number;
  assignments: Array<{
    memberId: string;
    memberIgn: string;
    boss: string;
  }>;
  bossHpAfter: Record<string, number>;
  bossesKilledToday: string[];
}

interface GeneratedPlan {
  estimatedDays: number;
  targetDay: number;
  targetMet: boolean;
  warningMessage: string | null;
  dailyPlans: DailyPlan[];
  summary: Record<string, number>;
  totalEntriesPerBoss: Record<string, number>;
  totalMembers: number;
  membersWithScores: number;
  membersWithoutScores: Array<{ memberId: string; memberIgn: string }>;
  generatedAt: string;
}

interface CycleRow {
  id: string;
  name: string;
  status: string | null;
  plan: unknown;
}

interface Props {
  cycle: CycleRow | null;
  userRole: UserRole;
}

export function PlanClient({ cycle, userRole }: Props) {
  const isOfficer = userRole === "admin" || userRole === "officer";
  const [selectedDay, setSelectedDay] = useState(0);
  const [regenerating, setRegenerate] = useState(false);

  const plan = cycle?.plan as GeneratedPlan | null;

  if (!cycle) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/advent-expedition"
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-elevated hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-xl font-bold text-text-primary">แผน Advent</h1>
        </div>
        <div className="war-card p-12 text-center text-text-muted">
          ไม่มีรอบที่ดำเนินอยู่ — สร้างรอบใหม่ก่อน
        </div>
      </div>
    );
  }

  if (!plan || !plan.dailyPlans?.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/advent-expedition"
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-elevated hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-xl font-bold text-text-primary">แผน Advent</h1>
        </div>
        <div className="war-card p-12 text-center text-text-muted">
          ยังไม่มีแผน — กดสร้างแผนในหน้าจัดการรอบ
        </div>
      </div>
    );
  }

  const currentDay = plan.dailyPlans[selectedDay];
  const totalDays = plan.dailyPlans.length;

  async function handleRegenerate() {
    if (!cycle) return;
    setRegenerate(true);
    const result = await generatePlan(cycle.id);
    setRegenerate(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("สร้างแผนใหม่สำเร็จ");
    }
  }

  function copyPlanText() {
    if (!plan) return;
    let text = `Advent Plan — ${(cycle?.name) || "Current"}\n`;
    text += `เป้า: วันที่ ${plan.targetDay} | คาด: วันที่ ${plan.estimatedDays}\n\n`;

    for (const day of plan.dailyPlans) {
      text += `=== วันที่ ${day.dayNumber} (${day.date}) ===\n`;
      for (const boss of BOSSES) {
        const members = day.assignments.filter((a) => a.boss === boss.id);
        if (members.length > 0) {
          text += `${boss.name}: ${members.map((m) => m.memberIgn).join(", ")}\n`;
        }
      }
      if (day.bossesKilledToday.length > 0) {
        text += `*** จบ: ${day.bossesKilledToday.join(", ")} ***\n`;
      }
      text += "\n";
    }

    navigator.clipboard.writeText(text);
    toast.success("คัดลอกแผนแล้ว");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/advent-expedition"
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-elevated hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-text-primary">แผน Advent</h1>
            <p className="text-sm text-text-muted">{(cycle.name as string) || "รอบปัจจุบัน"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyPlanText}>
            <Copy className="h-3.5 w-3.5" />
            คัดลอก
          </Button>
          {isOfficer && (
            <Button size="sm" onClick={handleRegenerate} disabled={regenerating}>
              {regenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              สร้างใหม่
            </Button>
          )}
        </div>
      </div>

      {/* Warning */}
      {plan.warningMessage && (
        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-yellow-500/30 bg-yellow-500/10 p-3">
          <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-300">{plan.warningMessage}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="war-card p-3 text-center">
          <p className="text-xs text-text-muted mb-1">เป้าหมาย</p>
          <p className="font-display text-lg font-bold text-text-primary">
            วันที่ {plan.targetDay}
          </p>
        </div>
        <div className="war-card p-3 text-center">
          <p className="text-xs text-text-muted mb-1">คาดว่าจบ</p>
          <p className={`font-display text-lg font-bold ${plan.targetMet ? "text-green-400" : "text-yellow-400"}`}>
            วันที่ {plan.estimatedDays}
          </p>
        </div>
        <div className="war-card p-3 text-center">
          <p className="text-xs text-text-muted mb-1">สมาชิก</p>
          <p className="font-display text-lg font-bold text-text-primary">
            {plan.membersWithScores}/{plan.totalMembers}
          </p>
        </div>
        <div className="war-card p-3 text-center">
          <p className="text-xs text-text-muted mb-1">จำนวนวัน</p>
          <p className="font-display text-lg font-bold text-text-primary">{totalDays}</p>
        </div>
      </div>

      {/* Boss Entries */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {BOSSES.map((boss) => (
          <div key={boss.id} className={`war-card p-3 border-t-2 ${boss.border}`}>
            <p className={`text-xs font-medium ${boss.color}`}>{boss.name}</p>
            <p className="font-display text-lg font-bold text-text-primary">
              {plan.totalEntriesPerBoss[boss.id] ?? 0}
            </p>
            <p className="text-[10px] text-text-muted">ครั้งทั้งหมด</p>
            {boss.id in plan.summary && (
              <p className="text-[10px] text-green-400 mt-1">
                จบวันที่ {plan.summary[boss.id]}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Members Without Scores */}
      {plan.membersWithoutScores.length > 0 && (
        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-yellow-500/30 bg-yellow-500/10 p-3">
          <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-300 font-medium mb-1">
              สมาชิกที่ยังไม่มีคะแนน ({plan.membersWithoutScores.length})
            </p>
            <p className="text-xs text-yellow-400/70">
              {plan.membersWithoutScores.map((m) => m.memberIgn).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Day Navigation */}
      <div className="war-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={selectedDay === 0}
            onClick={() => setSelectedDay((d) => d - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            ก่อนหน้า
          </Button>
          <div className="text-center">
            <p className="font-display text-sm font-bold text-text-primary">
              วันที่ {currentDay.dayNumber}
            </p>
            <p className="text-xs text-text-muted">{currentDay.date}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={selectedDay === totalDays - 1}
            onClick={() => setSelectedDay((d) => d + 1)}
          >
            ถัดไป
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Boss HP for this day */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BOSSES.map((boss) => {
            const hp = currentDay.bossHpAfter[boss.id] ?? 0;
            const isDead = hp <= 0;
            const killedToday = currentDay.bossesKilledToday.includes(boss.id);
            return (
              <div
                key={boss.id}
                className={`rounded-[var(--radius-sm)] px-3 py-2 text-center ${
                  isDead
                    ? "bg-green-500/10 border border-green-500/30"
                    : `${boss.bg} border ${boss.border}`
                }`}
              >
                <p className={`text-xs font-medium ${isDead ? "text-green-400" : boss.color}`}>
                  {boss.name}
                </p>
                <p className={`font-display text-sm font-bold ${isDead ? "text-green-400" : "text-text-primary"}`}>
                  {isDead ? (
                    <span className="flex items-center justify-center gap-1">
                      <Skull className="h-3.5 w-3.5" /> Dead
                    </span>
                  ) : (
                    formatHp(hp)
                  )}
                </p>
                {killedToday && (
                  <p className="text-[10px] text-green-400 font-medium">จบวันนี้!</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Assignments by Boss */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BOSSES.map((boss) => {
            const assignments = currentDay.assignments.filter(
              (a) => a.boss === boss.id,
            );
            return (
              <div key={boss.id} className="space-y-1">
                <p className={`text-xs font-semibold ${boss.color}`}>
                  {boss.name} ({assignments.length})
                </p>
                {assignments.length > 0 ? (
                  <ul className="space-y-0.5">
                    {assignments.map((a, i) => (
                      <li key={i} className="text-xs text-text-secondary pl-2 border-l-2 border-border-dim">
                        {a.memberIgn}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-text-muted pl-2">-</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Day Select */}
      <div className="flex flex-wrap gap-1.5">
        {plan.dailyPlans.map((day, i) => {
          const hasKill = day.bossesKilledToday.length > 0;
          return (
            <button
              key={i}
              className={`px-2.5 py-1 text-xs rounded-[var(--radius-sm)] transition-colors cursor-pointer ${
                i === selectedDay
                  ? "bg-accent text-white"
                  : hasKill
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-bg-elevated text-text-secondary hover:bg-bg-card hover:text-text-primary border border-border-dim"
              }`}
              onClick={() => setSelectedDay(i)}
            >
              D{day.dayNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
}
