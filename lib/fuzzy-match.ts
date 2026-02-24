export interface MatchResult {
  extractedName: string;
  memberId: string | null;
  memberIgn: string | null;
  confidence: "high" | "medium" | "none";
  score: number;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[m][n];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

export function fuzzyMatchMembers(
  extractedNames: string[],
  members: { id: string; ign: string }[],
): MatchResult[] {
  return extractedNames.map((name) => {
    const nameLower = name.toLowerCase().trim();

    let bestMember: { id: string; ign: string } | null = null;
    let bestScore = 0;

    for (const member of members) {
      const memberLower = member.ign.toLowerCase().trim();

      // Exact match
      if (nameLower === memberLower) {
        return {
          extractedName: name,
          memberId: member.id,
          memberIgn: member.ign,
          confidence: "high" as const,
          score: 1,
        };
      }

      // Substring match (one contains the other)
      if (nameLower.includes(memberLower) || memberLower.includes(nameLower)) {
        const score = Math.min(nameLower.length, memberLower.length) / Math.max(nameLower.length, memberLower.length);
        if (score > bestScore) {
          bestScore = Math.max(score, 0.7); // Boost substring matches
          bestMember = member;
        }
        continue;
      }

      const score = similarity(nameLower, memberLower);
      if (score > bestScore) {
        bestScore = score;
        bestMember = member;
      }
    }

    const confidence: "high" | "medium" | "none" =
      bestScore >= 0.7 ? "high" : bestScore >= 0.5 ? "medium" : "none";

    return {
      extractedName: name,
      memberId: confidence !== "none" ? bestMember!.id : null,
      memberIgn: confidence !== "none" ? bestMember!.ign : null,
      confidence,
      score: bestScore,
    };
  });
}
