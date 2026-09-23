import { createClient } from '@supabase/supabase-js';

// Supabase URL & Anon Key provided by user
export const DEFAULT_SUPABASE_URL = 'https://gqivavwopowlwflzhoxe.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxaXZhdndvcG93bHdmbHpob3hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDUwMzgsImV4cCI6MjEwNTIyMTAzOH0.2hHsTWY9MNgSQKCmtRWdZTGAxJkiVPnjR3KhIMRGdkw';

export const SUPABASE_URL: string =
  (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;

export const SUPABASE_ANON_KEY: string =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
