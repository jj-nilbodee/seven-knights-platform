import { requireOfficer } from "@/lib/auth";
import { listHeroes } from "@/lib/db/queries/heroes";
import { CounterClient } from "./counter-client";

export default async function CounterPage() {
  const user = await requireOfficer();

  if (!user.guildId) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        คุณยังไม่ได้อยู่ในกิลด์
      </div>
    );
  }

  const heroList = await listHeroes({ isActive: true });
  const heroes = heroList.map((h) => ({
    id: h.id,
    name: h.name,
    imageUrl: h.imageUrl,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-text-primary">เคาน์เตอร์</h2>
        <p className="text-xs text-text-muted mt-1">
          เลือกฮีโร่ศัตรูเพื่อค้นหาทีมเคาน์เตอร์จากประวัติการต่อสู้
        </p>
      </div>

      <div className="rounded-[var(--radius-md)] border border-border-dim bg-bg-card p-5">
        <CounterClient heroes={heroes} />
      </div>
    </div>
  );
}
