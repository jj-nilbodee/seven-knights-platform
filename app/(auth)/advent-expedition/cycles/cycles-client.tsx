"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  Loader2,
  Map,
  RefreshCw,
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
import {
  createAdventCycle,
  updateAdventCycle,
  deleteAdventCycle,
  generatePlan,
} from "@/actions/advent";
import type { UserRole } from "@/lib/auth";

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
  targetDay: number | null;
  autoRegenerate: boolean | null;
  estimatedDays: number | null;
  actualDays: number | null;
  plan: unknown;
  createdAt: Date | null;
}

interface Props {
  cycles: CycleRow[];
  userRole: UserRole;
}

export function CyclesClient({ cycles: initialCycles, userRole }: Props) {
  const isOfficer = userRole === "admin" || userRole === "officer";
  const [cycles] = useState<CycleRow[]>(initialCycles);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [completeId, setCompleteId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actualDays, setActualDays] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  // Create form state — compute defaults lazily in useState initializer
  const [form, setForm] = useState(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const end = new Date(now);
    end.setDate(end.getDate() + 13);
    return {
      name: "",
      startDate: todayStr,
      endDate: end.toISOString().slice(0, 10),
      targetDay: "9",
      autoRegenerate: true,
    };
  });

  async function handleCreate() {
    setCreating(true);
    const result = await createAdventCycle({
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      targetDay: parseInt(form.targetDay) || 9,
      autoRegenerate: form.autoRegenerate,
    });
    setCreating(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("สร้างรอบใหม่สำเร็จ");
      setCreateOpen(false);
      setForm(() => {
        const now = new Date();
        const end = new Date(now);
        end.setDate(end.getDate() + 13);
        return { name: "", startDate: now.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10), targetDay: "9", autoRegenerate: true };
      });
    }
  }

  async function handleComplete() {
    if (!completeId) return;
    setLoading(completeId);
    const result = await updateAdventCycle(completeId, {
      status: "completed",
      actualDays: parseInt(actualDays) || undefined,
    });
    setLoading(null);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("จบรอบสำเร็จ");
      setCompleteId(null);
      setActualDays("");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setLoading(deleteId);
    const result = await deleteAdventCycle(deleteId);
    setLoading(null);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("ลบรอบสำเร็จ");
      setDeleteId(null);
    }
  }

  async function handleGenerate(cycleId: string) {
    setLoading(cycleId);
    const result = await generatePlan(cycleId);
    setLoading(null);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("สร้างแผนสำเร็จ");
    }
  }

  async function handleActivate(cycleId: string) {
    setLoading(cycleId);
    const result = await updateAdventCycle(cycleId, { status: "active" });
    setLoading(null);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("เปิดใช้งานรอบสำเร็จ");
    }
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
          <h1 className="font-display text-xl font-bold text-text-primary">
            จัดการรอบ Advent
          </h1>
        </div>
        {isOfficer && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            สร้างรอบใหม่
          </Button>
        )}
      </div>

      {/* Cycles List */}
      {cycles.length === 0 ? (
        <div className="war-card p-12 text-center">
          <p className="text-text-muted">ยังไม่มีรอบ</p>
          {isOfficer && (
            <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              สร้างรอบแรก
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {cycles.map((cycle) => {
            const id = cycle.id;
            const status = cycle.status ?? "collecting";
            const isLoading = loading === id;

            return (
              <div key={id} className="war-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {statusLabel(status)}
                    <span className="text-sm font-medium text-text-primary">
                      {cycle.name || "ไม่มีชื่อ"}
                    </span>
                  </div>
                  {cycle.estimatedDays != null && (
                    <span className="text-xs text-text-muted">
                      คาดว่า {cycle.estimatedDays} วัน
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
                  <span>เริ่ม: {cycle.startDate ?? "-"}</span>
                  <span>สิ้นสุด: {cycle.endDate ?? "-"}</span>
                  <span>เป้า: วันที่ {cycle.targetDay ?? 9}</span>
                  {cycle.actualDays != null && (
                    <span className="text-green-400">
                      จบจริง: {cycle.actualDays} วัน
                    </span>
                  )}
                </div>

                {isOfficer && status !== "completed" && (
                  <div className="flex items-center gap-2">
                    {(status === "collecting" || status === "planning") && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleGenerate(id)}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        สร้างแผน
                      </Button>
                    )}
                    {status === "planning" && (
                      <>
                        <Link href="/advent-expedition/plan">
                          <Button variant="outline" size="sm">
                            <Map className="h-3.5 w-3.5" />
                            ดูแผน
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isLoading}
                          onClick={() => handleActivate(id)}
                        >
                          <Play className="h-3.5 w-3.5" />
                          เริ่มรอบ
                        </Button>
                      </>
                    )}
                    {status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => setCompleteId(id)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        จบรอบ
                      </Button>
                    )}
                    {status !== "active" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        disabled={isLoading}
                        onClick={() => setDeleteId(id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Cycle Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างรอบใหม่</DialogTitle>
            <DialogDescription>กำหนดวันเริ่ม-สิ้นสุด และเป้าหมาย</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>ชื่อรอบ</Label>
              <Input
                placeholder="เช่น รอบที่ 5"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>วันเริ่มต้น</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>วันสิ้นสุด</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>เป้าหมาย (จบภายในวันที่)</Label>
              <Input
                type="number"
                min={1}
                max={14}
                value={form.targetDay}
                onChange={(e) => setForm((f) => ({ ...f, targetDay: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoRegenerate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, autoRegenerate: e.target.checked }))
                }
                className="accent-accent"
              />
              <span className="text-sm text-text-secondary">
                สร้างแผนใหม่อัตโนมัติเมื่อคะแนนเปลี่ยน
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreate} disabled={creating || !form.name}>
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              สร้างรอบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Cycle Dialog */}
      <Dialog open={!!completeId} onOpenChange={() => setCompleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>จบรอบ</DialogTitle>
            <DialogDescription>ระบุจำนวนวันที่ใช้จริง</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-1.5">
            <Label>จำนวนวันที่ใช้จริง</Label>
            <Input
              type="number"
              min={1}
              value={actualDays}
              onChange={(e) => setActualDays(e.target.value)}
              placeholder="เช่น 9"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteId(null)}>
              ยกเลิก
            </Button>
            <Button onClick={handleComplete} disabled={!!loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              จบรอบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Cycle Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
            <DialogDescription>ลบรอบนี้จะไม่สามารถกู้คืนได้</DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              ยกเลิก
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={!!loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
