import { NextRequest, NextResponse } from 'next/server';
import { listBackups, restoreBackup } from '@/lib/rollback';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getActiveWorkspace(req: NextRequest){ return req.cookies.get('active_workspace')?.value || null; }

export async function GET(){
  try{
    const list = await listBackups();
    return NextResponse.json({ ok:true, result:{ backups: list } }, { status:200 });
  }catch(e:any){ return NextResponse.json({ ok:false, error: e?.message||'unknown error' }, { status:500 }); }
}

export async function POST(req: NextRequest){
  const t0 = Date.now();
  try{
    const ws = getActiveWorkspace(req);
    if (!ws) return NextResponse.json({ ok:false, error:'workspace_required' }, { status:401 });

    const supa = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { get: (n)=> req.cookies.get(n)?.value, set(){}, remove(){} }
      }
    );
    const { data: { user } } = await supa.auth.getUser();

    const body = await req.json().catch(()=>({}));
    const target = String(body?.target||'');
    if (!target) return NextResponse.json({ ok:false, error:'target required' }, { status:400 });

    await restoreBackup(target);

    return NextResponse.json({ ok:true }, { status:200 });
  }catch(e:any){
    return NextResponse.json({ ok:false, error: e?.message||'unknown error' }, { status:500 });
  }
}
