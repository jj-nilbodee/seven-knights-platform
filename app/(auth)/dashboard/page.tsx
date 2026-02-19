import { requireUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          แดชบอร์ด
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          ยินดีต้อนรับ, {user.email}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "สงครามกิลด์", value: "—", sub: "รอข้อมูล" },
          { label: "สมาชิก", value: "—", sub: "รอข้อมูล" },
          { label: "คู่มือ GVG", value: "—", sub: "รอข้อมูล" },
          { label: "Castle Rush", value: "—", sub: "รอข้อมูล" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5"
          >
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
              {card.label}
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-text-primary">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-text-muted">{card.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
