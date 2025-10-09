/**
 * Debug endpoint to expose database configuration in production
 *
 * This endpoint helps troubleshoot why SQL placeholder conversion isn't working
 */

import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const db = getDatabase();
    await db.initialize();

    // Test a simple query with ? placeholder to verify conversion
    let testQueryResult = null;
    let testQueryError = null;

    try {
      const testQuery = 'SELECT 1 as test WHERE 1 = ?';
      testQueryResult = await db.query(testQuery, [1]);
    } catch (error: any) {
      testQueryError = {
        message: error.message,
        code: error.code
      };
    }

    return NextResponse.json({
      success: true,
      config: {
        dbType: db.getType(),
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        nodeEnv: process.env.NODE_ENV,
        databaseUrlSet: process.env.DATABASE_URL ? 'YES' : 'NO',
        postgresUrlSet: process.env.POSTGRES_URL ? 'YES' : 'NO',
        databaseUrlLength: process.env.DATABASE_URL?.length || 0,
        postgresUrlLength: process.env.POSTGRES_URL?.length || 0,
      },
      testQuery: {
        success: testQueryResult !== null,
        result: testQueryResult,
        error: testQueryError
      },
      message: `Database type detected: ${db.getType()}`
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      config: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        nodeEnv: process.env.NODE_ENV,
      }
    }, { status: 500 });
  }
}
