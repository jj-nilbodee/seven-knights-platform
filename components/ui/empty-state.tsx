import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  message,
  detail,
}: {
  icon: LucideIcon;
  message: string;
  detail?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-10 w-10 text-text-muted mb-3 opacity-50" />
      <p className="text-sm text-text-muted">{message}</p>
      {detail && (
        <p className="text-xs text-text-muted mt-1">{detail}</p>
      )}
    </div>
  );
}
