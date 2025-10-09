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

    return NextResponse.json({
      success: true,
      config: {
        dbType: db.getType(),
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        nodeEnv: process.env.NODE_ENV,
        databaseUrlSet: process.env.DATABASE_URL ? 'YES' : 'NO',
        postgresUrlSet: process.env.POSTGRES_URL ? 'YES' : 'NO',
        // Don't expose actual values, just show if they exist
        databaseUrlLength: process.env.DATABASE_URL?.length || 0,
        postgresUrlLength: process.env.POSTGRES_URL?.length || 0,
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
