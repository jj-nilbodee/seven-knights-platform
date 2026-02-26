import { requireUser } from "@/lib/auth";
import { Castle } from "lucide-react";

export default async function CastleRushPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Castle Rush
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          คะแนนและประวัติ Castle Rush
        </p>
      </div>
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-12 text-center">
        <Castle className="h-12 w-12 text-text-muted mx-auto mb-4" />
        <p className="text-text-primary font-medium font-display text-lg">
          กำลังพัฒนา
        </p>
        <p className="text-sm text-text-muted mt-2">
          ฟีเจอร์นี้จะพร้อมใช้งานเร็วๆ นี้
        </p>
      </div>
    </div>
  );
}
