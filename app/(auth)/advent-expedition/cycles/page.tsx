import { requireUser, resolveGuildId } from "@/lib/auth";
import { listCycles } from "@/lib/db/queries/advent";
import { CyclesClient } from "./cycles-client";

export default async function AdventCyclesPage({
  searchParams,
}: {
  searchParams: Promise<{ guildId?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const guildId = resolveGuildId(user, params);

  if (!guildId) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        คุณยังไม่ได้อยู่ในกิลด์
      </div>
    );
  }

  const cycles = await listCycles(guildId, 50);

  return <CyclesClient cycles={cycles} userRole={user.role} guildId={guildId} />;
}
