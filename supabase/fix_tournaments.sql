-- Add missing columns to existing tournaments table
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS entry_cost INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS rebuy_cost INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS mulligan_cost INTEGER DEFAULT 100;

-- Update any existing tournaments with default values
UPDATE tournaments 
SET 
  entry_cost = COALESCE(entry_cost, 500),
  rebuy_cost = COALESCE(rebuy_cost, 500),
  mulligan_cost = COALESCE(mulligan_cost, 100)
WHERE entry_cost IS NULL OR rebuy_cost IS NULL OR mulligan_cost IS NULL;