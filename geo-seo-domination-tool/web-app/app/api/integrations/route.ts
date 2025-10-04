import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'pathe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function root(){ return resolve(process.cwd(), '..', '..'); }
function secretsDir(){ return join(root(), 'server','secrets'); }
function secretsPath(){ return join(secretsDir(), 'integrations.local.json'); }

async function readSecrets(){
  const p = secretsPath();
  let fileSecrets = { github:{token:''}, vercel:{token:''}, supabase:{url:'', anonKey:''} };

  if(existsSync(p)){
    try{ fileSecrets = JSON.parse(await readFile(p, 'utf8')); }catch{}
  }

  // Merge with environment variables (env vars take precedence)
  return {
    github: { token: process.env.GITHUB_TOKEN || fileSecrets.github?.token || '' },
    vercel: { token: process.env.VERCEL_TOKEN || fileSecrets.vercel?.token || '' },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || fileSecrets.supabase?.url || '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fileSecrets.supabase?.anonKey || ''
    }
  };
}

async function writeSecrets(s: any){
  await mkdir(secretsDir(), { recursive:true });
  const payload = {
    github: { token: s?.github?.token ?? '' },
    vercel: { token: s?.vercel?.token ?? '' },
    supabase: { url: s?.supabase?.url ?? '', anonKey: s?.supabase?.anonKey ?? '' }
  };
  await writeFile(secretsPath(), JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

async function checkGitHub(token?: string){
  if(!token) return { ok:false, why:'missing' };
  try{
    const r = await fetch('https://api.github.com/user', { headers:{ Authorization:`Bearer ${token}`, 'User-Agent':'geo-crm' } });
    return { ok:r.ok, status:r.status };
  }catch(e:any){ return { ok:false, why:e?.message||'fetch_error' }; }
}

async function checkVercel(token?: string){
  if(!token) return { ok:false, why:'missing' };
  try{
    const r = await fetch('https://api.vercel.com/v2/user', { headers:{ Authorization:`Bearer ${token}` } });
    return { ok:r.ok, status:r.status };
  }catch(e:any){ return { ok:false, why:e?.message||'fetch_error' }; }
}

async function checkSupabase(url?: string, anon?: string){
  if(!url) return { ok:false, why:'missing_url' };
  try{
    const u = new URL('/auth/v1/health', url);
    const r = await fetch(u.toString(), { headers: anon? { apikey: anon } : {} });
    return { ok:r.ok, status:r.status };
  }catch(e:any){ return { ok:false, why:e?.message||'fetch_error' }; }
}

export async function GET(){
  const s = await readSecrets();
  return NextResponse.json({ ok:true, secrets:{
    github: { has:Boolean(s.github?.token) },
    vercel: { has:Boolean(s.vercel?.token) },
    supabase: { has:Boolean(s.supabase?.url && s.supabase?.anonKey) }
  }});
}

export async function POST(req: NextRequest){
  const body = await req.json().catch(()=>({}));
  const action = String(body.action||'').trim();
  try{
    if(action==='save_tokens'){
      const saved = await writeSecrets({
        github: { token: body.github_token ?? '' },
        vercel: { token: body.vercel_token ?? '' },
        supabase: { url: body.supabase_url ?? '', anonKey: body.supabase_anonKey ?? '' }
      });
      return NextResponse.json({ ok:true, saved:{
        github: { has:Boolean(saved.github.token) },
        vercel: { has:Boolean(saved.vercel.token) },
        supabase: { has:Boolean(saved.supabase.url && saved.supabase.anonKey) }
      }});
    }
    if(action==='status'){
      const s = await readSecrets();
      const [gh, vc, sb] = await Promise.all([
        checkGitHub(s.github?.token),
        checkVercel(s.vercel?.token),
        checkSupabase(s.supabase?.url, s.supabase?.anonKey)
      ]);
      return NextResponse.json({ ok:true, status:{ github:gh, vercel:vc, supabase:sb } });
    }
    return NextResponse.json({ ok:false, error:'unknown action' }, { status:400 });
  }catch(e:any){
    return NextResponse.json({ ok:false, error: e?.message||'error' }, { status:500 });
  }
}
