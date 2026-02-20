-- Custom SQL migration: extensions, GIN indexes, triggers
-- Run manually via Supabase SQL Editor after the initial Drizzle migration

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- GIN index for Thai hero name search
CREATE INDEX IF NOT EXISTS idx_hero_name_trgm ON heroes USING GIN (name gin_trgm_ops);

-- GIN index for guide defense hero array search
CREATE INDEX IF NOT EXISTS idx_guide_defense_heroes ON gvg_guides USING GIN (defense_heroes);

-- ============================================
-- Auto-update updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_heroes BEFORE UPDATE ON heroes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_battles BEFORE UPDATE ON battles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_guides BEFORE UPDATE ON gvg_guides FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_guilds BEFORE UPDATE ON guilds FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_guidelines BEFORE UPDATE ON attack_guidelines FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_advent BEFORE UPDATE ON advent_cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_advent_profiles BEFORE UPDATE ON advent_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Auto-sync auth.users → public.users on signup
-- Replaces manual upsertUser() calls in application code
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (NEW.id, COALESCE(NEW.email, ''), split_part(COALESCE(NEW.email, ''), '@', 1))
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- Auto-populate battle_hero_pairs on battle insert/update
-- ============================================
CREATE OR REPLACE FUNCTION populate_battle_hero_pairs()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM battle_hero_pairs WHERE battle_id = NEW.id;
    END IF;

    INSERT INTO battle_hero_pairs (
        battle_id, guild_id, date, result,
        allied_hero_id, enemy_hero_id,
        allied_formation, enemy_formation,
        allied_speed, enemy_speed, first_turn
    )
    SELECT
        NEW.id, NEW.guild_id, NEW.date, NEW.result,
        a->>'heroId', e->>'heroId',
        NEW.allied_team->>'formation', NEW.enemy_team->>'formation',
        (NEW.allied_team->>'speed')::int, (NEW.enemy_team->>'speed')::int,
        NEW.first_turn
    FROM jsonb_array_elements(NEW.allied_team->'heroes') AS a,
         jsonb_array_elements(NEW.enemy_team->'heroes') AS e;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_battle_hero_pairs
    AFTER INSERT OR UPDATE ON battles
    FOR EACH ROW EXECUTE FUNCTION populate_battle_hero_pairs();

-- ============================================
-- Auto-snapshot guide version before update
-- ============================================
CREATE OR REPLACE FUNCTION snapshot_guide_version()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO gvg_guide_versions (
        guide_id, version, title, defense_heroes, attack_heroes,
        attack_priority, attack_skill_order, defense_skill_order,
        strategy_notes, media_urls, patch_version, status, created_by
    ) VALUES (
        OLD.id, OLD.version, OLD.title, OLD.defense_heroes, OLD.attack_heroes,
        OLD.attack_priority, OLD.attack_skill_order, OLD.defense_skill_order,
        OLD.strategy_notes, OLD.media_urls, OLD.patch_version, OLD.status, OLD.created_by
    );
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_guide_version
    BEFORE UPDATE ON gvg_guides
    FOR EACH ROW EXECUTE FUNCTION snapshot_guide_version();
