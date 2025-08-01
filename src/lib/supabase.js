import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Debug logging - deployment with corrected .supabase.co URL
console.log('Supabase Configuration:');
console.log('- URL:', SUPABASE_URL);
console.log('- URL ends with .co:', SUPABASE_URL.endsWith('.supabase.co'));
console.log('- Key exists:', SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' ? 'Yes' : 'No');
console.log('- Key length:', SUPABASE_ANON_KEY.length);
console.log('- Key first 20 chars:', SUPABASE_ANON_KEY.substring(0, 20));
console.log('- Key last 20 chars:', SUPABASE_ANON_KEY.substring(SUPABASE_ANON_KEY.length - 20));

// Test the connection immediately
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error) => {
  console.error('Supabase error:', error);
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};