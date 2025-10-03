import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import { resolve, join } from 'pathe';

const repoRoot = resolve(process.cwd(), '..', '..');
const secretsDir = join(repoRoot, 'server', 'secrets');
const deploySecrets = join(secretsDir, 'deploy.local.json');
const tempDir = join(repoRoot, 'server', 'temp');
const deployIgnore = join(repoRoot, '.deployignore');

function run(cmd: string, args: string[], cwd: string) {
  return new Promise<{ code:number; out:string; err:string }>((resolve) => {
    const child = spawn(cmd, args, { cwd, shell: true });
    let out = ''; let err = '';
    child.stdout.on('data', d => out += d.toString());
    child.stderr.on('data', d => err += d.toString());
    child.on('close', code => resolve({ code: code ?? 1, out, err }));
  });
}

async function loadDeployConfig() {
  if (!existsSync(deploySecrets)) return { host:'', user:'', port:22, composePath:'/srv/app/compose.yml', keyPath:'', extraSshArgs:'', remotePath:'/srv/app' };
  try { return JSON.parse(await fs.readFile(deploySecrets,'utf8')); } catch { return { host:'', user:'', port:22, composePath:'/srv/app/compose.yml', keyPath:'', extraSshArgs:'', remotePath:'/srv/app' }; }
}
async function saveDeployConfig(obj: any) {
  if (!existsSync(secretsDir)) await fs.mkdir(secretsDir, { recursive: true });
  await fs.writeFile(deploySecrets, JSON.stringify(obj, null, 2), 'utf8');
}

function sshArgs(cfg: any, remoteCmd: string) {
  const args: string[] = ['-p', String(cfg.port || 22)];
  if (cfg.keyPath) args.push('-i', cfg.keyPath);
  if (cfg.extraSshArgs) args.push(...String(cfg.extraSshArgs).split(' ').filter(Boolean));
  args.push(`${cfg.user}@${cfg.host}`, remoteCmd);
  return args;
}

function rsyncArgs(cfg:any, local:string, remote:string, extra:string[] = []) {
  const args: string[] = ['-az', '--delete'];
  if (existsSync(deployIgnore)) args.push('--exclude-from', deployIgnore);
  // SSH transport
  const sshParts = ['ssh', '-p', String(cfg.port||22)];
  if (cfg.keyPath) sshParts.push('-i', cfg.keyPath);
  if (cfg.extraSshArgs) sshParts.push(...String(cfg.extraSshArgs).split(' ').filter(Boolean));
  args.push('-e', sshParts.join(' '));
  args.push(local.endsWith('/') ? local : local + '/');
  args.push(`${cfg.user}@${cfg.host}:${remote.endsWith('/')?remote:remote+'/'}`);
  if (extra.length) args.push(...extra);
  return args;
}

