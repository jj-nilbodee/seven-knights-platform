export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-36 rounded bg-bg-elevated" />
        <div className="h-8 w-48 rounded bg-bg-elevated" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5"
          >
            <div className="h-4 w-32 rounded bg-bg-elevated mb-4" />
            <div className="h-[300px] rounded bg-bg-elevated" />
          </div>
        ))}
      </div>
    </div>
  );
}
