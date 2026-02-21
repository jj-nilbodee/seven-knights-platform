import { Loader2 } from "lucide-react";

export default function GvgGuidesLoading() {
  return (
    <div className="flex items-center justify-center h-60">
      <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
    </div>
  );
}
