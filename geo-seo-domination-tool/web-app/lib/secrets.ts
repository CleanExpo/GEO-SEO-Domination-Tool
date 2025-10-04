import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'pathe';

const ROOT = resolve(process.cwd(), '..', '..');
const LOCAL_FILE = join(ROOT, 'server', 'secrets', 'integrations.local.json');

export type SecretBag = {
  github?: { token?: string } | null,
  vercel?: { token?: string } | null,
  supabase?: { url?: string, anonKey?: string } | null,
  [k: string]: any
};

export function readLocal(): SecretBag | null {
  try { if (!existsSync(LOCAL_FILE)) return null; return JSON.parse(readFileSync(LOCAL_FILE, 'utf8')); } catch { return null; }
}

export function writeLocal(mut: (bag: SecretBag)=>void): { path: string }{
  const dir = join(ROOT, 'server', 'secrets');
  try { mkdirSync(dir, { recursive: true }); } catch {}
  let bag: SecretBag = readLocal() || {};
  mut(bag);
  writeFileSync(LOCAL_FILE, JSON.stringify(bag, null, 2));
  return { path: LOCAL_FILE };
}

export function getGitHubToken(): string | null {
  return process.env.GITHUB_TOKEN
    || (readLocal()?.github?.token || null);
}

export function getVercelToken(): string | null {
  return process.env.VERCEL_TOKEN
    || (readLocal()?.vercel?.token || null);
}

export function getSupabase(): { url?: string, anonKey?: string }{
  const env = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  };
  const file = readLocal()?.supabase || {};
  return { url: env.url || file.url, anonKey: env.anonKey || file.anonKey };
}

export function setSecret(key: string, value: string){
  const [ns, field] = key.split('_', 2);
  writeLocal(bag => {
    switch ((ns||'').toLowerCase()){
      case 'github': bag.github = { ...(bag.github||{}), token: value }; break;
      case 'vercel': bag.vercel = { ...(bag.vercel||{}), token: value }; break;
      case 'supabase':
        if (field?.toLowerCase() === 'url'){
          bag.supabase = { ...(bag.supabase||{}), url: value };
        } else { // anon or anonKey
          bag.supabase = { ...(bag.supabase||{}), anonKey: value };
        }
        break;
      default:
        (bag as any)[key] = value; // generic storage
    }
  });
}

export function listSecrets(){
  const bag = readLocal() || {};
  const redacted: any = JSON.parse(JSON.stringify(bag));
  if (redacted.github?.token) redacted.github.token = '***';
  if (redacted.vercel?.token) redacted.vercel.token = '***';
  if (redacted.supabase?.anonKey) redacted.supabase.anonKey = '***';
  return { file: LOCAL_FILE, secrets: redacted };
}
