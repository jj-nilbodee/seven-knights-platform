-- Performance optimization: add missing indexes for analytics queries

-- Used by getMemberPerformance which filters on battle_type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battle_guild_type_date
  ON battles (guild_id, battle_type, date);

-- Used by getHeroMatchups which filters on result
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bhp_guild_result_date
  ON battle_hero_pairs (guild_id, result, date);
