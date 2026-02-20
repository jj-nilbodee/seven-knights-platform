import { NextRequest, NextResponse } from "next/server";
import { extractAdventScore } from "@/lib/ai/screenshot-extractor";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "advent" | "castle-rush"

    if (!file) {
      return NextResponse.json(
        { error: "ไม่พบไฟล์รูปภาพ" },
        { status: 400 },
      );
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "รองรับเฉพาะไฟล์ PNG, JPEG, หรือ WebP" },
        { status: 400 },
      );
    }

    // 10MB max
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "ไฟล์ใหญ่เกินไป (สูงสุด 10MB)" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (type === "advent" || !type) {
      const result = await extractAdventScore(buffer, file.type);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "ประเภทการดึงข้อมูลไม่ถูกต้อง" },
      { status: 400 },
    );
  } catch (err) {
    console.error("Screenshot extraction failed:", err);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลจากรูปภาพได้" },
      { status: 500 },
    );
  }
}
