-- Migration: Move role/guildId/accessStatus from app_metadata to public.users
-- Run this in Supabase SQL Editor (drizzle-kit push has a bug with CHECK constraints).

-- 0. Add new columns + FK + index
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'member' NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "guild_id" uuid;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "access_status" text;
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_guild_id_guilds_id_fk"
    FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS "idx_users_guild_role" ON "users" USING btree ("guild_id","role");

-- 1. Backfill existing public.users rows from auth.users.raw_app_meta_data
UPDATE public.users u
SET
  role = COALESCE(a.raw_app_meta_data->>'role', 'member'),
  guild_id = CASE
    WHEN a.raw_app_meta_data->>'guildId' IS NOT NULL
      AND a.raw_app_meta_data->>'guildId' != ''
    THEN (a.raw_app_meta_data->>'guildId')::uuid
    ELSE NULL
  END,
  access_status = a.raw_app_meta_data->>'accessStatus'
FROM auth.users a
WHERE u.id = a.id;

-- 2. Insert missing public.users rows for auth users that don't have one yet
INSERT INTO public.users (id, email, username, role, guild_id, access_status)
SELECT
  a.id,
  COALESCE(a.email, ''),
  COALESCE(split_part(a.email, '@', 1), ''),
  COALESCE(a.raw_app_meta_data->>'role', 'member'),
  CASE
    WHEN a.raw_app_meta_data->>'guildId' IS NOT NULL
      AND a.raw_app_meta_data->>'guildId' != ''
    THEN (a.raw_app_meta_data->>'guildId')::uuid
    ELSE NULL
  END,
  a.raw_app_meta_data->>'accessStatus'
FROM auth.users a
LEFT JOIN public.users u ON u.id = a.id
WHERE u.id IS NULL;

-- 3. Update handle_new_user() trigger to include role default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(split_part(NEW.email, '@', 1), ''),
    'member'
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
