import { NextResponse } from 'next/server';

// GET /api/companies - List all companies
// Cache-bust: 2025-10-17
export async function GET() {
  return NextResponse.json({ companies: [] });
}
