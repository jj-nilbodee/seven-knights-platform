"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Mountain,
  Calendar,
  Map,
  ExternalLink,
  Pencil,
  Users,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { updateMemberProfile, generatePlan } from "@/actions/advent";
import type { UserRole } from "@/lib/auth";

const BOSSES = [
  { id: "teo", name: "Teo", color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/30" },
  { id: "yeonhee", name: "Yeonhee", color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30" },
  { id: "kyle", name: "Kyle", color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30" },
  { id: "karma", name: "Karma", color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/30" },
] as const;

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function statusLabel(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    collecting: { label: "รวบรวม", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    planning: { label: "วางแผน", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    active: { label: "ดำเนินการ", cls: "bg-green-500/20 text-green-400 border-green-500/30" },
    completed: { label: "เสร็จสิ้น", cls: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  };
  const s = map[status] ?? map.collecting;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border ${s.cls}`}>
      {s.label}
    </span>
  );
}

interface CycleRow {
  id: string;
  name: string;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  plan: unknown;
}

interface ProfileRow {
  id: string;
  memberIgn: string;
  memberId: string | null;
  scores: unknown;
  cycleId: string | null;
}

interface Props {
  cycles: CycleRow[];
  activeCycle: CycleRow | null;
  profiles: ProfileRow[];
  stats: {
    totalMembers: number;
    membersWithProfiles: number;
    membersMissing: number;
    totalDamageCapacity: number;
    averageDamage: number;
    bossTotals: Record<string, number>;
  };
  members: Array<{ id: string; ign: string; nickname: string }>;
  userRole: UserRole;
}

export function AdventDashboardClient({
  cycles,
  activeCycle,
  profiles,
  stats,
  userRole,
}: Props) {
  const isOfficer = userRole === "admin" || userRole === "officer";
  const [editProfile, setEditProfile] = useState<ProfileRow | null>(null);
  const [editScores, setEditScores] = useState({ teo: "", yeonhee: "", kyle: "", karma: "" });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const cycleId = activeCycle?.id;
  const cyclePlan = activeCycle?.plan as Record<string, unknown> | null;

  // Filter profiles by search
  const filteredProfiles = profiles.filter((p) => {
    const ign = (p.memberIgn as string).toLowerCase();
    return ign.includes(search.toLowerCase());
  });

  // Get today's assignments from plan
  const today = new Date().toISOString().slice(0, 10);
  type DayPlan = {
    dayNumber: number;
    date: string;
    assignments: Array<{ boss: string; memberIgn: string }>;
  };
  const dailyPlans = (cyclePlan?.dailyPlans ?? []) as DayPlan[];
  const todayPlan = dailyPlans.find((d) => d.date === today) ?? null;

  function openEdit(profile: ProfileRow) {
    const scores = profile.scores as Record<string, number>;
    setEditProfile(profile);
    setEditScores({
      teo: scores.teo?.toString() ?? "0",
      yeonhee: scores.yeonhee?.toString() ?? "0",
      kyle: scores.kyle?.toString() ?? "0",
      karma: scores.karma?.toString() ?? "0",
    });
  }

  async function handleSaveProfile() {
    if (!editProfile) return;
    setSaving(true);
    const result = await updateMemberProfile(editProfile.id, {
      scores: {
        teo: parseInt(editScores.teo) || 0,
        yeonhee: parseInt(editScores.yeonhee) || 0,
        kyle: parseInt(editScores.kyle) || 0,
        karma: parseInt(editScores.karma) || 0,
      },
    });
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("อัปเดตคะแนนสำเร็จ");
      setEditProfile(null);
    }
  }

  async function handleGeneratePlan() {
    if (!cycleId) return;
    setGenerating(true);
    const result = await generatePlan(cycleId);
    setGenerating(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("สร้างแผนสำเร็จ");
    }
  }

  function copySubmitLink() {
    const url = `${window.location.origin}/submit/advent-expedition`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("คัดลอกลิงก์แล้ว");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-accent/10">
            <Mountain className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-text-primary">
              Advent Expedition
            </h1>
            <p className="text-sm text-text-muted">จัดการแผนตีบอสอีเวนต์</p>
          </div>
        </div>
        {isOfficer && (
          <Button variant="outline" size="sm" onClick={copySubmitLink}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            ลิงก์ส่งคะแนน
          </Button>
        )}
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/advent-expedition/cycles"
          className="war-card p-4 flex items-center gap-3 group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">จัดการรอบ</p>
            <p className="text-xs text-text-muted">{cycles.length} รอบ</p>
          </div>
        </Link>

        <Link
          href="/advent-expedition/plan"
          className="war-card p-4 flex items-center gap-3 group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-green-500/10 text-green-400 group-hover:bg-green-500/20 transition-colors">
            <Map className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">ดูแผน</p>
            <p className="text-xs text-text-muted">
              {cyclePlan ? "มีแผนแล้ว" : "ยังไม่มีแผน"}
            </p>
          </div>
        </Link>

        <Link
          href="/submit/advent-expedition"
          target="_blank"
          className="war-card p-4 flex items-center gap-3 group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
            <ExternalLink className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">ส่งคะแนน</p>
            <p className="text-xs text-text-muted">หน้าสาธารณะ</p>
          </div>
        </Link>
      </div>

      {/* Active Cycle Banner */}
      {activeCycle && (
        <div className="war-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {statusLabel(activeCycle.status ?? "collecting")}
            <span className="text-sm font-medium text-text-primary">
              {activeCycle.name || "รอบปัจจุบัน"}
            </span>
            <span className="text-xs text-text-muted">
              {activeCycle.startDate} — {activeCycle.endDate}
            </span>
          </div>
          {isOfficer && (
            <Button
              size="sm"
              onClick={handleGeneratePlan}
              disabled={generating}
            >
              {generating && <Loader2 className="h-4 w-4 animate-spin" />}
              {cyclePlan ? "สร้างแผนใหม่" : "สร้างแผน"}
            </Button>
          )}
        </div>
      )}

      {/* Today's Assignments */}
      {todayPlan && (
        <div className="space-y-3">
          <h2 className="font-display text-sm font-semibold text-text-secondary uppercase tracking-wider">
            แผนวันนี้ — วันที่ {todayPlan.dayNumber}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BOSSES.map((boss) => {
              const assignments = todayPlan.assignments?.filter(
                (a) => a.boss === boss.id,
              );
              return (
                <div key={boss.id} className={`war-card p-3 border-t-2 ${boss.border}`}>
                  <p className={`text-sm font-semibold mb-2 ${boss.color}`}>{boss.name}</p>
                  {assignments && assignments.length > 0 ? (
                    <ul className="space-y-1">
                      {assignments.map((a, i) => (
                        <li key={i} className="text-xs text-text-secondary">
                          {a.memberIgn}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-text-muted">-</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="war-card p-4">
          <p className="text-xs text-text-muted mb-1">สมาชิกทั้งหมด</p>
          <p className="font-display text-xl font-bold text-text-primary">
            {stats.totalMembers}
          </p>
        </div>
        <div className="war-card p-4">
          <p className="text-xs text-text-muted mb-1">มีคะแนนแล้ว</p>
          <p className="font-display text-xl font-bold text-green-400">
            {stats.membersWithProfiles}
          </p>
        </div>
        <div className="war-card p-4">
          <p className="text-xs text-text-muted mb-1">ยังไม่มีคะแนน</p>
          <p className="font-display text-xl font-bold text-yellow-400">
            {stats.membersMissing}
          </p>
        </div>
        <div className="war-card p-4">
          <p className="text-xs text-text-muted mb-1">ดาเมจรวม</p>
          <p className="font-display text-xl font-bold text-accent">
            {formatNumber(stats.totalDamageCapacity)}
          </p>
        </div>
      </div>

      {/* Boss Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {BOSSES.map((boss) => (
          <div key={boss.id} className={`war-card p-3 border-t-2 ${boss.border}`}>
            <p className={`text-xs font-medium mb-1 ${boss.color}`}>{boss.name}</p>
            <p className="font-display text-lg font-bold text-text-primary">
              {formatNumber(stats.bossTotals[boss.id] ?? 0)}
            </p>
            <p className="text-[10px] text-text-muted">ดาเมจรวม/วัน</p>
          </div>
        ))}
      </div>

      {/* Member Profiles Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-text-muted" />
            <h2 className="font-display text-sm font-semibold text-text-secondary uppercase tracking-wider">
              โปรไฟล์สมาชิก
            </h2>
          </div>
          <Input
            placeholder="ค้นหา IGN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
        </div>

        <div className="war-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-dim">
                  <th className="text-left p-3 text-text-muted font-medium">IGN</th>
                  {BOSSES.map((b) => (
                    <th key={b.id} className={`text-right p-3 font-medium ${b.color}`}>
                      {b.name}
                    </th>
                  ))}
                  {isOfficer && (
                    <th className="text-center p-3 text-text-muted font-medium w-12"></th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isOfficer ? 6 : 5}
                      className="p-6 text-center text-text-muted"
                    >
                      {search ? "ไม่พบสมาชิก" : "ยังไม่มีข้อมูลคะแนน"}
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((profile) => {
                    const scores = profile.scores as Record<string, number>;
                    return (
                      <tr
                        key={profile.id}
                        className="border-b border-border-dim/50 hover:bg-bg-elevated/50 transition-colors"
                      >
                        <td className="p-3 text-text-primary font-medium">
                          {profile.memberIgn}
                        </td>
                        {BOSSES.map((b) => (
                          <td key={b.id} className="text-right p-3 text-text-secondary tabular-nums">
                            {scores[b.id] ? formatNumber(scores[b.id]) : "-"}
                          </td>
                        ))}
                        {isOfficer && (
                          <td className="text-center p-3">
                            <button
                              className="text-text-muted hover:text-accent transition-colors cursor-pointer"
                              onClick={() => openEdit(profile)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={!!editProfile} onOpenChange={() => setEditProfile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขคะแนน — {editProfile?.memberIgn}</DialogTitle>
            <DialogDescription>
              กรอกคะแนนดาเมจต่อบอสแต่ละตัว
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {BOSSES.map((boss) => (
              <div key={boss.id} className="space-y-1.5">
                <Label className={boss.color}>{boss.name}</Label>
                <Input
                  type="number"
                  value={editScores[boss.id as keyof typeof editScores]}
                  onChange={(e) =>
                    setEditScores((s) => ({ ...s, [boss.id]: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProfile(null)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
