import { z } from "zod";

export const guildCreateSchema = z.object({
  name: z.string().min(1, "ชื่อกิลด์ห้ามว่าง").max(50).trim(),
});

export const guildUpdateSchema = z.object({
  name: z.string().min(1, "ชื่อกิลด์ห้ามว่าง").max(50).trim().optional(),
});

export type GuildCreate = z.infer<typeof guildCreateSchema>;
export type GuildUpdate = z.infer<typeof guildUpdateSchema>;
