import { NextRequest, NextResponse } from 'next/server';
import { getJob, cancelJob } from '@/lib/redisq';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }){
  const job = await getJob(params.id);
  if (!job) return NextResponse.json({ ok:false, error:'not_found' }, { status:404 });
  return NextResponse.json({ ok:true, result:{ job } }, { status:200 });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }){
  const body = await req.json().catch(()=>({}));
  if (body?.action !== 'cancel') return NextResponse.json({ ok:false, error:'invalid_action' }, { status:400 });
  const ok = await cancelJob(params.id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 409 });
}
