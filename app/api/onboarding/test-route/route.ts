/**
 * Test Route to verify API routing works
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Test route works!',
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'POST method works!',
    timestamp: new Date().toISOString()
  });
}
