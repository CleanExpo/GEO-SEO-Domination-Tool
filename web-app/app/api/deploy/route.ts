import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { resolve, join } from 'pathe';

const repoRoot = resolve(process.cwd(), '..', '..');
const composeFile = join(repoRoot, 'infra', 'docker', 'compose.yml');

function run(cmd: string, args: string[], cwd: string) {
  return new Promise<{ code:number; out:string; err:string }>((resolve) => {
    const child = spawn(cmd, args, { cwd, shell: true });
    let out = ''; let err = '';
    child.stdout.on('data', d => out += d.toString());
    child.stderr.on('data', d => err += d.toString());
    child.on('close', code => resolve({ code: code ?? 1, out, err }));
  });
}

const ALLOWED = new Set(['config','build','up','down','ps','logs']);

export async function POST(req: NextRequest) {
  try {
    const { action, params } = await req.json();
    if (!ALLOWED.has(action)) return NextResponse.json({ ok:false, error:'Unsupported action' }, { status: 400 });

    const baseArgs = ['compose','-f', `"${composeFile}"`];
    let args: string[] = [];

    switch (action) {
      case 'config': args = [...baseArgs, 'config']; break;
      case 'build': args = [...baseArgs, 'build']; break;
      case 'up': args = [...baseArgs, 'up', '-d']; break;
      case 'down': args = [...baseArgs, 'down']; break;
      case 'ps': args = [...baseArgs, 'ps']; break;
      case 'logs': {
        const svc = String(params?.service || '').trim();
        const tail = String(params?.tail || '200');
        args = [...baseArgs, 'logs', '--no-color', '--tail', tail];
        if (svc) args.push(svc);
        break;
      }
    }

    const { code, out, err } = await run('docker', args, repoRoot);
    return NextResponse.json({ ok: code===0, status: code, stdout: out, stderr: err }, { status: 200 });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
