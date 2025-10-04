import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'pathe';

function filePath(){ return join(resolve(process.cwd()), 'server','secrets','integrations.local.json'); }

export function ensureFile(){ const dir = join(resolve(process.cwd()), 'server','secrets'); try{ mkdirSync(dir, { recursive: true }); }catch{} }

export function readBag(): any { try { const f = filePath(); if (!existsSync(f)) return {}; return JSON.parse(readFileSync(f, 'utf8')); } catch { return {}; } }

export function writeBag(mut:(bag:any)=>void){ ensureFile(); const f = filePath(); const bag = readBag(); mut(bag); writeFileSync(f, JSON.stringify(bag, null, 2)); return f; }

export function setSecretKV(key:string, value:string){
  const [ns, field] = key.split('_',2);
  return writeBag(bag => {
    switch((ns||'').toLowerCase()){
      case 'github': bag.github = { ...(bag.github||{}), token: value }; break;
      case 'vercel': bag.vercel = { ...(bag.vercel||{}), token: value }; break;
      case 'supabase':
        if ((field||'').toLowerCase()==='url') bag.supabase = { ...(bag.supabase||{}), url: value };
        else bag.supabase = { ...(bag.supabase||{}), anonKey: value };
        break;
      default: (bag as any)[key] = value;
    }
  });
}

export function getSecretKV(key:string){
  const bag = readBag();
  const [ns, field] = key.split('_',2);
  switch((ns||'').toLowerCase()){
    case 'github': return bag.github?.token || null;
    case 'vercel': return bag.vercel?.token || null;
    case 'supabase': return (field||'').toLowerCase()==='url' ? (bag.supabase?.url||null) : (bag.supabase?.anonKey||null);
    default: return bag[key] ?? null;
  }
}

export function listSecretsRedacted(){
  const bag = readBag();
  const red = JSON.parse(JSON.stringify(bag));
  if (red.github?.token) red.github.token = '***';
  if (red.vercel?.token) red.vercel.token = '***';
  if (red.supabase?.anonKey) red.supabase.anonKey = '***';
  return { path: filePath(), secrets: red };
}
