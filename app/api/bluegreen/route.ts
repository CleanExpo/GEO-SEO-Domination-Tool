import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'pathe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Target = 'blue' | 'green';

function root(){ return resolve(process.cwd(), '..', '..'); }
function composeFile(){ return join(root(), 'infra','docker','compose.bluegreen.yml'); }
function nginxActive(){ return join(root(), 'infra','docker','nginx','conf.d','active.conf'); }
function nginxTpl(){ return join(root(), 'infra','docker','nginx','conf.d','active.conf.tpl'); }

function sh(cmd: string, args: string[], cwd?: string){
  const r = spawnSync(cmd, args, { encoding:'utf8', cwd });
  return { status: r.status ?? 1, stdout: r.stdout || '', stderr: r.stderr || '' };
}

async function switchTo(target: Target){
  const tpl = await readFile(nginxTpl(), 'utf8');
  const cfg = tpl.replace('{{TARGET}}', target);
  await writeFile(nginxActive(), cfg, 'utf8');
  // reload nginx in the reverse_proxy container
  const reload = sh('docker', ['exec','geo_reverse_proxy','nginx','-s','reload']);
  return reload;
}

function status(){
  // Read active.conf to detect current target
  const active = existsSync(nginxActive()) ? spawnSync('type', [nginxActive()], { shell: true, encoding:'utf8' }).stdout : '';
  const current: Target | null = active.includes('geo_web_green') ? 'green' : active.includes('geo_web_blue') ? 'blue' : null;
  // Show running containers
  const ps = sh('docker', ['compose','-f', composeFile(), 'ps']);
  return { current, ps: ps.stdout };
}

export async function POST(req: NextRequest){
  const body = await req.json().catch(()=>({}));
  const action = String(body.action||'').trim();
  const target = (String(body.target||'blue').toLowerCase() as Target);

  if (!existsSync(composeFile())){
    return NextResponse.json({ ok:false, error:'compose.bluegreen.yml not found' }, { status:400 });
  }

  try{
    if (action === 'status'){
      return NextResponse.json({ ok:true, result: status() });
    }

    if (action === 'build'){
      const r = sh('docker',['compose','-f', composeFile(), 'build', `web_${target}`]);
      return NextResponse.json({ ok: r.status===0, result: r, target });
    }

    if (action === 'up'){
      const r = sh('docker',['compose','-f', composeFile(), 'up','-d', `web_${target}`, 'reverse_proxy']);
      return NextResponse.json({ ok: r.status===0, result: r, target });
    }

    if (action === 'switch'){
      const r = await switchTo(target);
      const st = status();
      return NextResponse.json({ ok: r.status===0, result: r, status: st, target });
    }

    if (action === 'rollback'){
      const current = status().current || 'blue';
      const back: Target = current === 'blue' ? 'green' : 'blue';
      const r = await switchTo(back);
      const st = status();
      return NextResponse.json({ ok: r.status===0, result: r, status: st, target: back });
    }

    if (action === 'logs'){
      const svc = `web_${target}`;
      const r = sh('docker',['compose','-f', composeFile(), 'logs','--tail','200', svc]);
      return NextResponse.json({ ok: r.status===0, result: r, target });
    }

    return NextResponse.json({ ok:false, error:'unknown action' }, { status:400 });
  }catch(e:any){
    return NextResponse.json({ ok:false, error: e?.message || 'error' }, { status:500 });
  }
}
