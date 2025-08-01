-- Add undo functionality for seat assignments

-- Add table to track recent seat assignments for undo functionality
CREATE TABLE IF NOT EXISTS seat_assignment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  round VARCHAR(50) NOT NULL,
  time_slot INTEGER NOT NULL,
  previous_table_number INTEGER,
  previous_seat_number INTEGER,
  new_table_number INTEGER,
  new_seat_number INTEGER,
  assigned_by VARCHAR(255),
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_seat_history_tournament ON seat_assignment_history(tournament_id);
CREATE INDEX idx_seat_history_assigned_at ON seat_assignment_history(assigned_at DESC);

-- Enable RLS
ALTER TABLE seat_assignment_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Enable all access for seat_assignment_history" ON seat_assignment_history
  FOR ALL USING (true);

-- Verify the table was created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'seat_assignment_history';