-- Add seat_number column to registrations table
ALTER TABLE registrations ADD COLUMN seat_number INTEGER;

-- Update any existing registrations to have a default seat number
UPDATE registrations 
SET seat_number = 1 
WHERE seat_number IS NULL;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'registrations' 
ORDER BY ordinal_position;