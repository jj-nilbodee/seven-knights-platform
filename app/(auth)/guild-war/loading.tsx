export default function GuildWarLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="h-7 w-36 rounded bg-bg-elevated" />
          <div className="h-4 w-52 rounded bg-bg-elevated mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 rounded-md bg-bg-elevated" />
          <div className="h-10 w-32 rounded-md bg-bg-elevated" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-md border border-border-dim bg-bg-card p-4"
          >
            <div className="h-3 w-12 rounded bg-bg-elevated" />
            <div className="h-7 w-16 rounded bg-bg-elevated mt-2" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="h-9 w-40 rounded-md bg-bg-elevated" />
        <div className="h-9 w-44 rounded-md bg-bg-elevated" />
        <div className="h-9 w-36 rounded-md bg-bg-elevated" />
      </div>

      {/* Table */}
      <div className="rounded-md border border-border-dim bg-bg-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border-dim">
          <div className="h-5 w-32 rounded bg-bg-elevated" />
          <div className="h-4 w-16 rounded bg-bg-elevated" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 border-b border-border-dim"
          >
            <div className="h-4 w-24 rounded bg-bg-elevated" />
            <div className="h-4 w-20 rounded bg-bg-elevated" />
            <div className="h-4 w-28 rounded bg-bg-elevated" />
            <div className="h-5 w-12 rounded-full bg-bg-elevated ml-auto" />
            <div className="h-4 w-14 rounded bg-bg-elevated" />
          </div>
        ))}
      </div>
    </div>
  );
}
