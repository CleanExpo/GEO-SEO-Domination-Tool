import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export type Role = 'free'|'pro'|'admin';
export type GuardOptions = { allowed: Role[]; onForbidden?: () => any };

async function getRole(req: NextRequest): Promise<{ email: string|null; role: Role }>{
  const supa = createServerClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_ANON_KEY as string, { cookies: { get: (n)=> req.cookies.get(n)?.value, set(){}, remove(){} } });
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return { email: null, role: 'free' };
  // ask roles API (server-side) to avoid exposing service role here
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/roles`, { headers: { cookie: req.headers.get('cookie')||'' } } as any);
  const j = await res.json().catch(()=>null);
  const role = (j?.result?.role as Role) || 'free';
  return { email: user.email || null, role };
}

export async function guard(req: NextRequest, opts: GuardOptions){
  const me = await getRole(req);
  if (!opts.allowed.includes(me.role)){
    const res = opts.onForbidden?.();
    if (res) return res;
    return NextResponse.json({ ok:false, error:'forbidden', role: me.role }, { status: 403 });
  }
  return null; // allowed
}

export function requireMethod(req: NextRequest, methods: string[]){
  if (!methods.includes(req.method)){
    return NextResponse.json({ ok:false, error:'method_not_allowed' }, { status: 405, headers: { 'Allow': methods.join(', ') } });
  }
  return null;
}
