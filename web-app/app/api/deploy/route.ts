import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'pathe';

const repoRoot = resolve(process.cwd(), '..', '..');
const composeFileLocal = join(repoRoot, 'infra', 'docker', 'compose.yml');
const secretsDir = join(repoRoot, 'server', 'secrets');
const deploySecrets = join(secretsDir, 'deploy.local.json');

function run(cmd: string, args: string[], cwd: string) {
  return new Promise<{ code:number; out:string; err:string }>((resolve) => {
    const child = spawn(cmd, args, { cwd, shell: true });
    let out = ''; let err = '';
    child.stdout.on('data', d => out += d.toString());
    child.stderr.on('data', d => err += d.toString());
    child.on('close', code => resolve({ code: code ?? 1, out, err }));
  });
}

async function saveDeployConfig(obj: any) {
  if (!existsSync(secretsDir)) await mkdir(secretsDir, { recursive: true });
  await writeFile(deploySecrets, JSON.stringify(obj, null, 2), 'utf8');
}
async function loadDeployConfig() {
  if (!existsSync(deploySecrets)) return { host:'', user:'', port:22, composePath:'/srv/app/compose.yml', keyPath:'', extraSshArgs:'' };
  try { return JSON.parse(await readFile(deploySecrets,'utf8')); } catch { return { host:'', user:'', port:22, composePath:'/srv/app/compose.yml', keyPath:'', extraSshArgs:'' }; }
}

function sshArgs(cfg: any, remoteCmd: string) {
  const args: string[] = ['-p', String(cfg.port || 22)];
  if (cfg.keyPath) args.push('-i', cfg.keyPath);
  if (cfg.extraSshArgs) args.push(...String(cfg.extraSshArgs).split(' ').filter(Boolean));
  args.push(`${cfg.user}@${cfg.host}`, remoteCmd);
  return args;
}

const LOCAL_ALLOWED = new Set(['config','build','up','down','ps','logs']);
const SSH_ALLOWED = LOCAL_ALLOWED; // same verbs

export async function POST(req: NextRequest) {
  try {
    const { action, params } = await req.json();

    // ---- config endpoints ----
    if (action === 'save_ssh') {
      const prev = await loadDeployConfig();
      const next = { ...prev, ...params };
      await saveDeployConfig(next);
      return NextResponse.json({ ok:true, result:{ saved:true, config: next } }, { status:200 });
    }
    if (action === 'status_ssh') {
      const cfg = await loadDeployConfig();
      if (!cfg.host || !cfg.user) return NextResponse.json({ ok:false, error:'Missing host/user in deploy config' }, { status:400 });
      const echoCmd = 'echo __ok__';
      const { code, out, err } = await run('ssh', sshArgs(cfg, echoCmd), repoRoot);
      const ok = code===0 && out.includes('__ok__');
      return NextResponse.json({ ok, status:code, stdout:out, stderr:err, config:{ host: cfg.host, user: cfg.user, port: cfg.port } }, { status:200 });
    }

    // ---- local docker compose ----
    if (params?.target === 'local' || (!params?.target && LOCAL_ALLOWED.has(action))) {
      if (!LOCAL_ALLOWED.has(action)) return NextResponse.json({ ok:false, error:'Unsupported local action' }, { status:400 });
      const baseArgs = ['compose','-f', `"${composeFileLocal}"`];
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
    }

    // ---- ssh docker compose ----
    if (params?.target === 'ssh') {
      if (!SSH_ALLOWED.has(action)) return NextResponse.json({ ok:false, error:'Unsupported ssh action' }, { status:400 });
      const cfg = await loadDeployConfig();
      if (!cfg.host || !cfg.user) return NextResponse.json({ ok:false, error:'SSH not configured. Call save_ssh first.' }, { status:400 });

      const base = `docker compose -f \\"${(params?.composePath || cfg.composePath)}\\"`;
      let cmd = base;
      switch (action) {
        case 'config': cmd = `${base} config`; break;
        case 'build': cmd = `${base} build`; break;
        case 'up': cmd = `${base} up -d`; break;
        case 'down': cmd = `${base} down`; break;
        case 'ps': cmd = `${base} ps`; break;
        case 'logs': {
          const svc = String(params?.service || '').trim();
          const tail = String(params?.tail || '200');
          cmd = `${base} logs --no-color --tail ${tail}${svc?(' '+svc):''}`;
          break;
        }
      }
      const { code, out, err } = await run('ssh', sshArgs(cfg, cmd), repoRoot);
      return NextResponse.json({ ok: code===0, status: code, stdout: out, stderr: err, host: cfg.host }, { status: 200 });
    }

    return NextResponse.json({ ok:false, error:'Unsupported action or target' }, { status:400 });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || 'Unknown error' }, { status:500 });
  }
}
