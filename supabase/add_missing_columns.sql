-- First, check if columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'tournaments';

-- Add missing columns if they don't exist
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS entry_cost INTEGER DEFAULT 500;

ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS rebuy_cost INTEGER DEFAULT 500;

ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS mulligan_cost INTEGER DEFAULT 100;

-- Update any NULL values
UPDATE tournaments 
SET 
  entry_cost = 500,
  rebuy_cost = 500,
  mulligan_cost = 100
WHERE entry_cost IS NULL 
   OR rebuy_cost IS NULL 
   OR mulligan_cost IS NULL;

-- Verify the update
SELECT * FROM tournaments;