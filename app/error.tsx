"use client";

import { AlertTriangle } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-void">
      <AlertTriangle className="h-10 w-10 text-accent" />
      <h2 className="text-lg font-medium text-text-primary">
        เกิดข้อผิดพลาด
      </h2>
      <p className="text-sm text-text-secondary max-w-md text-center">
        {error.message || "ไม่สามารถโหลดหน้านี้ได้"}
      </p>
      <button
        onClick={reset}
        className="rounded-[var(--radius-md)] border border-border-dim px-4 py-2 text-sm text-text-primary hover:bg-bg-elevated transition-colors"
      >
        ลองใหม่
      </button>
    </div>
  );
}
