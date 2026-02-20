import { z } from "zod";

export const formations = ["4-1", "3-2", "1-4", "2-3"] as const;
export const positions = ["front", "back"] as const;
export const battleResults = ["win", "loss"] as const;
export const battleTypes = ["attack", "defense"] as const;
export const guildWarDays = ["SAT", "MON", "WED"] as const;

export const teamCompositionSchema = z.object({
  heroes: z
    .array(
      z.object({
        heroId: z.string().uuid(),
        position: z.enum(positions).nullable(),
      }),
    )
    .max(5),
  formation: z.enum(formations).nullable(),
  skillSequence: z
    .array(
      z.object({
        heroId: z.string().uuid(),
        skillId: z.string().uuid(),
        order: z.number().int().min(1).max(3),
      }),
    )
    .max(3),
  speed: z.number().int().min(0).default(0),
});

// Validate that the date falls on SAT, MON, or WED
function isGuildWarDay(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  return day === 6 || day === 1 || day === 3; // SAT, MON, WED
}

function getWeekdayFromDate(dateStr: string): "SAT" | "MON" | "WED" {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay();
  if (day === 6) return "SAT";
  if (day === 1) return "MON";
  return "WED";
}

export { getWeekdayFromDate };

export const battleCreateSchema = z
  .object({
    guildId: z.string().uuid(),
    memberId: z.string().uuid("กรุณาเลือกสมาชิก"),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)")
      .refine(isGuildWarDay, "วันที่ต้องเป็นวัน เสาร์, จันทร์ หรือ พุธ เท่านั้น"),
    battleNumber: z.number().int().min(1, "ต้องระบุครั้งที่").max(3),
    battleType: z.enum(battleTypes).default("attack"),
    result: z.enum(battleResults, {
      message: "กรุณาเลือกผลการต่อสู้",
    }),
    enemyGuildName: z.string().default(""),
    enemyPlayerName: z.string().optional(),
    alliedTeam: teamCompositionSchema,
    enemyTeam: teamCompositionSchema,
    firstTurn: z.boolean().nullable().default(null),
    videoUrl: z.string().url().optional().or(z.literal("")),
    submittedByUserId: z.string().uuid(),
  })
  .transform((data) => ({
    ...data,
    weekday: getWeekdayFromDate(data.date),
  }));

export const battleUpdateSchema = z.object({
  memberId: z.string().uuid().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(isGuildWarDay, "วันที่ต้องเป็นวัน เสาร์, จันทร์ หรือ พุธ เท่านั้น")
    .optional(),
  battleNumber: z.number().int().min(1).max(3).optional(),
  battleType: z.enum(battleTypes).optional(),
  result: z.enum(battleResults).optional(),
  enemyGuildName: z.string().optional(),
  enemyPlayerName: z.string().optional(),
  alliedTeam: teamCompositionSchema.optional(),
  enemyTeam: teamCompositionSchema.optional(),
  firstTurn: z.boolean().nullable().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
});

export type TeamComposition = z.infer<typeof teamCompositionSchema>;
export type BattleCreate = z.output<typeof battleCreateSchema>;
export type BattleUpdate = z.infer<typeof battleUpdateSchema>;