export async function POST(req: NextRequest) {
  try {
    const { action, params } = await req.json();
    const cfg = await loadDeployConfig();

    if (action === 'save_remote_path') {
      const next = { ...cfg, remotePath: params?.remotePath || '/srv/app' };
      await saveDeployConfig(next);
      return NextResponse.json({ ok:true, result:{ saved:true, config: { host: next.host, user: next.user, remotePath: next.remotePath } } }, { status:200 });
    }

    if (action === 'dry_run') {
      // Prefer rsync if present
      const { code: whichCode } = await run(process.platform==='win32'?'where':'which',['rsync'], repoRoot);
      if (whichCode !== 0) return NextResponse.json({ ok:false, error:'rsync not found; use sync (bundle+scp) instead' }, { status:200 });
      const args = rsyncArgs(cfg, repoRoot, params?.remotePath || cfg.remotePath || '/srv/app', ['--dry-run']);
      const { code, out, err } = await run('rsync', args, repoRoot);
      return NextResponse.json({ ok: code===0, status: code, stdout: out, stderr: err, mode:'rsync' }, { status:200 });
    }

    if (action === 'sync_rsync') {
      const { code: whichCode } = await run(process.platform==='win32'?'where':'which',['rsync'], repoRoot);
      if (whichCode !== 0) return NextResponse.json({ ok:false, error:'rsync not found; use sync_bundle instead' }, { status:200 });
      const args = rsyncArgs(cfg, repoRoot, params?.remotePath || cfg.remotePath || '/srv/app');
      const { code, out, err } = await run('rsync', args, repoRoot);
      return NextResponse.json({ ok: code===0, status: code, stdout: out, stderr: err, mode:'rsync' }, { status:200 });
    }

    if (action === 'make_bundle') {
      if (!existsSync(tempDir)) await fs.mkdir(tempDir, { recursive: true });
      const stamp = Date.now();
      const archive = join(tempDir, `deploy-${stamp}.zip`);
      // Cross-platform: prefer PowerShell Compress-Archive on Windows; tar elsewhere
      if (process.platform === 'win32') {
        const ps = [
          'powershell','-NoProfile','-Command',
          `Compress-Archive -Path * -DestinationPath \\"${archive}\\" -Force -CompressionLevel Optimal`
        ];
        const { code, out, err } = await run(ps[0], ps.slice(1), repoRoot);
        if (code!==0) return NextResponse.json({ ok:false, error: err || out }, { status:200 });
      } else {
        const { code, out, err } = await run('bash',[ '-lc', `tar --exclude-from=.deployignore -czf ${archive.replace(/\\.zip$/,'')}.tar.gz -C . . && echo TAR_OK` ], repoRoot);
        if (code!==0 || !out.includes('TAR_OK')) return NextResponse.json({ ok:false, error: err || out }, { status:200 });
        return NextResponse.json({ ok:true, result:{ bundle: `${archive.replace(/\\.zip$/,'')}.tar.gz` } }, { status:200 });
      }
      return NextResponse.json({ ok:true, result:{ bundle: archive } }, { status:200 });
    }

    if (action === 'upload_bundle') {
      const bundle = String(params?.bundle||'');
      if (!bundle) return NextResponse.json({ ok:false, error:'Missing bundle path' }, { status:400 });
      if (!existsSync(bundle)) return NextResponse.json({ ok:false, error:'Bundle not found' }, { status:400 });
      const remote = (params?.remotePath || cfg.remotePath || '/srv/app').replace(/\/$/,'');
      const args: string[] = [];
      if (cfg.port) { args.push('-P', String(cfg.port)); }
      if (cfg.keyPath) { args.push('-i', cfg.keyPath); }
      if (cfg.extraSshArgs) { args.push(...String(cfg.extraSshArgs).split(' ').filter(Boolean)); }
      args.push(bundle);
      args.push(`${cfg.user}@${cfg.host}:${remote}/`);
      const { code, out, err } = await run('scp', args, repoRoot);
      return NextResponse.json({ ok: code===0, status: code, stdout: out, stderr: err, dest:`${remote}/` }, { status:200 });
    }

    if (action === 'unpack_bundle') {
      const remote = (params?.remotePath || cfg.remotePath || '/srv/app').replace(/\/$/,'');
      const bundleName = String(params?.remoteBundle || '').trim();
      if (!bundleName) return NextResponse.json({ ok:false, error:'Missing remoteBundle (filename on server)' }, { status:400 });
      let cmd = '';
      if (bundleName.endsWith('.tar.gz')) {
        cmd = `mkdir -p \\"${remote}\\" && tar -xzf \\"${remote}/${bundleName}\\" -C \\"${remote}\\"`;
      } else {
        // unzip via PowerShell/bsdtar fallback
        cmd = `mkdir -p \\"${remote}\\" && tar -xf \\"${remote}/${bundleName}\\" -C \\"${remote}\\"`;
      }
      const { code, out, err } = await run('ssh', sshArgs(cfg, cmd), repoRoot);
      return NextResponse.json({ ok: code===0, status: code, stdout: out, stderr: err, remote }, { status:200 });
    }

    if (action === 'sync_all') {
      // 1) make bundle, 2) scp, 3) unpack, 4) docker compose up
      const remote = (params?.remotePath || cfg.remotePath || '/srv/app').replace(/\/$/,'');
      // make bundle
      const time = Date.now();
      const bundleBase = join(tempDir, `deploy-${time}`);
      if (!existsSync(tempDir)) await fs.mkdir(tempDir, { recursive: true });
      let localBundle = '';
      if (process.platform === 'win32') {
        localBundle = bundleBase + '.zip';
        const ps = [ 'powershell','-NoProfile','-Command', `Compress-Archive -Path * -DestinationPath \\"${localBundle}\\" -Force -CompressionLevel Optimal` ];
        let res = await run(ps[0], ps.slice(1), repoRoot); if (res.code!==0) return NextResponse.json({ ok:false, step:'bundle', ...res }, { status:200 });
      } else {
        localBundle = bundleBase + '.tar.gz';
        let res = await run('bash',[ '-lc', `tar --exclude-from=.deployignore -czf ${localBundle} -C . .` ], repoRoot); if (res.code!==0) return NextResponse.json({ ok:false, step:'bundle', ...res }, { status:200 });
      }
      // upload
      const up = await (async () => {
        const args: string[] = [];
        if (cfg.port) args.push('-P', String(cfg.port));
        if (cfg.keyPath) args.push('-i', cfg.keyPath);
        if (cfg.extraSshArgs) args.push(...String(cfg.extraSshArgs).split(' ').filter(Boolean));
        args.push(localBundle);
        args.push(`${cfg.user}@${cfg.host}:${remote}/`);
        return run('scp', args, repoRoot);
      })();
      if (up.code!==0) return NextResponse.json({ ok:false, step:'upload', ...up }, { status:200 });
      // unpack
      const remoteName = localBundle.split(/[\\\/]/).pop() as string;
      const unpackCmd = localBundle.endsWith('.tar.gz')
        ? `mkdir -p \\"${remote}\\" && tar -xzf \\"${remote}/${remoteName}\\" -C \\"${remote}\\"`
        : `mkdir -p \\"${remote}\\" && tar -xf \\"${remote}/${remoteName}\\" -C \\"${remote}\\"`;
      const unpack = await run('ssh', sshArgs(cfg, unpackCmd), repoRoot);
      if (unpack.code!==0) return NextResponse.json({ ok:false, step:'unpack', ...unpack }, { status:200 });
      // compose up
      const composePath = params?.composePath || cfg.composePath || '/srv/app/compose.yml';
      const upCmd = `docker compose -f \\"${composePath}\\" up -d`;
      const upRes = await run('ssh', sshArgs(cfg, upCmd), repoRoot);
      return NextResponse.json({ ok: upRes.code===0, step:'done', stdout: upRes.out, stderr: upRes.err, remoteBundle: remoteName }, { status:200 });
    }

    return NextResponse.json({ ok:false, error:'Unsupported action' }, { status:400 });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || 'Unknown error' }, { status:500 });
  }
}
