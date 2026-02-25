export default function AuthLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-7 w-48 rounded bg-bg-elevated" />
        <div className="h-4 w-32 rounded bg-bg-elevated mt-2" />
      </div>

      {/* KPI row skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5"
          >
            <div className="h-3 w-20 rounded bg-bg-elevated" />
            <div className="h-8 w-24 rounded bg-bg-elevated mt-3" />
            <div className="h-3 w-28 rounded bg-bg-elevated mt-2" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5"
          >
            <div className="h-4 w-32 rounded bg-bg-elevated mb-4" />
            <div className="h-[200px] rounded bg-bg-elevated" />
          </div>
        ))}
      </div>
    </div>
  );
}
