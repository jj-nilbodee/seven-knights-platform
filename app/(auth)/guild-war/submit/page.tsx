import { requireOfficer, resolveGuildId } from "@/lib/auth";
import { listMembers } from "@/lib/db/queries/members";
import { listHeroes } from "@/lib/db/queries/heroes";
import { BattleSubmitClient } from "./submit-client";

export default async function BattleSubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ guildId?: string }>;
}) {
  const user = await requireOfficer();
  const params = await searchParams;
  const guildId = resolveGuildId(user, params);

  if (!guildId) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        คุณยังไม่ได้อยู่ในกิลด์
      </div>
    );
  }

  const [members, heroes] = await Promise.all([
    listMembers(guildId),
    listHeroes({ isActive: true }),
  ]);

  return <BattleSubmitClient members={members} heroes={heroes} guildId={guildId} />;
}
