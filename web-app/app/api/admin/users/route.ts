import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimitCheck } from '@/lib/rate';
import { appendAudit } from '@/lib/audit';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-only (matches .env.local)

function svc(){ return createClient(SUPABASE_URL, SERVICE_ROLE); }

async function getUserInfo(){
  const cookieStore = cookies();
  const supa = createServerClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string, {
    cookies: {
      get: (n)=> cookieStore.get(n)?.value,
      set: (n,v,o)=> cookieStore.set({ name:n, value:v, ...o }),
      remove: (n,o)=> cookieStore.set({ name:n, value:'', ...o, maxAge:0 })
    }
  });
  const { data: { user } } = await supa.auth.getUser();
  let email: string | null = null; let id: string | null = null; let role: string = 'free';
  if (user){
    id = user.id; email = user.email || null;
    const { data: prof } = await svc().from('profiles').select('role').eq('id', user.id).maybeSingle();
    role = prof?.role || 'free';
  }
  return { id, email, role } as const;
}

function clientIp(req: NextRequest){ return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || 'unknown'; }

export async function GET(req: NextRequest){
  const t0 = Date.now();
  const ip = clientIp(req);
  const rl = rateLimitCheck(`${ip}:GET:/api/admin/users`, { windowMs: 60_000, max: 60 });
  if (!rl.allowed) return NextResponse.json({ ok:false, error:'rate_limited', retryAfterMs: rl.resetMs }, { status:429, headers:{ 'X-RateLimit-Remaining': String(rl.remaining) } });
  try{
    const { id, email, role } = await getUserInfo();
    if (role !== 'admin') return NextResponse.json({ ok:false, error:'forbidden' }, { status:403 });

    const { data, error } = await svc().from('profiles').select('id,email,role').order('email');
    if (error) throw error;
    const res = NextResponse.json({ ok:true, result:{ users: data||[] } }, { status:200, headers:{ 'X-RateLimit-Remaining': String(rl.remaining) } });
    await appendAudit({ ts: Date.now(), ip, user:{ id, email }, path: '/api/admin/users', method:'GET', action:'list_users', ok:true, status:200, ms: Date.now()-t0 });
    return res;
  }catch(e:any){
    await appendAudit({ ts: Date.now(), ip, user: undefined, path:'/api/admin/users', method:'GET', action:'list_users', ok:false, status:500, ms: Date.now()-t0, meta:{ error: e?.message } });
    return NextResponse.json({ ok:false, error: e?.message || 'unknown error' }, { status:500 });
  }
}

export async function POST(req: NextRequest){
  const t0 = Date.now();
  const ip = clientIp(req);
  const rl = rateLimitCheck(`${ip}:POST:/api/admin/users`, { windowMs: 60_000, max: 20 });
  if (!rl.allowed) return NextResponse.json({ ok:false, error:'rate_limited', retryAfterMs: rl.resetMs }, { status:429, headers:{ 'X-RateLimit-Remaining': String(rl.remaining) } });
  const ctype = req.headers.get('content-type')||'';
  try{
    const { id, email, role } = await getUserInfo();
    if (role !== 'admin') return NextResponse.json({ ok:false, error:'forbidden' }, { status:403 });

    let targetEmail:string|undefined; let newRole:'free'|'pro'|'admin'|undefined;
    if (ctype.includes('application/json')){
      const body = await req.json(); targetEmail = body?.email; newRole = body?.role;
    } else {
      const form = await req.formData(); targetEmail = String(form.get('email')||''); newRole = form.get('role') as any;
    }
    if (!targetEmail || !newRole) return NextResponse.json({ ok:false, error:'email and role required' }, { status:400 });

    const { error } = await svc().from('profiles').update({ role: newRole }).eq('email', targetEmail);
    if (error) throw error;
    const res = NextResponse.json({ ok:true }, { status:200, headers:{ 'X-RateLimit-Remaining': String(rl.remaining) } });
    await appendAudit({ ts: Date.now(), ip, user:{ id, email }, path:'/api/admin/users', method:'POST', action:'set_role', ok:true, status:200, ms: Date.now()-t0, meta:{ targetEmail, newRole } });
    return res;
  }catch(e:any){
    await appendAudit({ ts: Date.now(), ip, user: undefined, path:'/api/admin/users', method:'POST', action:'set_role', ok:false, status:500, ms: Date.now()-t0, meta:{ error: e?.message } });
    return NextResponse.json({ ok:false, error: e?.message || 'unknown error' }, { status:500 });
  }
}
