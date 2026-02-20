import { requireOfficer } from "@/lib/auth";
import { listMembers } from "@/lib/db/queries/members";
import { listHeroes } from "@/lib/db/queries/heroes";
import { BattleSubmitClient } from "./submit-client";

export default async function BattleSubmitPage() {
  const user = await requireOfficer();

  if (!user.guildId) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        คุณยังไม่ได้อยู่ในกิลด์
      </div>
    );
  }

  const [members, heroes] = await Promise.all([
    listMembers(user.guildId),
    listHeroes({ isActive: true }),
  ]);

  return <BattleSubmitClient members={members} heroes={heroes} />;
}
