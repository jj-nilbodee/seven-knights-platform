ALTER TABLE "advent_profiles" DROP CONSTRAINT "advent_profiles_cycle_id_advent_cycles_id_fk";
--> statement-breakpoint
ALTER TABLE "advent_cycles" ADD COLUMN "name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "advent_cycles" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "advent_cycles" ADD COLUMN "end_date" date;--> statement-breakpoint
ALTER TABLE "advent_cycles" ADD COLUMN "target_day" integer DEFAULT 9;--> statement-breakpoint
ALTER TABLE "advent_cycles" ADD COLUMN "auto_regenerate" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "advent_cycles" ADD COLUMN "member_availability" jsonb;--> statement-breakpoint
ALTER TABLE "advent_cycles" ADD COLUMN "estimated_days" integer;--> statement-breakpoint
ALTER TABLE "advent_cycles" ADD COLUMN "actual_days" integer;--> statement-breakpoint
ALTER TABLE "advent_cycles" ADD COLUMN "created_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "advent_profiles" ADD COLUMN "member_id" uuid;--> statement-breakpoint
ALTER TABLE "advent_profiles" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "advent_profiles" ADD COLUMN "extraction_confidence" integer;--> statement-breakpoint
ALTER TABLE "advent_cycles" ADD CONSTRAINT "advent_cycles_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advent_profiles" ADD CONSTRAINT "advent_profiles_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advent_profiles" ADD CONSTRAINT "advent_profiles_cycle_id_advent_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."advent_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_advent_profile_cycle" ON "advent_profiles" USING btree ("cycle_id");