import { NextResponse } from 'next/server';

// GET /api/companies-list - Fresh endpoint to test Vercel deployment
export async function GET() {
  return NextResponse.json({
    companies: [],
    message: "This is a brand new endpoint deployed at " + new Date().toISOString()
  });
}
