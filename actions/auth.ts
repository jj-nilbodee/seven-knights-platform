"use server";

import { createClient } from "@/lib/supabase/server";
import { upsertUser } from "@/lib/db/queries/users";
import { redirect } from "next/navigation";

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

  // Backfill users table row (FK target for other tables)
  if (data.user) {
    await upsertUser({
      id: data.user.id,
      email: data.user.email ?? email,
      username: (data.user.email ?? email).split("@")[0],
    });
  }

  redirect("/dashboard");
}

export async function register(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Create users table row (FK target for other tables)
  if (data.user) {
    await upsertUser({
      id: data.user.id,
      email: data.user.email ?? email,
      username: (data.user.email ?? email).split("@")[0],
    });
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
