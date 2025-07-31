import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to handle Supabase errors
export const handleSupabaseError = (error) => {
  console.error('Supabase error:', error);
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};