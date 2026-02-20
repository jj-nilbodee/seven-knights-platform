import { z } from "zod";

export const guideStatuses = ["draft", "published", "archived"] as const;

export const skillStepSchema = z.object({
  hero_id: z.string().uuid(),
  skill_number: z.union([z.literal(1), z.literal(2)]),
  note: z.string().optional().default(""),
});

export const guideCreateSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่อคู่มือ"),
  defenseHeroes: z
    .array(z.string().min(1))
    .length(3, "ต้องเลือกฮีโร่ป้องกัน 3 ตัว"),
  attackHeroes: z
    .array(z.string().min(1))
    .length(3, "ต้องเลือกฮีโร่โจมตี 3 ตัว"),
  attackPriority: z.number().int().min(1, "กรุณาระบุลำดับความสำคัญ"),
  attackSkillOrder: z
    .array(skillStepSchema)
    .min(1, "ต้องเพิ่มลำดับสกิลอย่างน้อย 1 ขั้นตอน"),
  defenseSkillOrder: z.array(skillStepSchema).nullable().default(null),
  strategyNotes: z.string().default(""),
  mediaUrls: z.array(z.string().url()).default([]),
  patchVersion: z.string().min(1, "กรุณาระบุเวอร์ชันแพตช์"),
  status: z.enum(guideStatuses).default("draft"),
});

export const guideUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  defenseHeroes: z.array(z.string().min(1)).length(3).optional(),
  attackHeroes: z.array(z.string().min(1)).length(3).optional(),
  attackPriority: z.number().int().min(1).optional(),
  attackSkillOrder: z.array(skillStepSchema).min(1).optional(),
  defenseSkillOrder: z.array(skillStepSchema).nullable().optional(),
  strategyNotes: z.string().optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  patchVersion: z.string().min(1).optional(),
  status: z.enum(guideStatuses).optional(),
});

export type SkillStep = z.infer<typeof skillStepSchema>;
export type GuideCreate = z.infer<typeof guideCreateSchema>;
export type GuideUpdate = z.infer<typeof guideUpdateSchema>;
export type GuideStatus = (typeof guideStatuses)[number];
