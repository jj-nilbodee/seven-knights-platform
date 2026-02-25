export default function GvgGuidesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 rounded bg-bg-elevated" />
      <div className="h-10 w-full rounded bg-bg-elevated" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5"
          >
            <div className="h-4 w-24 rounded bg-bg-elevated mb-3" />
            <div className="h-5 w-full rounded bg-bg-elevated mb-2" />
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-10 w-10 rounded-lg bg-bg-elevated" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
