-- Add the missing seating columns to registrations table
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS table_number INTEGER;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS seat_number INTEGER;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'registrations' 
ORDER BY ordinal_position;