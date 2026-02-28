export default function SubmitLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 rounded-md bg-bg-elevated" />
        <div className="flex-1 space-y-2">
          <div className="h-7 w-48 rounded bg-bg-elevated" />
          <div className="h-4 w-64 rounded bg-bg-elevated" />
        </div>
      </div>

      {/* Row 1: Member + Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="h-4 w-16 rounded bg-bg-elevated" />
          <div className="h-9 rounded-md bg-bg-elevated" />
        </div>
        <div className="space-y-1.5">
          <div className="h-4 w-12 rounded bg-bg-elevated" />
          <div className="h-9 rounded-md bg-bg-elevated" />
        </div>
      </div>

      {/* Row 2: Result + First Turn + Speed + Type */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-4 w-14 rounded bg-bg-elevated" />
            <div className="h-9 rounded-md bg-bg-elevated" />
          </div>
        ))}
      </div>

      {/* Row 3: Enemy guild + player */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="h-4 w-20 rounded bg-bg-elevated" />
          <div className="h-9 rounded-md bg-bg-elevated" />
        </div>
        <div className="space-y-1.5">
          <div className="h-4 w-24 rounded bg-bg-elevated" />
          <div className="h-9 rounded-md bg-bg-elevated" />
        </div>
      </div>

      {/* Hero pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 rounded-[var(--radius-md)] bg-bg-elevated border border-border-dim h-32" />
        <div className="p-3 rounded-[var(--radius-md)] bg-bg-elevated border border-border-dim h-32" />
      </div>

      {/* Submit button */}
      <div className="h-10 w-full rounded-md bg-bg-elevated" />
    </div>
  );
}
