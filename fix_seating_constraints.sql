-- Fix seating constraints to allow NULL values
-- This allows registrations to be created before seating assignment

ALTER TABLE registrations 
ALTER COLUMN table_number DROP NOT NULL,
ALTER COLUMN seat_number DROP NOT NULL;

-- Verify the changes
SELECT 
    column_name, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'registrations' 
    AND column_name IN ('table_number', 'seat_number');