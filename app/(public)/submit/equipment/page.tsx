import { db } from "@/lib/db";
import { members, guilds } from "@/lib/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { EquipmentSubmitClient } from "./equipment-submit-client";

export const dynamic = "force-dynamic";

const GUILD_NAME = "egg4k";

export const metadata = {
  title: "ส่งรูปอุปกรณ์ — Seven Knights Re:Birth",
  description: "อัปโหลดรูปอุปกรณ์ของสมาชิกแต่ละคน",
};

export default async function EquipmentSubmitPage() {
  // Find the guild
  const [guild] = await db
    .select()
    .from(guilds)
    .where(eq(guilds.name, GUILD_NAME));

  if (!guild) {
    return (
      <div className="flex items-center justify-center h-screen text-text-muted">
        ไม่พบกิลด์ {GUILD_NAME}
      </div>
    );
  }

  // Get active members
  const memberList = await db
    .select({ id: members.id, ign: members.ign })
    .from(members)
    .where(and(eq(members.guildId, guild.id), eq(members.isActive, true)))
    .orderBy(asc(members.ign));

  return (
    <div className="min-h-screen bg-bg-void">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          ส่งรูปอุปกรณ์
        </h1>
        <p className="text-text-muted mb-6">
          เลือกชื่อ แล้วอัปโหลดรูปอุปกรณ์ตามแต่ละทีมบุก
        </p>
        <EquipmentSubmitClient members={memberList} />
      </div>
    </div>
  );
}
