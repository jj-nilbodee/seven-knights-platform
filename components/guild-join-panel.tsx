"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Shield, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestAccess } from "@/actions/access";

type ExistingRequest = {
  guildId: string;
  status: string | null;
  requestedAt: Date | null;
};

type Guild = {
  id: string;
  name: string;
};

const statusConfig: Record<string, { label: string; icon: typeof Clock; classes: string }> = {
  pending: {
    label: "รอดำเนินการ",
    icon: Clock,
    classes: "bg-gold/20 text-gold border-gold/30",
  },
  rejected: {
    label: "ถูกปฏิเสธ",
    icon: XCircle,
    classes: "bg-accent/20 text-accent border-accent/30",
  },
};

export function GuildJoinPanel({
  guilds,
  existingRequests,
}: {
  guilds: Guild[];
  existingRequests: ExistingRequest[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const requestMap = new Map(
    existingRequests.map((r) => [r.guildId, r]),
  );

  function handleRequest(guildId: string) {
    startTransition(async () => {
      const result = await requestAccess(guildId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("ส่งคำขอเข้าร่วมกิลด์สำเร็จ");
        router.refresh();
      }
    });
  }

  if (guilds.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-8 text-center">
        <Shield className="h-10 w-10 text-text-muted mx-auto mb-3" />
        <p className="text-text-muted text-sm">ยังไม่มีกิลด์ในระบบ</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          เลือกกิลด์
        </h2>
        <p className="text-xs text-text-muted mt-1">
          กดขอเข้าร่วมเพื่อรอการอนุมัติจากเจ้าหน้าที่กิลด์
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {guilds.map((guild) => {
          const existing = requestMap.get(guild.id);
          const cfg = existing?.status ? statusConfig[existing.status] : null;
          const StatusIcon = cfg?.icon;

          return (
            <div
              key={guild.id}
              className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-bg-elevated border border-border-dim">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-display text-base font-semibold text-text-primary">
                  {guild.name}
                </h3>
              </div>

              {cfg && StatusIcon ? (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium border w-fit ${cfg.classes}`}
                >
                  <StatusIcon className="h-3.5 w-3.5" />
                  {cfg.label}
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleRequest(guild.id)}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : null}
                  ขอเข้าร่วม
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
