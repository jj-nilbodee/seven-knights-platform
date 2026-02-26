import { NextResponse } from "next/server";
import { requireOfficer } from "@/lib/auth";
import { extractBattleResults } from "@/lib/ai/extract-battle-results";
import { z } from "zod";

const requestSchema = z.object({
  images: z
    .array(
      z.object({
        base64: z.string().min(1),
        mimeType: z.string().regex(/^image\/(png|jpeg|webp|gif)$/),
      }),
    )
    .min(1)
    .max(6),
});

export async function POST(request: Request) {
  try {
    await requireOfficer();

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const result = await extractBattleResults(parsed.data.images);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Extract battle results error:", message, err);
    return NextResponse.json(
      { error: `ไม่สามารถวิเคราะห์ภาพได้: ${message}` },
      { status: 500 },
    );
  }
}
