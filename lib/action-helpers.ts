import { z } from "zod";
import { uuidSchema } from "@/lib/validations/shared";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppUser } from "@/lib/auth";

type ActionResult<T = undefined> = T extends undefined
  ? { error: string } | { success: true }
  : { error: string } | ({ success: true } & T);

/**
 * Validate a UUID string. Returns error result if invalid.
 */
export function validateUUID(id: string): { error: string } | null {
  if (!uuidSchema.safeParse(id).success) {
    return { error: "ID ไม่ถูกต้อง" };
  }
  return null;
}

/**
 * Parse data with a Zod schema. Returns error result with first issue if invalid.
 */
export function parseOrError<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): { error: string } | { data: z.output<T> } {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  return { data: parsed.data };
}

/**
 * Resolve effective guild ID for an action. Admins can override with a specified guildId.
 * Returns error result if user has no guild.
 */
export function ensureGuildContext(
  user: AppUser,
  overrideGuildId?: string | null,
): { error: string } | { guildId: string } {
  const effectiveGuildId =
    user.role === "admin" && overrideGuildId
      ? overrideGuildId
      : user.guildId;
  if (!effectiveGuildId) {
    return { error: "คุณยังไม่ได้อยู่ในกิลด์" };
  }
  return { guildId: effectiveGuildId };
}

/**
 * Handle common database errors (unique constraint violations, etc).
 */
export function handleDbError(
  err: unknown,
  messages: { unique?: string; generic: string },
): { error: string } {
  if (
    messages.unique &&
    err instanceof Error &&
    (err.message.includes("unique constraint") || err.message.includes("unique"))
  ) {
    return { error: messages.unique };
  }
  return { error: messages.generic };
}

/**
 * Sync user metadata to Supabase Auth (app_metadata cache) after DB write.
 */
export async function syncUserMetadata(
  userId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: metadata,
  });
}
