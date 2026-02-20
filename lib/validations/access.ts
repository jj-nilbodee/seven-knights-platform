import { z } from "zod";

export const accessRequestSchema = z.object({
  guildId: z.string().uuid("กรุณาเลือกกิลด์"),
});

export type AccessRequest = z.infer<typeof accessRequestSchema>;
