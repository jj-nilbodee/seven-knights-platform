import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UserRole = "admin" | "officer" | "member";

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  guildId: string | null;
  accessStatus: string | null;
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const meta = user.app_metadata;
  return {
    id: user.id,
    email: user.email ?? "",
    role: meta.role ?? "member",
    guildId: meta.guildId ?? null,
    accessStatus: meta.accessStatus ?? null,
  };
}

export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireOfficer(): Promise<AppUser> {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "officer") redirect("/dashboard");
  return user;
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

/**
 * Resolve effective guildId: admin can override via URL param,
 * everyone else uses their own guildId from app_metadata.
 */
export function resolveGuildId(
  user: AppUser,
  searchParams?: { guildId?: string },
): string | null {
  if (user.role === "admin" && searchParams?.guildId) {
    return searchParams.guildId;
  }
  return user.guildId;
}

/**
 * Require the user to be an officer AND belong to a guild.
 * Returns { user, guildId } or renders the "no guild" fallback.
 */
export async function requireGuild(
  searchParams?: { guildId?: string },
): Promise<{ user: AppUser; guildId: string } | null> {
  const user = await requireOfficer();
  const guildId = resolveGuildId(user, searchParams);
  if (!guildId) return null;
  return { user, guildId };
}

export const NO_GUILD_MESSAGE = "คุณยังไม่ได้อยู่ในกิลด์";
