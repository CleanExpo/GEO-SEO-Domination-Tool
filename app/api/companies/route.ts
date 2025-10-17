import { NextResponse } from 'next/server';

// GET /api/companies - List all companies
export async function GET() {
  return NextResponse.json({ companies: [] });
}
