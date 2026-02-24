import { getGenerativeModel } from "@/lib/ai/vertex-client";

export interface MemberSummary {
  memberName: string;
  wins: number;
  losses: number;
}

export interface IndividualBattle {
  memberName: string;
  result: "win" | "loss";
  enemyPlayerName: string;
  battleType: "attack" | "defense";
  enemyCastleType: "main" | "inner" | "outer" | null;
  enemyCastleNumber: number | null;
}

export interface ExtractionResult {
  memberSummaries: MemberSummary[];
  individualBattles: IndividualBattle[];
}

const EXTRACTION_PROMPT = `You are analyzing screenshots from the guild war feature of the mobile game "Seven Knights Re:Birth" (เซเว่นไนท์ รีเบิร์ธ). Extract battle data from ALL provided images.

There are two types of screenshots:

## Type 1: "ข้อมูลอันดับ" (Ranking Summary)
Shows a list of guild members with their total wins/losses displayed as "ชนะ X แพ้ Y".
Extract: memberName, wins (X), losses (Y) for each member.

## Type 2: "สถิติการต่อสู้" (Battle Stats)
Shows individual battle rows with: allied member name, WIN or LOSE result, enemy player name.
The active tab indicates battle type:
- "สถิติการโจมตี" tab = attack battles
- "สถิติการป้องกัน" tab = defense battles

Castle type can be identified from the text:
- "ปราสาทหลัก" = "main"
- "ปราสาทด้านใน" = "inner"
- "ปราสาทรอบนอก" = "outer"

Castle number is typically 1-5.

## Important Notes
- Player names may mix Thai and English characters (e.g., "YEsMaeเดอจ")
- Multiple screenshots may show scrolled views of the same list — deduplicate by player name
- Each member can have a maximum of 5 battles
- Extract ALL visible data from ALL images

## Output Format
Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "memberSummaries": [
    { "memberName": "PlayerName", "wins": 3, "losses": 2 }
  ],
  "individualBattles": [
    {
      "memberName": "PlayerName",
      "result": "win",
      "enemyPlayerName": "EnemyName",
      "battleType": "attack",
      "enemyCastleType": "main",
      "enemyCastleNumber": 1
    }
  ]
}

If a screenshot type is not present, return an empty array for that field.
If castle type or number cannot be determined, use null.`;

export async function extractBattleResults(
  images: { base64: string; mimeType: string }[],
): Promise<ExtractionResult> {
  const model = getGenerativeModel();

  const imageParts = images.map((img) => ({
    inlineData: {
      data: img.base64,
      mimeType: img.mimeType,
    },
  }));

  const response = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          ...imageParts,
          { text: EXTRACTION_PROMPT },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
    },
  });

  const text =
    response.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/m, "")
    .replace(/\n?```\s*$/m, "")
    .trim();

  const parsed = JSON.parse(cleaned) as ExtractionResult;

  // Validate and normalize
  return {
    memberSummaries: (parsed.memberSummaries ?? []).map((s) => ({
      memberName: String(s.memberName).trim(),
      wins: Math.max(0, Math.min(5, Number(s.wins) || 0)),
      losses: Math.max(0, Math.min(5, Number(s.losses) || 0)),
    })),
    individualBattles: (parsed.individualBattles ?? []).map((b) => ({
      memberName: String(b.memberName).trim(),
      result: b.result === "loss" ? "loss" : "win",
      enemyPlayerName: String(b.enemyPlayerName).trim(),
      battleType: b.battleType === "defense" ? "defense" : "attack",
      enemyCastleType:
        b.enemyCastleType === "main" ||
        b.enemyCastleType === "inner" ||
        b.enemyCastleType === "outer"
          ? b.enemyCastleType
          : null,
      enemyCastleNumber:
        typeof b.enemyCastleNumber === "number" &&
        b.enemyCastleNumber >= 1 &&
        b.enemyCastleNumber <= 5
          ? b.enemyCastleNumber
          : null,
    })),
  };
}
