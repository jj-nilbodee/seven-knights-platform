import { requireGuild, NO_GUILD_MESSAGE } from "@/lib/auth";
import { listMembersCached } from "@/lib/db/queries/members";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  TEAM_SCENARIOS,
  ALL_CRITERIA,
  TOTAL_CRITERIA,
} from "@/app/(public)/submit/equipment/team-scenarios";
import { EquipmentSummaryClient } from "./equipment-summary-client";

export interface CriterionImage {
  criterionId: string;
  url: string;
  createdAt: string;
}

export interface MemberEquipment {
  memberId: string;
  ign: string;
  imagesByCriterion: Record<string, CriterionImage>;
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

  // Build a set of valid criterion IDs for fast lookup
  const validCriterionIds = new Set(ALL_CRITERIA.map((c) => c.id));

  const memberEquipment: MemberEquipment[] = await Promise.all(
    members.map(async (member) => {
      // Check both old IGN-based path and new UUID-based path
      const [{ data: ignFiles }, { data: idFiles }] = await Promise.all([
        supabase.storage
          .from("hero-images")
          .list(`equipment/${member.ign}/`, {
            sortBy: { column: "created_at", order: "desc" },
          }),
        supabase.storage
          .from("hero-images")
          .list(`equipment/${member.id}/`, {
            sortBy: { column: "created_at", order: "desc" },
          }),
      ]);

      const imagesByCriterion: Record<string, CriterionImage> = {};

      // Process files from both paths (UUID path first = newer, takes priority)
      const fileSources: { folder: string; files: typeof ignFiles }[] = [
        { folder: `equipment/${member.id}`, files: idFiles },
        { folder: `equipment/${member.ign}`, files: ignFiles },
      ];

      for (const { folder, files } of fileSources) {
        for (const f of files ?? []) {
          if (f.name.startsWith(".")) continue;

          const matchedCriterion = ALL_CRITERIA.find((c) =>
            f.name.startsWith(c.id + "-"),
          );

          const criterionId = matchedCriterion?.id ?? "unknown";

          // Keep first match (UUID path checked first = newer takes priority)
          if (!imagesByCriterion[criterionId]) {
            const { data: urlData } = supabase.storage
              .from("hero-images")
              .getPublicUrl(`${folder}/${f.name}`);

            imagesByCriterion[criterionId] = {
              criterionId,
              url: urlData.publicUrl,
              createdAt: f.created_at,
            };
          }
        }
      }

      return {
        memberId: member.id,
        ign: member.ign,
        imagesByCriterion,
      };
    }),
  );

  // Sort: members with more submissions first, then alphabetically
  memberEquipment.sort((a, b) => {
    const aCount = Object.keys(a.imagesByCriterion).length;
    const bCount = Object.keys(b.imagesByCriterion).length;
    if (aCount > 0 && bCount === 0) return -1;
    if (aCount === 0 && bCount > 0) return 1;
    return a.ign.localeCompare(b.ign);
  });

  const submittedCount = memberEquipment.filter(
    (m) => Object.keys(m.imagesByCriterion).length > 0,
  ).length;

  return (
    <EquipmentSummaryClient
      members={memberEquipment}
      submittedCount={submittedCount}
      totalCount={memberEquipment.length}
      totalCriteria={TOTAL_CRITERIA}
    />
  );
}
