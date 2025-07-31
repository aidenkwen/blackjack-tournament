# Supabase Migration Guide

## Setup Instructions

### 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Note your project URL and anon key from the project settings

### 2. Configure Environment Variables
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Update `.env` with your Supabase credentials:
   ```
   REACT_APP_SUPABASE_URL=your_project_url
   REACT_APP_SUPABASE_ANON_KEY=your_anon_key
   ```

### 3. Set Up Database Tables
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the SQL to create all tables and indexes

### 4. Update Your Code

#### Replace the imports in TournamentContext.js:
```javascript
// Old import
import { useTournaments, useTournamentPlayers, useRegistrations } from '../hooks/useapidata';

// New import
import { useTournaments, useTournamentPlayers, useRegistrations, useDisabledTables } from '../hooks/useSupabaseData';
```

#### Update the context to use Supabase disabled tables:
```javascript
// In TournamentProvider, replace the localStorage disabled tables logic with:
const { disabledTables, updateDisabledTables } = useDisabledTables(selectedEvent);

// Remove the old globalDisabledTables state and localStorage logic
// Update the context value to use the new disabledTables
```

### 5. Migration Steps

1. **Export existing data from localStorage** (optional):
   - Open your app with the old localStorage version
   - In the browser console, run:
   ```javascript
   // Export tournaments
   const tournaments = JSON.parse(localStorage.getItem('blackjack_tournaments') || '[]');
   console.log('Tournaments:', tournaments);
   
   // Export players
   const players = JSON.parse(localStorage.getItem('blackjack_tournament_players') || '{}');
   console.log('Players:', players);
   
   // Export registrations
   const registrations = JSON.parse(localStorage.getItem('blackjack_registrations') || '[]');
   console.log('Registrations:', registrations);
   ```

2. **Import data to Supabase** (if you have existing data):
   - Use the Supabase dashboard or create a migration script
   - Transform the data to match the new schema

### 6. Testing

1. Test creating a new tournament
2. Test uploading a player CSV file
3. Test registering players for rounds
4. Test the seating assignment functionality
5. Test disabling/enabling tables

### 7. Additional Features You Can Add

With Supabase, you now have access to:
- **Real-time updates**: Multiple users can see changes instantly
- **Authentication**: Add user login/signup
- **Row Level Security**: Control who can see/edit what data
- **Database backups**: Automatic backups of your data
- **API access**: Direct database access via REST API

### 8. Troubleshooting

If you encounter issues:
1. Check the browser console for errors
2. Verify your environment variables are set correctly
3. Ensure the database tables were created successfully
4. Check Supabase logs in the dashboard

### 9. Performance Considerations

- The new hooks automatically handle loading states
- Data is fetched on component mount
- Consider implementing pagination for large datasets
- Use database indexes (already included in schema) for better query performance