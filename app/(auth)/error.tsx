"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-60 gap-4">
      <AlertTriangle className="h-8 w-8 text-accent" />
      <p className="text-sm text-text-secondary">
        เกิดข้อผิดพลาด: {error.message || "ไม่ทราบสาเหตุ"}
      </p>
      <Button variant="outline" size="sm" onClick={reset}>
        ลองใหม่
      </Button>
    </div>
  );
}
