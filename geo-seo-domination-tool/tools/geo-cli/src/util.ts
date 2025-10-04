import { spawn } from 'node:child_process';
import { resolve } from 'pathe';
import fetch from 'node-fetch';

export function baseUrl(opt?: string){
  const u = opt || process.env.GEO_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return u.replace(/\/$/, '');
}

export async function jget(url: string){ const r = await fetch(url, { headers: { 'Content-Type': 'application/json' } }); if(!r.ok) throw new Error(`GET ${url} -> ${r.status}`); return r.json(); }
export async function jpost(url: string, body: any){ const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if(!r.ok) throw new Error(`POST ${url} -> ${r.status}`); return r.json(); }

export function pwsh(args: string[], cwd?: string){
  return new Promise<{ code:number }>((resolveP)=>{
    const exe = process.platform === 'win32' ? 'powershell.exe' : 'pwsh';
    const p = spawn(exe, ['-NoProfile','-ExecutionPolicy','Bypass','-File', ...args], { stdio:'inherit', cwd });
    p.on('close', code=> resolveP({ code: code ?? 1 }));
  });
}

export function sh(cmd: string, args: string[], cwd?: string){
  return new Promise<{ code:number }>((resolveP)=>{
    const p = spawn(cmd, args, { stdio:'inherit', cwd });
    p.on('close', code=> resolveP({ code: code ?? 1 }));
  });
}

export function repoRoot(){ return resolve(process.cwd()); }
