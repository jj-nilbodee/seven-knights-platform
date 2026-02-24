import { requireGuild, NO_GUILD_MESSAGE } from "@/lib/auth";
import { getBattleById, getHeroCooccurrence, getSkillSequenceHistory } from "@/lib/db/queries/battles";
import { listMembers } from "@/lib/db/queries/members";
import { listHeroes } from "@/lib/db/queries/heroes";
import { redirect } from "next/navigation";
import { BattleSubmitClient } from "../submit/submit-client";

export default async function BattleEditPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; guildId?: string }>;
}) {
  const params = await searchParams;
  const battleId = params.id;
  if (!battleId) redirect("/guild-war");

  const result = await requireGuild(params);
  if (!result) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        {NO_GUILD_MESSAGE}
      </div>
    );
  }
  const { user, guildId } = result;

  const battle = await getBattleById(battleId);
  if (!battle) redirect("/guild-war");
  if (user.role !== "admin" && battle.guildId !== guildId) redirect("/guild-war");

  const [members, heroes, heroCooccurrence, skillSequenceHistory] = await Promise.all([
    listMembers(guildId),
    listHeroes({ isActive: true }),
    getHeroCooccurrence(guildId),
    getSkillSequenceHistory(guildId),
  ]);

  return (
    <BattleSubmitClient
      members={members}
      heroes={heroes}
      guildId={guildId}
      heroCooccurrence={heroCooccurrence}
      skillSequenceHistory={skillSequenceHistory}
      initialBattle={{
        id: battle.id,
        memberId: battle.memberId,
        date: battle.date,
        battleNumber: battle.battleNumber,
        battleType: battle.battleType,
        result: battle.result,
        enemyGuildName: battle.enemyGuildName,
        enemyPlayerName: battle.enemyPlayerName,
        alliedTeam: battle.alliedTeam,
        enemyTeam: battle.enemyTeam,
        firstTurn: battle.firstTurn,
      }}
    />
  );
}
