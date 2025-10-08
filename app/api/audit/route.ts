import { NextRequest, NextResponse } from 'next/server';
import { readAudit } from '@/lib/audit';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin(req: NextRequest){
  const cookieStore = await cookies();
  const supa = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    }
  });
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return { ok:false as const };
  const { data: prof } = await supa.from('profiles').select('role,email').eq('id', user.id).maybeSingle();
  if ((prof?.role||'free') !== 'admin') return { ok:false as const };
  return { ok:true as const };
}

export async function GET(req: NextRequest){
  const admin = await requireAdmin(req);
  if (!admin.ok) return NextResponse.json({ ok:false, error:'forbidden' }, { status:403 });
  const limit = Number(new URL(req.url).searchParams.get('limit')||'500');
  const events = await readAudit(Math.min(Math.max(limit, 1), 2000));
  return NextResponse.json({ ok:true, result:{ events } }, { status:200 });
}
