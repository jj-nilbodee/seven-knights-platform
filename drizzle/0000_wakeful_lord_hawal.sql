CREATE TABLE "advent_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"status" text DEFAULT 'collecting',
	"boss_hp" jsonb DEFAULT '{"teo":100000000,"yeonhee":100000000,"kyle":100000000,"karma":100000000}'::jsonb,
	"plan" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "advent_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"member_ign" text NOT NULL,
	"scores" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"cycle_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attack_guidelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"defense_team" jsonb NOT NULL,
	"counter_strategies" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "battle_hero_pairs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "battle_hero_pairs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"battle_id" uuid NOT NULL,
	"guild_id" uuid NOT NULL,
	"date" date NOT NULL,
	"result" text NOT NULL,
	"allied_hero_id" text NOT NULL,
	"enemy_hero_id" text NOT NULL,
	"allied_formation" text,
	"enemy_formation" text,
	"allied_speed" integer,
	"enemy_speed" integer,
	"first_turn" boolean
);
--> statement-breakpoint
CREATE TABLE "battles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"date" date NOT NULL,
	"weekday" text NOT NULL,
	"battle_number" integer NOT NULL,
	"battle_type" text DEFAULT 'attack',
	"result" text NOT NULL,
	"enemy_guild_name" text DEFAULT '',
	"enemy_player_name" text,
	"allied_team" jsonb NOT NULL,
	"enemy_team" jsonb NOT NULL,
	"first_turn" boolean,
	"video_url" text,
	"submitted_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "castle_rush_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"member_id" uuid,
	"member_ign" text,
	"boss" text NOT NULL,
	"score" bigint NOT NULL,
	"date" date NOT NULL,
	"extraction_method" text DEFAULT 'manual',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "guilds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "guilds_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "gvg_guide_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guide_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"defense_heroes" text[] NOT NULL,
	"attack_heroes" text[] NOT NULL,
	"attack_priority" integer NOT NULL,
	"attack_skill_order" jsonb NOT NULL,
	"defense_skill_order" jsonb,
	"strategy_notes" text DEFAULT '',
	"media_urls" text[] DEFAULT ARRAY[]::TEXT[],
	"patch_version" text NOT NULL,
	"status" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gvg_guides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"defense_heroes" text[] NOT NULL,
	"attack_heroes" text[] NOT NULL,
	"attack_priority" integer DEFAULT 1 NOT NULL,
	"attack_skill_order" jsonb NOT NULL,
	"defense_skill_order" jsonb,
	"strategy_notes" text DEFAULT '',
	"media_urls" text[] DEFAULT ARRAY[]::TEXT[],
	"patch_version" text NOT NULL,
	"version" integer DEFAULT 1,
	"status" text DEFAULT 'draft',
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "heroes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"hero_type" text NOT NULL,
	"rarity" text NOT NULL,
	"image_url" text DEFAULT '',
	"is_active" boolean DEFAULT true,
	"skill_1_id" uuid DEFAULT gen_random_uuid(),
	"skill_1_name" text DEFAULT 'Skill 1' NOT NULL,
	"skill_1_type" text DEFAULT 'ACTIVE' NOT NULL,
	"skill_1_image_url" text DEFAULT '',
	"skill_2_id" uuid DEFAULT gen_random_uuid(),
	"skill_2_name" text DEFAULT 'Skill 2' NOT NULL,
	"skill_2_type" text DEFAULT 'ACTIVE' NOT NULL,
	"skill_2_image_url" text DEFAULT '',
	"skill_3_id" uuid DEFAULT gen_random_uuid(),
	"skill_3_name" text DEFAULT 'Passive' NOT NULL,
	"skill_3_type" text DEFAULT 'PASSIVE' NOT NULL,
	"skill_3_image_url" text DEFAULT '',
	"archetype" text,
	"attack_type" text,
	"target_type" text,
	"cc_abilities" jsonb DEFAULT '{}'::jsonb,
	"buffs" jsonb DEFAULT '{}'::jsonb,
	"debuffs" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "heroes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "member_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"guild_id" uuid NOT NULL,
	"status" text DEFAULT 'pending',
	"requested_at" timestamp with time zone DEFAULT now(),
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"ign" text NOT NULL,
	"nickname" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"status" text DEFAULT 'active',
	"joined_at" timestamp with time zone DEFAULT now(),
	"last_battle_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "officers" (
	"user_id" uuid NOT NULL,
	"guild_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"display_name" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "advent_cycles" ADD CONSTRAINT "advent_cycles_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advent_profiles" ADD CONSTRAINT "advent_profiles_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advent_profiles" ADD CONSTRAINT "advent_profiles_cycle_id_advent_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."advent_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attack_guidelines" ADD CONSTRAINT "attack_guidelines_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_hero_pairs" ADD CONSTRAINT "battle_hero_pairs_battle_id_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "castle_rush_scores" ADD CONSTRAINT "castle_rush_scores_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "castle_rush_scores" ADD CONSTRAINT "castle_rush_scores_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gvg_guide_versions" ADD CONSTRAINT "gvg_guide_versions_guide_id_gvg_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."gvg_guides"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gvg_guides" ADD CONSTRAINT "gvg_guides_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_access" ADD CONSTRAINT "member_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_access" ADD CONSTRAINT "member_access_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_access" ADD CONSTRAINT "member_access_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "officers" ADD CONSTRAINT "officers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "officers" ADD CONSTRAINT "officers_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_advent_guild" ON "advent_cycles" USING btree ("guild_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "advent_profile_unique" ON "advent_profiles" USING btree ("guild_id","member_ign","cycle_id");--> statement-breakpoint
CREATE INDEX "idx_bhp_guild_date" ON "battle_hero_pairs" USING btree ("guild_id","date");--> statement-breakpoint
CREATE INDEX "idx_bhp_matchup" ON "battle_hero_pairs" USING btree ("allied_hero_id","enemy_hero_id");--> statement-breakpoint
CREATE UNIQUE INDEX "battle_unique" ON "battles" USING btree ("guild_id","member_id","date","battle_number");--> statement-breakpoint
CREATE INDEX "idx_battle_guild_date" ON "battles" USING btree ("guild_id","date");--> statement-breakpoint
CREATE INDEX "idx_battle_guild_member" ON "battles" USING btree ("guild_id","member_id");--> statement-breakpoint
CREATE INDEX "idx_cr_guild_date" ON "castle_rush_scores" USING btree ("guild_id","date");--> statement-breakpoint
CREATE INDEX "idx_cr_boss" ON "castle_rush_scores" USING btree ("guild_id","boss","date");--> statement-breakpoint
CREATE INDEX "idx_guide_ver" ON "gvg_guide_versions" USING btree ("guide_id","version");--> statement-breakpoint
CREATE INDEX "idx_guide_status" ON "gvg_guides" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_hero_active_name" ON "heroes" USING btree ("is_active","name");--> statement-breakpoint
CREATE UNIQUE INDEX "member_access_unique" ON "member_access" USING btree ("user_id","guild_id");--> statement-breakpoint
CREATE INDEX "idx_access_guild_status" ON "member_access" USING btree ("guild_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "member_guild_ign" ON "members" USING btree ("guild_id","ign");--> statement-breakpoint
CREATE INDEX "idx_member_guild" ON "members" USING btree ("guild_id","is_active","status");--> statement-breakpoint
CREATE UNIQUE INDEX "officers_pk" ON "officers" USING btree ("user_id","guild_id");