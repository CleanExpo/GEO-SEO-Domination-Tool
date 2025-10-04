import { NextRequest, NextResponse } from 'next/server';
import { recordView, recordEvent, readAll } from '@/lib/analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(){
  const data = await readAll();
  const last7d = Date.now() - 7*24*60*60*1000;
  const views7 = data.views.filter(v=> new Date(v.ts).getTime() >= last7d);
  const byPath = new Map<string, number>();
  for(const v of views7){ byPath.set(v.path, (byPath.get(v.path)||0)+1); }
  const summary = Array.from(byPath.entries()).sort((a,b)=> b[1]-a[1]).slice(0,20).map(([path,count])=>({path,count}));
  const rels = data.events.filter(e=> e.name==='deploy.switch');
  return NextResponse.json({ ok:true, summary, totals: { views: data.views.length, events: data.events.length }, switches: rels });
}

export async function POST(req: NextRequest){
  const body = await req.json().catch(()=>({}));
  const type = String(body.type||'').toLowerCase();
  try{
    if (type==='view'){
      await recordView({ path: body.path||'/', ua: req.headers.get('user-agent')||'', ref: body.ref||'', release: body.release||'', color: body.color||null });
      return NextResponse.json({ ok:true });
    }
    if (type==='event'){
      await recordEvent({ name: body.name||'event', payload: body.payload||{} });
      return NextResponse.json({ ok:true });
    }
    return NextResponse.json({ ok:false, error:'unknown type' }, { status:400 });
  }catch(e:any){
    return NextResponse.json({ ok:false, error: e?.message||'error' }, { status:500 });
  }
}
