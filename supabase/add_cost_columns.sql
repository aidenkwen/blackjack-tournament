-- Add the missing cost columns to tournaments table
ALTER TABLE tournaments ADD COLUMN entry_cost INTEGER DEFAULT 500;
ALTER TABLE tournaments ADD COLUMN rebuy_cost INTEGER DEFAULT 500;
ALTER TABLE tournaments ADD COLUMN mulligan_cost INTEGER DEFAULT 100;

-- Update any existing tournaments with default values
UPDATE tournaments 
SET entry_cost = 500, rebuy_cost = 500, mulligan_cost = 100 
WHERE entry_cost IS NULL OR rebuy_cost IS NULL OR mulligan_cost IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'tournaments' 
ORDER BY ordinal_position;