/**
 * Supabase Database Client
 *
 * Uses Supabase's connection pooling instead of raw pg.Pool
 * This avoids "max client" errors in serverless environments
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create singleton Supabase client with connection pooling
let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('⚠️  Supabase credentials not configured - falling back to direct SQL');
      return null;
    }

    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });

    console.log('✅ Supabase client initialized (uses built-in connection pooling)');
  }

  return supabaseClient;
}

/**
 * Execute a raw SQL query using Supabase's connection pooling
 * Automatically handles parameter substitution
 */
export async function executeQuery(sql: string, params: any[] = []) {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error('Supabase not configured');
  }

  // Convert ? placeholders to $1, $2, $3
  let paramIndex = 1;
  const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);

  const { data, error } = await client.rpc('exec_sql', {
    query: pgSql,
    params: params
  });

  if (error) {
    console.error('[Supabase Query Error]:', error);
    throw error;
  }

  return {
    rows: data || [],
    rowCount: data?.length || 0
  };
}
