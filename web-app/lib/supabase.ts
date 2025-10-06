import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase is OPTIONAL in development - system falls back to SQLite
// In production (Vercel), these env vars are required and will be set

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

// Create client with placeholder values for build-time
// At runtime, code should check isSupabaseConfigured() before using
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check if Supabase is actually configured
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
  );
}

// Safe wrapper for Supabase operations
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    console.warn('[Supabase] Not configured - using local database fallback');
    return null;
  }
  return supabase;
}
