-- Backfill battle_type to 'attack' where null or empty
UPDATE battles SET battle_type = 'attack' WHERE battle_type IS NULL OR battle_type = '';

-- Make battle_type NOT NULL with default 'attack'
ALTER TABLE battles ALTER COLUMN battle_type SET NOT NULL;
ALTER TABLE battles ALTER COLUMN battle_type SET DEFAULT 'attack';
