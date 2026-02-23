"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/**
 * Ensure the authenticated user has a corresponding row in public.users.
 * The DB trigger handles new signups, but users created before the trigger
 * was applied may be missing. This upsert closes the gap on login.
 */
async function ensurePublicUser(id: string, email: string) {
  await db
    .insert(users)
    .values({ id, email, username: email.split("@")[0] })
    .onConflictDoUpdate({ target: users.id, set: { email } });
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await ensurePublicUser(data.user.id, data.user.email ?? email);
  }

  redirect("/dashboard");
}

export async function register(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
