import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';

export async function GET() {
  try {
    // Test 1: Environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Test 2: Create admin client
    let clientError = null;
    let supabase = null;
    try {
      supabase = createAdminClient();
    } catch (error: any) {
      clientError = error.message;
    }

    // Test 3: Query database (if client created)
    let queryError = null;
    let rowCount = 0;
    if (supabase) {
      try {
        const { data, error } = await supabase.from('companies').select('id', { count: 'exact' });
        if (error) {
          queryError = error.message;
        } else {
          rowCount = data?.length || 0;
        }
      } catch (error: any) {
        queryError = error.message;
      }
    }

    return NextResponse.json({
      status: 'success',
      checks: {
        hasSupabaseUrl: hasUrl,
        hasServiceRoleKey: hasKey,
        adminClientCreated: !clientError,
        adminClientError: clientError,
        databaseQuerySucceeded: !queryError,
        databaseQueryError: queryError,
        companiesCount: rowCount,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
