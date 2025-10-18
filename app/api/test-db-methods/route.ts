import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const db = getDatabase();

    // Test what type db actually is
    const debugInfo = {
      dbType: typeof db,
      dbConstructor: db?.constructor?.name,
      hasGet: typeof db?.get,
      hasRun: typeof db?.run,
      hasQuery: typeof db?.query,
      hasAll: typeof db?.all,
      methods: Object.getOwnPropertyNames(Object.getPrototypeOf(db)),
      dbKeys: Object.keys(db),
    };

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      message: 'Database client inspection complete'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
