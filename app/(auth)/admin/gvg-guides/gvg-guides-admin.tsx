"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Shield,
  Swords,
} from "lucide-react";
import { generatePageNumbers } from "@/lib/utils";
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
import { HeroPortrait } from "@/components/ui/hero-portrait";
import {
  updateGvgGuide,
  deleteGvgGuide,
  reorderGuidePriority,
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

interface HeroInfo {
  id: string;
  name: string;
  imageUrl: string | null;
}

const STATUS_LABELS: Record<
  string,
  { label: string; className: string; bg: string }
> = {
  draft: {
    label: "ฉบับร่าง",
    className: "text-text-muted",
    bg: "bg-text-muted/10",
  },
  published: {
    label: "เผยแพร่",
    className: "text-green",
    bg: "bg-green/10",
  },
  archived: {
    label: "เก็บถาวร",
    className: "text-gold",
    bg: "bg-gold/10",
  },
};

const PRIORITY_COLORS: Record<number, string> = {
  1: "var(--gold)",
  2: "var(--silver)",
  3: "var(--bronze)",
};


export function GvgGuidesAdmin({
  initialGuides,
  heroes,
  pagination,
}: {
  initialGuides: Guide[];
  heroes: HeroInfo[];
  pagination: { page: number; totalPages: number; totalCount: number };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [deleteTarget, setDeleteTarget] = useState<Guide | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );
  const [isDeleting, startDelete] = useTransition();
  const [isUpdating, startUpdate] = useTransition();
  const [isNavigating, startNavigating] = useTransition();

  const currentSearch = searchParams.get("search") ?? "";
  const currentStatus = searchParams.get("status") ?? "all";

  const heroByName = (name: string) => heroes.find((h) => h.name === name);

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    startNavigating(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  // Group by defense team
  const grouped = new Map<string, Guide[]>();
  for (const guide of initialGuides) {
    const key = [...guide.defenseHeroes].sort().join(",");
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(guide);
  }

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function collapseAll() {
    setCollapsedGroups(new Set(grouped.keys()));
  }

  function expandAll() {
    setCollapsedGroups(new Set());
  }

  function handleStatusChange(guide: Guide, newStatus: GuideStatus) {
    startUpdate(async () => {
      await updateGvgGuide(guide.id, { status: newStatus });
      router.refresh();
    });
  }

  function handleReorder(guideId: string, direction: "up" | "down") {
    startUpdate(async () => {
      await reorderGuidePriority(guideId, direction);
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

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const allCollapsed =
    grouped.size > 0 && collapsedGroups.size === grouped.size;

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
          <form
            className="relative flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              setFilter("search", fd.get("search") as string);
            }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              name="search"
              placeholder="ค้นหาชื่อคู่มือหรือฮีโร่..."
              defaultValue={currentSearch}
              className="pl-9"
            />
          </form>
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
                onClick={() => setFilter("status", s.value)}
                disabled={isNavigating}
                className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-all cursor-pointer border ${
                  currentStatus === s.value
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
      {initialGuides.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-text-muted bg-bg-input/30 rounded-[var(--radius-md)] border border-border-dim border-dashed">
          {currentSearch || currentStatus !== "all"
            ? "ไม่พบคู่มือที่ตรงกับตัวกรอง"
            : 'ยังไม่มีคู่มือ — คลิก "สร้างคู่มือ" เพื่อเริ่มต้น'}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Collapse/Expand controls */}
          {grouped.size > 1 && (
            <div className="flex justify-end">
              <button
                onClick={allCollapsed ? expandAll : collapseAll}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
              >
                {allCollapsed ? "ขยายทั้งหมด" : "ย่อทั้งหมด"}
              </button>
            </div>
          )}

          {Array.from(grouped.entries()).map(([defKey, groupGuides]) => {
            const isCollapsed = collapsedGroups.has(defKey);
            const defHeroes = groupGuides[0].defenseHeroes;
            const publishedCount = groupGuides.filter(
              (g) => g.status === "published",
            ).length;

            return (
              <div
                key={defKey}
                className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card overflow-hidden"
              >
                {/* Defense team group header — clickable to collapse */}
                <button
                  onClick={() => toggleGroup(defKey)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-bg-elevated hover:bg-bg-card-hover transition-colors cursor-pointer"
                >
                  {/* Chevron */}
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-text-muted flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-text-muted flex-shrink-0" />
                  )}

                  {/* Defense label */}
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-cyan" />
                    <span className="text-xs font-semibold text-cyan uppercase tracking-wider">
                      ป้องกัน
                    </span>
                  </div>

                  {/* Hero portraits */}
                  <div className="flex items-center gap-2">
                    {defHeroes.map((name) => (
                      <div
                        key={name}
                        className="flex items-center gap-1.5"
                      >
                        <HeroPortrait
                          hero={heroByName(name)}
                          size={42}
                          className="hero-portrait-defense"
                        />
                        <span className="text-sm text-text-primary hidden sm:inline">
                          {name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Count badge */}
                  <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                    {publishedCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green/10 text-green border border-green-dim">
                        {publishedCount} เผยแพร่
                      </span>
                    )}
                    <span className="text-xs text-text-muted">
                      {groupGuides.length} ตัวเลือก
                    </span>
                  </div>
                </button>

                {/* Guides list — collapsible */}
                {!isCollapsed && (
                  <div className="divide-y divide-border-dim">
                    {groupGuides
                      .sort((a, b) => a.attackPriority - b.attackPriority)
                      .map((guide, index) => {
                        const displayPriority = index + 1;
                        const isFirst = index === 0;
                        const isLast = index === groupGuides.length - 1;
                        const statusInfo =
                          STATUS_LABELS[guide.status ?? "draft"];
                        return (
                          <div
                            key={guide.id}
                            className="px-4 py-3 hover:bg-bg-card-hover/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {/* Priority badge + reorder */}
                              <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                                <button
                                  onClick={() =>
                                    handleReorder(guide.id, "up")
                                  }
                                  disabled={isFirst || isUpdating}
                                  className="p-0.5 rounded text-text-muted hover:text-text-primary disabled:opacity-20 disabled:cursor-default cursor-pointer transition-colors"
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </button>
                                <div
                                  className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center font-bold text-xs font-display"
                                  style={{
                                    background: "var(--bg-elevated)",
                                    border: `1.5px solid ${PRIORITY_COLORS[displayPriority] || "var(--border-default)"}`,
                                    color:
                                      PRIORITY_COLORS[displayPriority] ||
                                      "var(--text-secondary)",
                                  }}
                                >
                                  #{displayPriority}
                                </div>
                                <button
                                  onClick={() =>
                                    handleReorder(guide.id, "down")
                                  }
                                  disabled={isLast || isUpdating}
                                  className="p-0.5 rounded text-text-muted hover:text-text-primary disabled:opacity-20 disabled:cursor-default cursor-pointer transition-colors"
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>

                              {/* Attack team portraits */}
                              <div className="flex items-center gap-1.5">
                                <Swords className="h-3 w-3 text-accent flex-shrink-0" />
                                {guide.attackHeroes.map((name) => (
                                  <HeroPortrait
                                    key={name}
                                    hero={heroByName(name)}
                                    size={38}
                                    className="hero-portrait-attack"
                                  />
                                ))}
                              </div>

                              {/* Guide info */}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate text-text-primary">
                                  {guide.attackHeroes.join(", ")}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="patch-badge text-[10px]">
                                    {guide.patchVersion}
                                  </span>
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.className}`}
                                  >
                                    {statusInfo.label}
                                  </span>
                                  <span className="text-[10px] text-text-muted">
                                    v{guide.version}
                                  </span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {guide.status === "draft" && (
                                  <button
                                    onClick={() =>
                                      handleStatusChange(guide, "published")
                                    }
                                    disabled={isUpdating}
                                    className="px-2 py-1 rounded-[var(--radius-sm)] text-[11px] transition-colors cursor-pointer disabled:opacity-50 bg-green/10 border border-green-dim text-green hover:bg-green/20"
                                  >
                                    เผยแพร่
                                  </button>
                                )}
                                {guide.status === "published" && (
                                  <button
                                    onClick={() =>
                                      handleStatusChange(guide, "archived")
                                    }
                                    disabled={isUpdating}
                                    className="px-2 py-1 rounded-[var(--radius-sm)] text-[11px] transition-colors cursor-pointer disabled:opacity-50 bg-bg-elevated border border-border-default text-text-muted hover:text-text-secondary"
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
                                    className="px-2 py-1 rounded-[var(--radius-sm)] text-[11px] transition-colors cursor-pointer disabled:opacity-50 bg-bg-elevated border border-border-default text-text-muted hover:text-text-secondary"
                                  >
                                    เปิดใหม่
                                  </button>
                                )}
                                <Link
                                  href={`/admin/gvg-guides/${guide.id}/edit`}
                                  className="p-1.5 rounded-[var(--radius-sm)] text-text-muted hover:text-cyan hover:bg-cyan/10 transition-colors"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Link>
                                <button
                                  onClick={() => setDeleteTarget(guide)}
                                  className="p-1.5 rounded-[var(--radius-sm)] text-text-muted hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">
            หน้า {pagination.page} จาก {pagination.totalPages} ({pagination.totalCount} คู่มือ)
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => goToPage(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {generatePageNumbers(pagination.page, pagination.totalPages).map(
              (p, i) =>
                p === "..." ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-2 text-sm text-text-muted"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === pagination.page ? "default" : "outline"}
                    size="sm"
                    className="min-w-[36px]"
                    onClick={() => goToPage(p as number)}
                  >
                    {p}
                  </Button>
                ),
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => goToPage(pagination.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
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
