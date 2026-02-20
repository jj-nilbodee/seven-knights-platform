"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  ChevronDown,
  ChevronRight,
  Trash2,
  UserPlus,
  UserMinus,
} from "lucide-react";
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
  createGuild,
  deleteGuild,
  addOfficer,
  removeOfficer,
  fetchGuildOfficers,
  fetchGuildMembers,
} from "@/actions/guilds";

type Guild = {
  id: string;
  name: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type Officer = {
  userId: string;
  email: string;
};

type Member = {
  userId: string;
  email: string;
};

function GuildRow({ guild }: { guild: Guild }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [isAdding, startAdd] = useTransition();
  const [isRemoving, startRemove] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function loadOfficersAndMembers() {
    setLoadingOfficers(true);
    try {
      const [officerData, memberData] = await Promise.all([
        fetchGuildOfficers(guild.id),
        fetchGuildMembers(guild.id),
      ]);
      setOfficers(officerData);
      setMembers(memberData);
    } finally {
      setLoadingOfficers(false);
    }
  }

  async function handleExpand() {
    const next = !expanded;
    setExpanded(next);
    if (next) {
      await loadOfficersAndMembers();
    }
  }

  function handleAddOfficer() {
    if (!selectedMemberId) return;
    startAdd(async () => {
      const result = await addOfficer(guild.id, selectedMemberId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("เลื่อนตำแหน่งเป็นเจ้าหน้าที่สำเร็จ");
        setSelectedMemberId("");
        await loadOfficersAndMembers();
        router.refresh();
      }
    });
  }

  function handleRemoveOfficer(userId: string) {
    startRemove(async () => {
      const result = await removeOfficer(guild.id, userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("ลดตำแหน่งเจ้าหน้าที่สำเร็จ");
        await loadOfficersAndMembers();
        router.refresh();
      }
    });
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteGuild(guild.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        setDeleteOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-surface overflow-hidden">
        {/* Guild header row */}
        <button
          onClick={handleExpand}
          className="flex items-center w-full gap-3 p-4 text-left hover:bg-bg-elevated transition-colors cursor-pointer"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-text-muted shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {guild.name}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {guild.id.slice(0, 8)}... &middot;{" "}
              {guild.createdAt
                ? new Date(guild.createdAt).toLocaleDateString("th-TH")
                : ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteOpen(true);
            }}
            className="text-text-muted hover:text-accent hover:bg-accent/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </button>

        {/* Expanded officer panel */}
        {expanded && (
          <div className="border-t border-border-dim p-4 bg-bg-card space-y-3">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              เจ้าหน้าที่
            </h4>

            {loadingOfficers ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
              </div>
            ) : officers.length > 0 ? (
              <div className="space-y-2">
                {officers.map((officer) => (
                  <div
                    key={officer.userId}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-bg-surface border border-border-dim"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary truncate">
                        {officer.email}
                      </p>
                      <p className="text-xs text-text-muted">
                        {officer.userId.slice(0, 8)}...
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOfficer(officer.userId)}
                      disabled={isRemoving}
                      className="text-text-muted hover:text-accent hover:bg-accent/10 shrink-0"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic py-2">
                ยังไม่มีเจ้าหน้าที่
              </p>
            )}

            {/* Promote member to officer */}
            <div className="flex gap-2">
              {members.length > 0 ? (
                <>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    disabled={isAdding}
                    className="flex-1 h-9 rounded-[var(--radius-sm)] border border-border-dim bg-bg-input px-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                  >
                    <option value="">เลือกสมาชิกเพื่อเลื่อนตำแหน่ง...</option>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.email}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    onClick={handleAddOfficer}
                    disabled={isAdding || !selectedMemberId}
                  >
                    {isAdding ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </>
              ) : !loadingOfficers ? (
                <p className="text-xs text-text-muted italic py-2">
                  ไม่มีสมาชิกที่สามารถเลื่อนตำแหน่งได้
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ลบกิลด์</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-semibold text-text-primary">
                {guild.name}
              </span>
              ? สมาชิกและข้อมูลทั้งหมดจะถูกลบ
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              ยกเลิก
            </Button>
            <Button
              className="bg-accent hover:bg-accent-bright"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                "ลบกิลด์"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}

export function GuildsAdmin({ initialGuilds }: { initialGuilds: Guild[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [guildName, setGuildName] = useState("");
  const [isCreating, startCreate] = useTransition();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!guildName.trim()) return;

    const fd = new FormData();
    fd.set("name", guildName.trim());

    startCreate(async () => {
      const result = await createGuild(fd);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("สร้างกิลด์สำเร็จ!");
        setCreateOpen(false);
        setGuildName("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            จัดการกิลด์
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            สร้าง แก้ไข และจัดการเจ้าหน้าที่กิลด์
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          สร้างกิลด์
        </Button>
      </div>

      {/* Guild list */}
      <div className="space-y-3">
        {initialGuilds.length > 0 ? (
          initialGuilds.map((guild) => (
            <GuildRow key={guild.id} guild={guild} />
          ))
        ) : (
          <div className="flex items-center justify-center h-40 text-text-muted bg-bg-input/30 rounded-[var(--radius-md)] border border-border-dim border-dashed">
            ยังไม่มีกิลด์ — คลิก &ldquo;สร้างกิลด์&rdquo; เพื่อเริ่มต้น
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setGuildName("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างกิลด์ใหม่</DialogTitle>
            <DialogDescription>
              ตั้งชื่อกิลด์ แล้วเพิ่มเจ้าหน้าที่ภายหลัง
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="py-4">
              <label className="text-sm font-medium text-text-primary">
                ชื่อกิลด์ *
              </label>
              <Input
                placeholder="เช่น SevenKnights TH"
                value={guildName}
                onChange={(e) => setGuildName(e.target.value)}
                disabled={isCreating}
                className="mt-1.5"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  setGuildName("");
                }}
                disabled={isCreating}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isCreating || !guildName.trim()}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    กำลังสร้าง...
                  </>
                ) : (
                  "สร้างกิลด์"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
