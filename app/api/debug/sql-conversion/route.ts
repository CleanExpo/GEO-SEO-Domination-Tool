/**
 * Debug endpoint to test SQL placeholder conversion
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Test the conversion logic directly
  const originalSql = 'SELECT 1 as test WHERE 1 = ?';
  const params = [1];

  let paramIndex = 1;
  const convertedSql = originalSql.replace(/\?/g, () => `$${paramIndex++}`);

  return NextResponse.json({
    test: 'SQL Placeholder Conversion',
    original: originalSql,
    converted: convertedSql,
    parameters: params,
    conversionWorks: convertedSql === 'SELECT 1 as test WHERE 1 = $1',
    message: convertedSql === 'SELECT 1 as test WHERE 1 = $1'
      ? '✅ Conversion logic is correct'
      : '❌ Conversion logic is broken'
  });
}
