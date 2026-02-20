"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Pencil,
  Users,
  AlertTriangle,
  UserX,
  Eye,
  EyeOff,
  ListPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStatusBadgeClasses } from "@/lib/badge-utils";
import { memberStatuses } from "@/lib/validations/member";
import { createMember, updateMember, bulkAddMembers } from "@/actions/members";

type Member = {
  id: string;
  guildId: string;
  ign: string;
  isActive: boolean | null;
  status: string | null;
  joinedAt: Date | null;
  lastBattleAt: Date | null;
};

type Stats = {
  total: number;
  active: number;
  warning: number;
  inactive: number;
};

export function RosterClient({
  initialMembers,
  stats,
  guildId,
}: {
  initialMembers: Member[];
  stats: Stats;
  guildId: string;
}) {
  const router = useRouter();
  const [showInactive, setShowInactive] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Form state
  const [ign, setIgn] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [bulkText, setBulkText] = useState("");

  const [isAdding, startAdd] = useTransition();
  const [isEditing, startEdit] = useTransition();
  const [isBulking, startBulk] = useTransition();

  const filtered = showInactive
    ? initialMembers
    : initialMembers.filter((m) => m.status !== "inactive" && m.isActive !== false);

  function openEdit(member: Member) {
    setEditingMember(member);
    setIgn(member.ign);
    setEditStatus(member.status ?? "active");
    setEditOpen(true);
  }

  function resetAdd() {
    setIgn("");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("ign", ign);

    startAdd(async () => {
      const result = await createMember(fd, guildId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("เพิ่มสมาชิกสำเร็จ!");
        setAddOpen(false);
        resetAdd();
        router.refresh();
      }
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMember) return;

    const fd = new FormData();
    fd.set("ign", ign);
    fd.set("status", editStatus);

    startEdit(async () => {
      const result = await updateMember(editingMember.id, fd);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("อัปเดตสมาชิกสำเร็จ!");
        setEditOpen(false);
        setEditingMember(null);
        router.refresh();
      }
    });
  }

  async function handleBulk() {
    if (!bulkText.trim()) return;
    startBulk(async () => {
      const result = await bulkAddMembers(bulkText, guildId);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else if ("added" in result) {
        toast.success(`นำเข้าสำเร็จ! เพิ่ม: ${result.added}, ข้าม: ${result.skipped}`);
        setBulkOpen(false);
        setBulkText("");
        router.refresh();
      }
    });
  }

  const bulkCount = bulkText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            สมาชิกกิลด์
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            จัดการรายชื่อสมาชิกในกิลด์
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <ListPlus className="h-4 w-4 mr-2" />
            นำเข้า
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มสมาชิก
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "ใช้งาน",
            value: `${stats.active} / 30`,
            icon: Users,
            color: "text-green",
          },
          {
            label: "เตือน",
            value: stats.warning,
            icon: AlertTriangle,
            color: "text-gold",
          },
          {
            label: "ไม่ใช้งาน",
            value: stats.inactive,
            icon: UserX,
            color: "text-text-muted",
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
            <p className={`mt-2 font-display text-2xl font-bold ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Member table */}
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border-dim">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            รายชื่อ
          </h2>
          {stats.inactive > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInactive((v) => !v)}
            >
              {showInactive ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {showInactive ? "ซ่อนไม่ใช้งาน" : "แสดงทั้งหมด"}
            </Button>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-dim bg-bg-surface">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    IGN
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    แก้ไข
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-border-dim last:border-b-0 hover:bg-bg-elevated transition-colors"
                  >
                    <td className="px-4 py-3 text-text-primary font-medium">
                      {member.ign}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={getStatusBadgeClasses(
                          member.status ?? "active",
                        )}
                      >
                        {member.status ?? "active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(member)}
                        className="p-1 rounded-[var(--radius-sm)] text-text-muted hover:text-cyan hover:bg-cyan/10 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-text-muted">
            ยังไม่มีสมาชิก
          </div>
        )}
      </div>

      {/* Add member dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) resetAdd();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มสมาชิก</DialogTitle>
            <DialogDescription>
              เพิ่มสมาชิกใหม่เข้ากิลด์
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd}>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">
                  IGN *
                </label>
                <Input
                  placeholder="ชื่อในเกม"
                  value={ign}
                  onChange={(e) => setIgn(e.target.value)}
                  disabled={isAdding}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddOpen(false);
                  resetAdd();
                }}
                disabled={isAdding}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isAdding || !ign.trim()}>
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    กำลังเพิ่ม...
                  </>
                ) : (
                  "เพิ่มสมาชิก"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit member dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingMember(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขสมาชิก</DialogTitle>
            <DialogDescription>
              อัปเดตข้อมูลและสถานะสมาชิก
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">
                  IGN *
                </label>
                <Input
                  value={ign}
                  onChange={(e) => setIgn(e.target.value)}
                  disabled={isEditing}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">
                  สถานะ
                </label>
                <Select
                  value={editStatus}
                  onValueChange={setEditStatus}
                  disabled={isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {memberStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                  setEditingMember(null);
                }}
                disabled={isEditing}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isEditing}>
                {isEditing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึก"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk import dialog */}
      <Dialog
        open={bulkOpen}
        onOpenChange={(open) => {
          setBulkOpen(open);
          if (!open) setBulkText("");
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>นำเข้าสมาชิก</DialogTitle>
            <DialogDescription>
              วางรายชื่อ IGN แต่ละบรรทัด
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Textarea
              rows={8}
              placeholder={"Player1\nPlayer2\nPlayer3"}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              disabled={isBulking}
            />
            <p className="text-xs text-text-muted">
              ตรวจพบ{" "}
              <span className="text-text-primary font-semibold">
                {bulkCount}
              </span>{" "}
              รายชื่อ
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBulkOpen(false);
                setBulkText("");
              }}
              disabled={isBulking}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleBulk}
              disabled={isBulking || bulkCount === 0}
            >
              {isBulking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังนำเข้า...
                </>
              ) : (
                `นำเข้า ${bulkCount} สมาชิก`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
