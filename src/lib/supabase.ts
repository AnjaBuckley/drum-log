import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://dudelgszewairvqfzmen.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1ZGVsZ3N6ZXdhaXJ2cWZ6bWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MzI3MzUsImV4cCI6MjA5MTMwODczNX0.0DA8tLDLhG22gK0gOVBqrN8OhVuQP2wqOIj-aRtZilo";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
