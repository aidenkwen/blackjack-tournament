-- Allow NULL values for table_number and seat_number since players are seated after registration
ALTER TABLE registrations ALTER COLUMN table_number DROP NOT NULL;
ALTER TABLE registrations ALTER COLUMN seat_number DROP NOT NULL;

-- Verify the constraints were removed
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default 
FROM information_schema.columns 
WHERE table_name = 'registrations' 
    AND column_name IN ('table_number', 'seat_number')
ORDER BY column_name;