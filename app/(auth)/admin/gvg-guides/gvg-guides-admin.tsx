"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  updateGvgGuide,
  deleteGvgGuide,
} from "@/actions/gvg-guides";
import type { GuideStatus } from "@/lib/validations/guide";

interface Guide {
  id: string;
  title: string;
  defenseHeroes: string[];
  attackHeroes: string[];
  attackPriority: number;
  patchVersion: string;
  version: number | null;
  status: string | null;
  updatedAt: Date | null;
}

const STATUS_LABELS: Record<
  string,
  { label: string; className: string }
> = {
  draft: { label: "ฉบับร่าง", className: "text-text-muted" },
  published: { label: "เผยแพร่", className: "text-green" },
  archived: { label: "เก็บถาวร", className: "text-gold" },
};

const PRIORITY_COLORS: Record<number, string> = {
  1: "var(--gold)",
  2: "#94a3b8",
  3: "#cd7f32",
};

export function GvgGuidesAdmin({
  initialGuides,
}: {
  initialGuides: Guide[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<Guide | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const [isUpdating, startUpdate] = useTransition();

  const filtered = initialGuides.filter((g) => {
    if (statusFilter !== "all" && g.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        g.title.toLowerCase().includes(q) ||
        g.defenseHeroes.some((h) => h.toLowerCase().includes(q)) ||
        g.attackHeroes.some((h) => h.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Group by defense team
  const grouped = new Map<string, Guide[]>();
  for (const guide of filtered) {
    const key = [...guide.defenseHeroes].sort().join(",");
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(guide);
  }

  function handleStatusChange(guide: Guide, newStatus: GuideStatus) {
    startUpdate(async () => {
      await updateGvgGuide(guide.id, { status: newStatus });
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startDelete(async () => {
      await deleteGvgGuide(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            จัดการคู่มือ GVG
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            สร้าง แก้ไข หรือลบคู่มือทีมโจมตี
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/gvg-guides/new">
            <Plus className="h-4 w-4 mr-2" />
            สร้างคู่มือ
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              placeholder="ค้นหาชื่อคู่มือหรือฮีโร่..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5">
            {(
              [
                { value: "all", label: "ทั้งหมด" },
                { value: "draft", label: "ฉบับร่าง" },
                { value: "published", label: "เผยแพร่" },
                { value: "archived", label: "เก็บถาวร" },
              ] as const
            ).map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  statusFilter === s.value
                    ? "bg-bg-card-hover border-border-bright text-text-primary"
                    : "bg-bg-input border-border-dim text-text-muted"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-text-muted bg-bg-input/30 rounded-[var(--radius-md)] border border-border-dim border-dashed">
          {initialGuides.length === 0
            ? 'ยังไม่มีคู่มือ — คลิก "สร้างคู่มือ" เพื่อเริ่มต้น'
            : "ไม่พบคู่มือที่ตรงกับตัวกรอง"}
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([defKey, groupGuides]) => (
            <div key={defKey}>
              {/* Defense team header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="team-label-defense text-xs">
                  ป้องกัน
                </span>
                <span className="text-sm font-medium text-text-primary">
                  {groupGuides[0].defenseHeroes.join(" / ")}
                </span>
                <span className="text-xs text-text-muted">
                  ({groupGuides.length} ตัวเลือกโจมตี)
                </span>
              </div>

              <div className="space-y-2">
                {groupGuides
                  .sort((a, b) => a.attackPriority - b.attackPriority)
                  .map((guide) => {
                    const statusInfo =
                      STATUS_LABELS[guide.status ?? "draft"];
                    return (
                      <div key={guide.id} className="war-card p-4">
                        <div className="flex items-start gap-3">
                          {/* Priority */}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 font-display"
                            style={{
                              background: "var(--bg-elevated)",
                              border: `1px solid ${PRIORITY_COLORS[guide.attackPriority] || "var(--border-default)"}`,
                              color:
                                PRIORITY_COLORS[guide.attackPriority] ||
                                "var(--text-secondary)",
                            }}
                          >
                            #{guide.attackPriority}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate mb-1 text-text-primary">
                              {guide.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                              <span className="team-label-attack text-[10px]">
                                โจมตี
                              </span>
                              <span>
                                {guide.attackHeroes.join(", ")}
                              </span>
                              <span>|</span>
                              <span className="patch-badge text-[10px]">
                                {guide.patchVersion}
                              </span>
                              <span>|</span>
                              <span className={statusInfo.className}>
                                {statusInfo.label}
                              </span>
                              <span>|</span>
                              <span>v{guide.version}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {guide.status === "draft" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(
                                    guide,
                                    "published",
                                  )
                                }
                                disabled={isUpdating}
                                className="px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50 bg-green/10 border border-green-dim text-green"
                              >
                                เผยแพร่
                              </button>
                            )}
                            {guide.status === "published" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(
                                    guide,
                                    "archived",
                                  )
                                }
                                disabled={isUpdating}
                                className="px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50 bg-bg-elevated border border-border-default text-text-muted"
                              >
                                เก็บถาวร
                              </button>
                            )}
                            {guide.status === "archived" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(guide, "draft")
                                }
                                disabled={isUpdating}
                                className="px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50 bg-bg-elevated border border-border-default text-text-muted"
                              >
                                เปิดใหม่
                              </button>
                            )}
                            <Link
                              href={`/admin/gvg-guides/${guide.id}/edit`}
                              className="p-1.5 rounded-lg text-text-muted hover:text-cyan hover:bg-cyan/10 transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => setDeleteTarget(guide)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ลบคู่มือ</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-semibold text-text-primary">
                {deleteTarget?.title}
              </span>
              ? การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              className="bg-accent hover:bg-accent-bright"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "กำลังลบ..." : "ลบคู่มือ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
