import { z } from "zod";

export const cycleStatuses = [
  "collecting",
  "planning",
  "active",
  "completed",
] as const;

export type CycleStatus = (typeof cycleStatuses)[number];

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const bossScoresSchema = z.object({
  teo: z.number().int().min(0).default(0),
  yeonhee: z.number().int().min(0).default(0),
  kyle: z.number().int().min(0).default(0),
  karma: z.number().int().min(0).default(0),
});

export const cycleCreateSchema = z
  .object({
    name: z.string().min(1, "กรุณากรอกชื่อรอบ"),
    startDate: z
      .string()
      .regex(dateRegex, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),
    endDate: z
      .string()
      .regex(dateRegex, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),
    targetDay: z.number().int().min(1).max(14).default(9),
    autoRegenerate: z.boolean().default(true),
  })
  .refine((d) => d.endDate > d.startDate, {
    message: "วันสิ้นสุดต้องมาหลังวันเริ่มต้น",
    path: ["endDate"],
  });

export const cycleUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(cycleStatuses).optional(),
  startDate: z.string().regex(dateRegex).optional(),
  endDate: z.string().regex(dateRegex).optional(),
  targetDay: z.number().int().min(1).max(14).optional(),
  autoRegenerate: z.boolean().optional(),
  actualDays: z.number().int().min(1).optional(),
});

export const profileUpdateSchema = z.object({
  scores: bossScoresSchema,
});

export const publicSubmissionSchema = z.object({
  guildId: z.string().uuid(),
  memberIgn: z.string().min(1, "กรุณาเลือกสมาชิก"),
  boss: z.enum(["teo", "yeonhee", "kyle", "karma"], {
    message: "กรุณาเลือกบอส",
  }),
  score: z.number().int().min(0, "คะแนนต้องมากกว่า 0"),
  cycleId: z.string().uuid().optional(),
});

export type CycleCreate = z.infer<typeof cycleCreateSchema>;
export type CycleUpdate = z.infer<typeof cycleUpdateSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type BossScores = z.infer<typeof bossScoresSchema>;
export type PublicSubmission = z.infer<typeof publicSubmissionSchema>;
