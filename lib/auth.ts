import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserFromDb } from "@/lib/db/queries/users";
import { listGuilds } from "@/lib/db/queries/guilds";

export type UserRole = "admin" | "officer" | "member";

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  guildId: string | null;
  accessStatus: string | null;
}

export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Read from public.users (source of truth) instead of app_metadata (cache)
  const dbUser = await getUserFromDb(user.id);
  if (!dbUser) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    role: (dbUser.role as UserRole) ?? "member",
    guildId: dbUser.guildId ?? null,
    accessStatus: dbUser.accessStatus ?? null,
  };
});

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
 * Admins without a personal guild auto-select the first available guild.
 * Returns { user, guildId } or renders the "no guild" fallback.
 */
export async function requireGuild(
  searchParams?: { guildId?: string },
): Promise<{ user: AppUser; guildId: string } | null> {
  const user = await requireOfficer();
  let guildId = resolveGuildId(user, searchParams);

  // Admins without a personal guild: auto-select the first available guild
  if (!guildId && user.role === "admin") {
    const allGuilds = await listGuilds();
    if (allGuilds.length > 0) {
      guildId = allGuilds[0].id;
    }
  }

  if (!guildId) return null;
  return { user, guildId };
}

export const NO_GUILD_MESSAGE = "คุณยังไม่ได้อยู่ในกิลด์";
