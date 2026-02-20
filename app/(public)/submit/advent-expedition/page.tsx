import { getPublicMembers } from "@/lib/db/queries/advent";
import { AdventSubmitForm } from "./advent-submit-form";

export default async function PublicAdventSubmitPage() {
  const guildId = process.env.NEXT_PUBLIC_DEFAULT_GUILD_ID ?? "";
  const members = guildId ? await getPublicMembers(guildId) : [];

  return <AdventSubmitForm members={members} guildId={guildId} />;
}
