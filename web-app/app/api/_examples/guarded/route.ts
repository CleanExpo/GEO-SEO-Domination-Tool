import { NextRequest, NextResponse } from 'next/server';
import { guard, requireMethod } from '@/lib/apiGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest){
  const m = requireMethod(req, ['POST']); if (m) return m;
  const g = await guard(req, { allowed: ['pro','admin'] }); if (g) return g;
  const body = await req.json().catch(()=>({}));
  return NextResponse.json({ ok:true, echo: body, note: 'You are pro/admin.' });
}

export async function GET(req: NextRequest){
  const g = await guard(req, { allowed: ['admin'] }); if (g) return g;
  return NextResponse.json({ ok:true, secret: 'admins-only payload' });
}
