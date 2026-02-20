import { requireUser } from "@/lib/auth";
import { listCycles } from "@/lib/db/queries/advent";
import { CyclesClient } from "./cycles-client";

export default async function AdventCyclesPage() {
  const user = await requireUser();

  if (!user.guildId) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        คุณยังไม่ได้อยู่ในกิลด์
      </div>
    );
  }

  const cycles = await listCycles(user.guildId, 50);

  return <CyclesClient cycles={cycles} userRole={user.role} />;
}
