import { z } from "zod";
import { battleResults, battleTypes, castleTypes } from "./battle";

export const quickSubmitBattleSchema = z.object({
  memberId: z.string().uuid(),
  result: z.enum(battleResults),
  battleType: z.enum(battleTypes).default("attack"),
  enemyPlayerName: z.string().default(""),
  enemyCastleType: z.enum(castleTypes).nullable().default(null),
  enemyCastleNumber: z.number().int().min(1).max(5).nullable().default(null),
});

export const quickSubmitSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  enemyGuildName: z.string().default(""),
  battles: z.array(quickSubmitBattleSchema).min(1),
});

export type QuickSubmitBattle = z.infer<typeof quickSubmitBattleSchema>;
export type QuickSubmitInput = z.infer<typeof quickSubmitSchema>;
