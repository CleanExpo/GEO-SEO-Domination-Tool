/**
 * Debug endpoint to expose database configuration in production
 *
 * This endpoint verifies Supabase connection and configuration
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Test a simple query to verify connection
    let testQueryResult = null;
    let testQueryError = null;

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('count')
        .limit(1);

      testQueryResult = { count: data?.length || 0 };
      testQueryError = error;
    } catch (error: any) {
      testQueryError = {
        message: error.message,
        code: error.code
      };
    }

    return NextResponse.json({
      success: true,
      config: {
        dbType: 'Supabase PostgreSQL',
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        nodeEnv: process.env.NODE_ENV,
        supabaseUrlSet: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'YES' : 'NO',
        supabaseKeySet: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'YES' : 'NO',
      },
      testQuery: {
        success: testQueryResult !== null && !testQueryError,
        result: testQueryResult,
        error: testQueryError
      },
      message: 'Database type: Supabase PostgreSQL'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      config: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        nodeEnv: process.env.NODE_ENV,
      }
    }, { status: 500 });
  }
}
