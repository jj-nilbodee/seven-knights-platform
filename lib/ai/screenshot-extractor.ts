import { getGenerativeModel } from "./vertex-client";

export interface AdventScoreResult {
  score: number; // extracted damage, -1 if unreadable
  confidence: number; // 0.0 - 1.0
  rawText: string | null;
}

const ADVENT_PROMPT = `You are analyzing a screenshot from the game "Seven Knights: Rebirth" showing an Advent Expedition boss result.

Extract the score/damage number displayed in the image. The score is typically a large number showing damage dealt to the boss.

Return a JSON object with these exact fields:
- "score": The numeric score as an integer (remove commas, convert to number). If you cannot read it clearly, return -1.
- "confidence": Your confidence in the extraction from 0.0 to 1.0 (e.g., 0.95 for very clear, 0.5 for unclear).
- "rawText": The raw text you see in the score area as a string (optional, can be null).

Look for:
- Large numbers (could be millions with commas like 5,234,567)
- Damage numbers or score displays
- Numbers near "Damage" or "Score" labels

Example response:
{"score": 5234567, "confidence": 0.95, "rawText": "5,234,567"}

Return ONLY valid JSON, no other text or explanation.`;

export async function extractAdventScore(
  imageBytes: Buffer,
  mimeType: string,
): Promise<AdventScoreResult> {
  const model = getGenerativeModel();

  const imagePart = {
    inlineData: {
      data: imageBytes.toString("base64"),
      mimeType,
    },
  };

  const response = await model.generateContent({
    contents: [{ role: "user", parts: [imagePart, { text: ADVENT_PROMPT }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 256,
    },
  });

  const text =
    response.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

  try {
    const parsed = JSON.parse(text);
    return {
      score: typeof parsed.score === "number" ? parsed.score : -1,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
      rawText: parsed.rawText ?? parsed.raw_text ?? null,
    };
  } catch {
    return { score: -1, confidence: 0, rawText: text || null };
  }
}
