"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Clock,
  UserCheck,
  UserX,
  Users,
  Check,
  X,
  ShieldOff,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
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
import {
  approveAccessRequest,
  rejectAccessRequest,
  revokeAccess,
} from "@/actions/access";

type AccessRequest = {
  id: string;
  userId: string;
  guildId: string;
  status: string | null;
  requestedAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  email: string;
  username: string;
};

type Stats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

const statusConfig: Record<
  string,
  { label: string; classes: string }
> = {
  pending: {
    label: "รอดำเนินการ",
    classes:
      "bg-gold/20 text-gold border-gold/30",
  },
  approved: {
    label: "อนุมัติแล้ว",
    classes:
      "bg-green/20 text-green border-green/30",
  },
  rejected: {
    label: "ปฏิเสธ",
    classes:
      "bg-accent/20 text-accent border-accent/30",
  },
};

export function AccessRequestsClient({
  initialRequests,
  stats,
}: {
  initialRequests: AccessRequest[];
  stats: Stats;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [confirmAction, setConfirmAction] = useState<{
    type: "reject" | "revoke";
    request: AccessRequest;
  } | null>(null);
  const [isApproving, startApprove] = useTransition();
  const [isRejecting, startReject] = useTransition();
  const [isRevoking, startRevoke] = useTransition();

  const filtered =
    filter === "all"
      ? initialRequests
      : initialRequests.filter((r) => r.status === filter);

  function handleApprove(request: AccessRequest) {
    startApprove(async () => {
      const result = await approveAccessRequest(request.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`อนุมัติ ${request.email} สำเร็จ`);
        router.refresh();
      }
    });
  }

  function handleReject() {
    if (!confirmAction || confirmAction.type !== "reject") return;
    startReject(async () => {
      const result = await rejectAccessRequest(confirmAction.request.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("ปฏิเสธคำขอสำเร็จ");
        setConfirmAction(null);
        router.refresh();
      }
    });
  }

  function handleRevoke() {
    if (!confirmAction || confirmAction.type !== "revoke") return;
    startRevoke(async () => {
      const result = await revokeAccess(confirmAction.request.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("เพิกถอนสิทธิ์สำเร็จ");
        setConfirmAction(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          คำขอเข้าถึง
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          จัดการคำขอเข้าถึงกิลด์
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "รอดำเนินการ", value: stats.pending, icon: Clock, color: "text-gold" },
          { label: "อนุมัติ", value: stats.approved, icon: UserCheck, color: "text-green" },
          { label: "ปฏิเสธ", value: stats.rejected, icon: UserX, color: "text-accent" },
          { label: "ทั้งหมด", value: stats.total, icon: Users, color: "text-cyan" },
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

      {/* Request list */}
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border-dim">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            รายการคำขอ
          </h2>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="pending">รอดำเนินการ</SelectItem>
              <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
              <SelectItem value="rejected">ปฏิเสธ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length > 0 ? (
          <div className="divide-y divide-border-dim">
            {filtered.map((request) => {
              const cfg = statusConfig[request.status ?? "pending"];
              return (
                <div
                  key={request.id}
                  className="flex items-center gap-4 p-4 hover:bg-bg-elevated transition-colors"
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-elevated border border-border-dim text-text-primary font-semibold text-sm shrink-0">
                    {request.email[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {request.email}
                    </p>
                    <p className="text-xs text-text-muted">
                      {request.requestedAt
                        ? `ขอเมื่อ ${formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true, locale: th })}`
                        : ""}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-xs font-medium border ${cfg.classes}`}
                  >
                    {cfg.label}
                  </span>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    {request.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request)}
                          disabled={isApproving}
                          className="bg-green hover:bg-green/80 text-bg-void"
                        >
                          {isApproving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setConfirmAction({
                              type: "reject",
                              request,
                            })
                          }
                          className="text-accent border-accent/30 hover:bg-accent/10"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    {request.status === "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setConfirmAction({ type: "revoke", request })
                        }
                        className="text-accent border-accent/30 hover:bg-accent/10"
                      >
                        <ShieldOff className="h-3.5 w-3.5 mr-1" />
                        เพิกถอน
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-text-muted">
            ไม่มีคำขอ
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "reject" ? "ปฏิเสธคำขอ" : "เพิกถอนสิทธิ์"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "reject"
                ? `คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธคำขอของ ${confirmAction?.request.email}?`
                : `คุณแน่ใจหรือไม่ว่าต้องการเพิกถอนสิทธิ์ของ ${confirmAction?.request.email}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={isRejecting || isRevoking}
            >
              ยกเลิก
            </Button>
            <Button
              className="bg-accent hover:bg-accent-bright"
              onClick={
                confirmAction?.type === "reject"
                  ? handleReject
                  : handleRevoke
              }
              disabled={isRejecting || isRevoking}
            >
              {isRejecting || isRevoking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : confirmAction?.type === "reject" ? (
                "ปฏิเสธ"
              ) : (
                "เพิกถอน"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
