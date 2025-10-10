import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

/**
 * Admin Supabase Client (Service Role)
 * Bypasses Row Level Security - use for server-side operations only
 * DO NOT expose this client to the frontend
 */

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin credentials');
  }

  adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
