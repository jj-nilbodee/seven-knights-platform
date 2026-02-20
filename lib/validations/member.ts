import { z } from "zod";

export const memberStatuses = ["active", "warning", "inactive"] as const;

export const memberCreateSchema = z
  .object({
    guildId: z.string().uuid(),
    ign: z.string().min(1, "กรุณากรอก IGN").trim(),
    nickname: z.string().trim().optional().default(""),
  })
  .transform((data) => ({
    ...data,
    nickname: data.nickname || data.ign,
  }));

export const memberUpdateSchema = z.object({
  ign: z.string().min(1).trim().optional(),
  nickname: z.string().min(1).trim().optional(),
  status: z.enum(memberStatuses).optional(),
  isActive: z.boolean().optional(),
});

export const memberBulkSchema = z.object({
  guildId: z.string().uuid(),
  entries: z
    .array(
      z
        .object({
          ign: z.string().min(1).trim(),
          nickname: z.string().trim().optional().default(""),
        })
        .transform((e) => ({ ...e, nickname: e.nickname || e.ign })),
    )
    .min(1, "ต้องมีสมาชิกอย่างน้อย 1 คน"),
});

export type MemberCreate = z.infer<typeof memberCreateSchema>;
export type MemberUpdate = z.infer<typeof memberUpdateSchema>;
export type MemberBulk = z.infer<typeof memberBulkSchema>;
