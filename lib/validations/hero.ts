import { z } from "zod";

export const heroTypes = [
  "MAGIC",
  "PHYSICAL",
  "UNIVERSAL",
  "TANK",
  "SUPPORT",
] as const;

export const rarities = ["RARE", "LEGEND"] as const;

export const skillTypes = ["ACTIVE", "PASSIVE"] as const;

export const heroCreateSchema = z.object({
  name: z.string().min(1, "ชื่อฮีโร่ห้ามว่าง").trim(),
  heroType: z.enum(heroTypes, { message: "เลือกประเภทฮีโร่" }),
  rarity: z.enum(rarities, { message: "เลือกความหายาก" }),
  imageUrl: z.string().default(""),
  skill1Type: z.enum(skillTypes).default("ACTIVE"),
  skill2Type: z.enum(skillTypes).default("ACTIVE"),
  skill3Type: z.enum(skillTypes).default("PASSIVE"),
});

export const heroUpdateSchema = z.object({
  name: z.string().min(1, "ชื่อฮีโร่ห้ามว่าง").trim().optional(),
  heroType: z.enum(heroTypes).optional(),
  rarity: z.enum(rarities).optional(),
  imageUrl: z.string().optional(),
  skill1Type: z.enum(skillTypes).optional(),
  skill2Type: z.enum(skillTypes).optional(),
  skill3Type: z.enum(skillTypes).optional(),
});

export const heroBulkSchema = z.object({
  names: z
    .array(z.string().min(1).trim())
    .min(1, "ต้องมีชื่อฮีโร่อย่างน้อย 1 ตัว"),
});

export type HeroCreate = z.infer<typeof heroCreateSchema>;
export type HeroUpdate = z.infer<typeof heroUpdateSchema>;
export type HeroBulk = z.infer<typeof heroBulkSchema>;
