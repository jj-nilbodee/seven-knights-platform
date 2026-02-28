export default function QuickSubmitLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-md bg-bg-elevated" />
        <div className="flex-1">
          <div className="h-7 w-32 rounded bg-bg-elevated" />
          <div className="h-4 w-64 rounded bg-bg-elevated mt-2" />
        </div>
      </div>

      {/* Date + Enemy guild */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="h-4 w-12 rounded bg-bg-elevated" />
          <div className="h-10 w-full rounded-md bg-bg-elevated" />
        </div>
        <div className="space-y-1.5">
          <div className="h-4 w-20 rounded bg-bg-elevated" />
          <div className="h-10 w-full rounded-md bg-bg-elevated" />
        </div>
      </div>

      {/* Upload area */}
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5 space-y-4">
        <div className="h-4 w-36 rounded bg-bg-elevated" />
        <div className="border-2 border-dashed border-border-default rounded-[var(--radius-md)] p-8 flex flex-col items-center">
          <div className="h-8 w-8 rounded bg-bg-elevated mb-2" />
          <div className="h-4 w-48 rounded bg-bg-elevated" />
          <div className="h-3 w-36 rounded bg-bg-elevated mt-2" />
        </div>
      </div>

      {/* Review table */}
      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border-dim">
          <div className="h-5 w-28 rounded bg-bg-elevated" />
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="h-4 w-64 rounded bg-bg-elevated" />
        </div>
      </div>
    </div>
  );
}
