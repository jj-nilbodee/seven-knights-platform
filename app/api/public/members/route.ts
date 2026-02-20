import { NextRequest, NextResponse } from "next/server";
import { getPublicMembers } from "@/lib/db/queries/advent";

export async function GET(request: NextRequest) {
  const guildId = request.nextUrl.searchParams.get("guildId");

  if (!guildId) {
    return NextResponse.json({ error: "guildId is required" }, { status: 400 });
  }

  try {
    const members = await getPublicMembers(guildId);
    return NextResponse.json({ members });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 },
    );
  }
}
