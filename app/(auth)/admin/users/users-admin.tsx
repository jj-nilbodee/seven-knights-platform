"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, UserMinus, Crown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  assignUserToGuild,
  removeUserFromGuild,
  promoteToAdmin,
} from "@/actions/guilds";

type User = {
  userId: string;
  email: string;
  role: string;
  guildId: string | null;
  createdAt: string | null;
};

type Guild = {
  id: string;
  name: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

const roleBadge: Record<string, { label: string; className: string }> = {
  admin: {
    label: "แอดมิน",
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  },
  officer: {
    label: "เจ้าหน้าที่",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  member: {
    label: "สมาชิก",
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  },
};

function RoleBadge({ role }: { role: string }) {
  const badge = roleBadge[role] ?? roleBadge.member;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

function UserActionRow({
  user,
  guilds,
  guildMap,
}: {
  user: User;
  guilds: Guild[];
  guildMap: Map<string, string>;
}) {
  const router = useRouter();
  const [isAssigning, startAssign] = useTransition();
  const [isRemoving, startRemove] = useTransition();
  const [isPromoting, startPromote] = useTransition();

  const busy = isAssigning || isRemoving || isPromoting;
  const isAdmin = user.role === "admin";

  function handleGuildChange(guildId: string) {
    if (!guildId) return;
    startAssign(async () => {
      const role = user.role === "officer" ? "officer" : "member";
      const result = await assignUserToGuild(
        user.userId,
        guildId,
        role as "member" | "officer",
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("กำหนดกิลด์สำเร็จ");
        router.refresh();
      }
    });
  }

  function handleRoleChange(newRole: string) {
    if (!newRole || newRole === user.role) return;

    if (newRole === "admin") {
      startPromote(async () => {
        const result = await promoteToAdmin(user.userId);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("เลื่อนเป็นแอดมินสำเร็จ");
          router.refresh();
        }
      });
      return;
    }

    if (!user.guildId) {
      toast.error("ต้องกำหนดกิลด์ก่อนเปลี่ยนตำแหน่ง");
      return;
    }

    startAssign(async () => {
      const result = await assignUserToGuild(
        user.userId,
        user.guildId!,
        newRole as "member" | "officer",
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("เปลี่ยนตำแหน่งสำเร็จ");
        router.refresh();
      }
    });
  }

  function handleRemoveFromGuild() {
    startRemove(async () => {
      const result = await removeUserFromGuild(user.userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("นำออกจากกิลด์สำเร็จ");
        router.refresh();
      }
    });
  }

  return (
    <tr className="border-b border-border-dim hover:bg-bg-elevated/50 transition-colors">
      <td className="px-4 py-3">
        <p className="text-sm text-text-primary truncate max-w-[200px]">
          {user.email}
        </p>
      </td>
      <td className="px-4 py-3">
        {isAdmin ? (
          <RoleBadge role={user.role} />
        ) : (
          <select
            value={user.role}
            onChange={(e) => handleRoleChange(e.target.value)}
            disabled={busy}
            className="h-7 rounded-[var(--radius-sm)] border border-border-dim bg-bg-input px-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          >
            <option value="member">สมาชิก</option>
            <option value="officer">เจ้าหน้าที่</option>
            <option value="admin">แอดมิน</option>
          </select>
        )}
      </td>
      <td className="px-4 py-3">
        {isAdmin ? (
          <span className="text-xs text-text-muted">—</span>
        ) : (
          <select
            value={user.guildId ?? ""}
            onChange={(e) => handleGuildChange(e.target.value)}
            disabled={busy}
            className="h-7 rounded-[var(--radius-sm)] border border-border-dim bg-bg-input px-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          >
            <option value="">ไม่มีกิลด์</option>
            {guilds.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-text-muted">
        {user.createdAt
          ? new Date(user.createdAt).toLocaleDateString("th-TH")
          : "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {!isAdmin && user.guildId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFromGuild}
              disabled={busy}
              title="นำออกจากกิลด์"
              className="text-text-muted hover:text-accent hover:bg-accent/10"
            >
              {isRemoving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserMinus className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          {!isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRoleChange("admin")}
              disabled={busy}
              title="เลื่อนเป็นแอดมิน"
              className="text-text-muted hover:text-yellow-400 hover:bg-yellow-500/10"
            >
              {isPromoting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Crown className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function UsersAdmin({
  users,
  guilds,
}: {
  users: User[];
  guilds: Guild[];
}) {
  const [search, setSearch] = useState("");

  const guildMap = new Map(guilds.map((g) => [g.id, g.name]));

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          (u.guildId && guildMap.get(u.guildId)?.toLowerCase().includes(search.toLowerCase())),
      )
    : users;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          จัดการผู้ใช้
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          ดูและจัดการผู้ใช้ทั้งหมดในระบบ — กำหนดกิลด์ เปลี่ยนตำแหน่ง
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input
          placeholder="ค้นหาอีเมลหรือชื่อกิลด์..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-dim bg-bg-card">
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  อีเมล
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  ตำแหน่ง
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  กิลด์
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  วันที่สมัคร
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((user) => (
                  <UserActionRow
                    key={user.userId}
                    user={user}
                    guilds={guilds}
                    guildMap={guildMap}
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-text-muted"
                  >
                    {search.trim()
                      ? "ไม่พบผู้ใช้ที่ตรงกับการค้นหา"
                      : "ยังไม่มีผู้ใช้ในระบบ"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-text-muted">
        ทั้งหมด {filtered.length} คน
        {search.trim() && filtered.length !== users.length
          ? ` (จาก ${users.length} คน)`
          : ""}
      </p>
    </div>
  );
}
