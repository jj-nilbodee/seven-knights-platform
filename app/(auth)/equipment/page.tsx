import { requireGuild, NO_GUILD_MESSAGE } from "@/lib/auth";
import { listMembersCached } from "@/lib/db/queries/members";
import { createAdminClient } from "@/lib/supabase/admin";
import { EquipmentSummaryClient } from "./equipment-summary-client";

export interface MemberEquipment {
  memberId: string;
  ign: string;
  images: {
    name: string;
    url: string;
    createdAt: string;
  }[];
}

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ guildId?: string }>;
}) {
  const result = await requireGuild(await searchParams);
  if (!result) {
    return (
      <div className="flex items-center justify-center h-60 text-text-muted">
        {NO_GUILD_MESSAGE}
      </div>
    );
  }
  const { guildId } = result;

  const members = await listMembersCached(guildId);
  const supabase = createAdminClient();

  const memberEquipment: MemberEquipment[] = await Promise.all(
    members.map(async (member) => {
      const { data: files } = await supabase.storage
        .from("hero-images")
        .list(`equipment/${member.ign}/`, {
          sortBy: { column: "created_at", order: "desc" },
        });

      const images = (files ?? [])
        .filter((f) => !f.name.startsWith("."))
        .map((f) => {
          const { data: urlData } = supabase.storage
            .from("hero-images")
            .getPublicUrl(`equipment/${member.ign}/${f.name}`);
          return {
            name: f.name,
            url: urlData.publicUrl,
            createdAt: f.created_at,
          };
        });

      return {
        memberId: member.id,
        ign: member.ign,
        images,
      };
    }),
  );

  // Sort: members with submissions first, then alphabetically
  memberEquipment.sort((a, b) => {
    if (a.images.length > 0 && b.images.length === 0) return -1;
    if (a.images.length === 0 && b.images.length > 0) return 1;
    return a.ign.localeCompare(b.ign);
  });

  const submittedCount = memberEquipment.filter((m) => m.images.length > 0).length;

  return (
    <EquipmentSummaryClient
      members={memberEquipment}
      submittedCount={submittedCount}
      totalCount={memberEquipment.length}
    />
  );
}
