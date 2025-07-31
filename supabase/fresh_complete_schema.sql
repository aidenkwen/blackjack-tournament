-- Drop existing tables and start fresh (BE CAREFUL - this will delete all data!)
DROP TABLE IF EXISTS disabled_tables CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS tournament_players CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;

-- Drop triggers and functions
DROP TRIGGER IF EXISTS update_tournaments_updated_at ON tournaments;
DROP TRIGGER IF EXISTS update_tournament_players_updated_at ON tournament_players;
DROP TRIGGER IF EXISTS update_registrations_updated_at ON registrations;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create tournaments table with ALL required columns
CREATE TABLE tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  rounds INTEGER NOT NULL DEFAULT 0,
  time_slots INTEGER NOT NULL DEFAULT 1,
  entry_cost INTEGER NOT NULL DEFAULT 500,
  rebuy_cost INTEGER NOT NULL DEFAULT 500,
  mulligan_cost INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tournament_players table
CREATE TABLE tournament_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_account_number VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  entry_type VARCHAR(50) DEFAULT 'PAY',
  host VARCHAR(255),
  additional_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, player_account_number)
);

-- Create registrations table
CREATE TABLE registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID REFERENCES tournament_players(id) ON DELETE SET NULL,
  event_name VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(255) NOT NULL,
  round VARCHAR(50) NOT NULL,
  time_slot INTEGER NOT NULL,
  table_number INTEGER NOT NULL,
  host VARCHAR(255),
  mulligan BOOLEAN DEFAULT FALSE,
  last_player BOOLEAN DEFAULT FALSE,
  entry_type VARCHAR(50) DEFAULT 'PAY',
  registered_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create disabled_tables table for tracking disabled tables
CREATE TABLE disabled_tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round VARCHAR(50) NOT NULL,
  time_slot INTEGER NOT NULL,
  table_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, round, time_slot, table_number)
);

-- Create indexes for better performance
CREATE INDEX idx_tournament_players_tournament_id ON tournament_players(tournament_id);
CREATE INDEX idx_tournament_players_account_number ON tournament_players(player_account_number);
CREATE INDEX idx_registrations_tournament_id ON registrations(tournament_id);
CREATE INDEX idx_registrations_player_id ON registrations(player_id);
CREATE INDEX idx_registrations_round_timeslot ON registrations(round, time_slot);
CREATE INDEX idx_disabled_tables_tournament_id ON disabled_tables(tournament_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournament_players_updated_at BEFORE UPDATE ON tournament_players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE disabled_tables ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your auth requirements)
-- For now, allowing all operations for development
CREATE POLICY "Enable all access for tournaments" ON tournaments
  FOR ALL USING (true);

CREATE POLICY "Enable all access for tournament_players" ON tournament_players
  FOR ALL USING (true);

CREATE POLICY "Enable all access for registrations" ON registrations
  FOR ALL USING (true);

CREATE POLICY "Enable all access for disabled_tables" ON disabled_tables
  FOR ALL USING (true);