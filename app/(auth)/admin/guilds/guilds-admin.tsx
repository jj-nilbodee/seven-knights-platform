"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  ChevronDown,
  ChevronRight,
  Trash2,
  UserPlus,
  UserMinus,
  CheckCircle,
  XCircle,
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
  username: string;
  addedAt: Date | null;
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

function GuildRow({ guild }: { guild: Guild }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  const [officerInput, setOfficerInput] = useState("");
  const [isAdding, startAdd] = useTransition();
  const [isRemoving, startRemove] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  async function handleExpand() {
    const next = !expanded;
    setExpanded(next);
    if (next) {
      setLoadingOfficers(true);
      try {
        const data = await fetchGuildOfficers(guild.id);
        setOfficers(data);
      } finally {
        setLoadingOfficers(false);
      }
    }
  }

  function handleAddOfficer() {
    if (!officerInput.trim()) return;
    startAdd(async () => {
      const result = await addOfficer(guild.id, officerInput.trim());
      if (result.error) {
        setToast({ message: result.error, type: "error" });
      } else {
        setToast({ message: "เพิ่มเจ้าหน้าที่สำเร็จ", type: "success" });
        setOfficerInput("");
        const data = await fetchGuildOfficers(guild.id);
        setOfficers(data);
        router.refresh();
      }
    });
  }

  function handleRemoveOfficer(userId: string) {
    startRemove(async () => {
      const result = await removeOfficer(guild.id, userId);
      if (result.error) {
        setToast({ message: result.error, type: "error" });
      } else {
        setOfficers((prev) => prev.filter((o) => o.userId !== userId));
        router.refresh();
      }
    });
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteGuild(guild.id);
      if (result.error) {
        setToast({ message: result.error, type: "error" });
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

            {/* Add officer */}
            <div className="flex gap-2">
              <Input
                placeholder="อีเมลของเจ้าหน้าที่"
                type="email"
                value={officerInput}
                onChange={(e) => setOfficerInput(e.target.value)}
                className="text-xs"
                disabled={isAdding}
              />
              <Button
                size="sm"
                onClick={handleAddOfficer}
                disabled={isAdding || !officerInput.trim()}
              >
                {isAdding ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserPlus className="h-3.5 w-3.5" />
                )}
              </Button>
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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </>
  );
}

export function GuildsAdmin({ initialGuilds }: { initialGuilds: Guild[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [guildName, setGuildName] = useState("");
  const [isCreating, startCreate] = useTransition();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!guildName.trim()) return;

    const fd = new FormData();
    fd.set("name", guildName.trim());

    startCreate(async () => {
      const result = await createGuild(fd);
      if (result.error) {
        setToast({ message: result.error, type: "error" });
      } else {
        setToast({ message: "สร้างกิลด์สำเร็จ!", type: "success" });
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
