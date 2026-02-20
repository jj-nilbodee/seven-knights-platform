"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Swords,
  Trophy,
  XCircle as XCircleIcon,
  Percent,
  Loader2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getResultBadgeClasses } from "@/lib/badge-utils";
import { deleteBattle } from "@/actions/battles";

type Battle = {
  id: string;
  guildId: string;
  memberId: string;
  memberIgn: string | null;
  date: string;
  weekday: string;
  battleNumber: number;
  battleType: string | null;
  result: string;
  enemyGuildName: string | null;
  enemyPlayerName: string | null;
  alliedTeam: unknown;
  enemyTeam: unknown;
  firstTurn: boolean | null;
  videoUrl: string | null;
  submittedByUserId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type Stats = {
  total: number;
  wins: number;
  losses: number;
  winRate: number;
};

type Member = {
  id: string;
  guildId: string;
  ign: string;
  isActive: boolean | null;
  status: string | null;
  joinedAt: Date | null;
  lastBattleAt: Date | null;
};

function Toast({
  message,
  type,
  onDone,
}: {
  message: string;
  type: "success" | "error";
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] shadow-lg border backdrop-blur-md ${
          type === "success"
            ? "bg-green/20 border-green/30 text-green"
            : "bg-accent/20 border-accent/30 text-accent"
        }`}
      >
        {type === "success" ? (
          <CheckCircle className="h-5 w-5 shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 shrink-0" />
        )}
        <span className="font-medium text-sm">{message}</span>
      </div>
    </div>
  );
}

const weekdayLabels: Record<string, string> = {
  SAT: "เสาร์",
  MON: "จันทร์",
  WED: "พุธ",
};

export function GuildWarClient({
  initialBattles,
  stats,
  members,
}: {
  initialBattles: Battle[];
  stats: Stats;
  members: Member[];
}) {
  const router = useRouter();
  const [filterMember, setFilterMember] = useState("all");
  const [filterResult, setFilterResult] = useState("all");
  const [filterDay, setFilterDay] = useState("all");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingBattle, setDeletingBattle] = useState<Battle | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const filtered = initialBattles.filter((b) => {
    if (filterMember !== "all" && b.memberId !== filterMember) return false;
    if (filterResult !== "all" && b.result !== filterResult) return false;
    if (filterDay !== "all" && b.weekday !== filterDay) return false;
    return true;
  });

  function confirmDelete(battle: Battle) {
    setDeletingBattle(battle);
    setDeleteOpen(true);
  }

  function handleDelete() {
    if (!deletingBattle) return;
    startDelete(async () => {
      const result = await deleteBattle(deletingBattle.id);
      if (result.error) {
        setToast({ message: result.error, type: "error" });
      } else {
        setToast({ message: "ลบการต่อสู้สำเร็จ", type: "success" });
        router.refresh();
      }
      setDeleteOpen(false);
      setDeletingBattle(null);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            สงครามกิลด์
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            ติดตามและจัดการข้อมูลการต่อสู้
          </p>
        </div>
        <Link href="/guild-war/submit">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            บันทึกการต่อสู้
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "รวม",
            value: stats.total,
            icon: Swords,
            color: "text-text-primary",
          },
          {
            label: "ชนะ",
            value: stats.wins,
            icon: Trophy,
            color: "text-green",
          },
          {
            label: "แพ้",
            value: stats.losses,
            icon: XCircleIcon,
            color: "text-accent",
          },
          {
            label: "อัตราชนะ",
            value: `${stats.winRate}%`,
            icon: Percent,
            color: "text-gold",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                {card.label}
              </p>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p
              className={`mt-2 font-display text-2xl font-bold ${card.color}`}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-text-muted" />
        <Select value={filterMember} onValueChange={setFilterMember}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="สมาชิก" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกคน</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.ign}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterResult} onValueChange={setFilterResult}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="ผลลัพธ์" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกผลลัพธ์</SelectItem>
            <SelectItem value="win">ชนะ</SelectItem>
            <SelectItem value="loss">แพ้</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterDay} onValueChange={setFilterDay}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="วัน" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกวัน</SelectItem>
            <SelectItem value="SAT">เสาร์</SelectItem>
            <SelectItem value="MON">จันทร์</SelectItem>
            <SelectItem value="WED">พุธ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Battle table */}
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border-dim">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            รายการการต่อสู้
          </h2>
          <span className="text-sm text-text-muted">
            {filtered.length} รายการ
          </span>
        </div>

        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-dim bg-bg-surface">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    วันที่
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    สมาชิก
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    ครั้งที่
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    คู่ต่อสู้
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    ผลลัพธ์
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    วัน
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((battle) => (
                  <tr
                    key={battle.id}
                    className="border-b border-border-dim last:border-b-0 hover:bg-bg-elevated transition-colors"
                  >
                    <td className="px-4 py-3 text-text-primary font-medium">
                      {battle.date}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {battle.memberIgn ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-center">
                      {battle.battleNumber}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {battle.enemyGuildName || "—"}
                      {battle.enemyPlayerName && (
                        <span className="text-text-muted ml-1">
                          ({battle.enemyPlayerName})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={getResultBadgeClasses(battle.result)}>
                        {battle.result === "win" ? "ชนะ" : "แพ้"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-center">
                      {weekdayLabels[battle.weekday] ?? battle.weekday}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/guild-war/detail?id=${battle.id}`}>
                          <button className="p-1 rounded-[var(--radius-sm)] text-text-muted hover:text-cyan hover:bg-cyan/10 transition-colors">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                        <button
                          onClick={() => confirmDelete(battle)}
                          className="p-1 rounded-[var(--radius-sm)] text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-text-muted">
            ยังไม่มีข้อมูลการต่อสู้
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeletingBattle(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
            <DialogDescription>
              คุณต้องการลบข้อมูลการต่อสู้นี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          {deletingBattle && (
            <div className="py-3 text-sm text-text-secondary">
              <p>
                {deletingBattle.memberIgn} — {deletingBattle.date} ครั้งที่{" "}
                {deletingBattle.battleNumber}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
                setDeletingBattle(null);
              }}
              disabled={isDeleting}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-accent hover:bg-accent-bright"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                "ลบ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
