import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { access } from 'node:fs/promises';
import { join } from 'pathe';

export type Check = 'ts'|'lint'|'test'|'next-build'|'docker-build';

function run(cmd: string, args: string[], cwd: string): Promise<{code:number, out:string, err:string}> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, shell: true });
    let out = ''; let err = '';
    child.stdout.on('data', d => out += d.toString());
    child.stderr.on('data', d => err += d.toString());
    child.on('close', code => resolve({ code: code ?? 1, out, err }));
  });
}

async function fileExists(p:string){ try{ await access(p); return true; } catch{ return false; } }

export async function postInstallCheck(repoRoot: string, checks: Check[]) {
  const results: Array<{check:Check, status:'passed'|'failed'|'skipped', log:string}> = [];

  // Discover convenient paths
  const webApp = join(repoRoot, 'web-app');
  const hasWebApp = existsSync(webApp);
  const webTsconfig = join(webApp, 'tsconfig.json');
  const rootTsconfig = join(repoRoot, 'tsconfig.json');
  const dockerCompose = join(repoRoot, 'infra', 'docker', 'compose.yml');

  for (const check of checks) {
    try {
      if (check === 'ts') {
        // Prefer web-app tsconfig if it exists, else root tsconfig, else skip
        const cfg = existsSync(webTsconfig) ? webTsconfig : (existsSync(rootTsconfig) ? rootTsconfig : null);
        if (!cfg) { results.push({ check, status:'skipped', log: 'No tsconfig found' }); continue; }
        const { code, out, err } = await run('npx', ['-y','typescript','tsc','-p', `"${cfg}"`, '--noEmit'], repoRoot);
        results.push({ check, status: code===0?'passed':'failed', log: out + (err? ('\n'+err):'') });
        continue;
      }

      if (check === 'lint') {
        // Try workspace lint first, then web-app lint, else skip
        const tryCmds = [
          ['npm',['run','lint']],
          hasWebApp ? ['npm',['run','-w','web-app','lint']] as const : null
        ].filter(Boolean) as Array<[string,string[]]>;
        if (tryCmds.length===0) { results.push({ check, status:'skipped', log:'No lint script' }); continue; }
        let done=false; let agg=''; let ok=false;
        for (const [c,a] of tryCmds) {
          const { code, out, err } = await run(c, a, repoRoot);
          agg += `> ${c} ${a.join(' ')}\n` + out + (err? ('\n'+err):'') + '\n';
          if (code===0) { ok=true; done=true; break; }
        }
        results.push({ check, status: ok?'passed':'failed', log: agg });
        continue;
      }

      if (check === 'next-build') {
        if (!hasWebApp) { results.push({ check, status:'skipped', log:'web-app/ not found' }); continue; }
        const { code, out, err } = await run('npm', ['run','-w','web-app','build'], repoRoot);
        results.push({ check, status: code===0?'passed':'failed', log: out + (err? ('\n'+err):'') });
        continue;
      }

      if (check === 'test') {
        // Try common variants, else skip
        const tryCmds: Array<[string,string[]]> = [ ['npm',['test','--','--ci']] , ['npm',['run','test']] ];
        let ran=false; let ok=false; let agg='';
        for (const [c,a] of tryCmds) {
          const { code, out, err } = await run(c, a, repoRoot);
          agg += `> ${c} ${a.join(' ')}\n` + out + (err? ('\n'+err):'') + '\n';
          ran = true; if (code===0) { ok=true; break; }
        }
        results.push({ check, status: ran ? (ok?'passed':'failed') : 'skipped', log: ran?agg:'No test script' });
        continue;
      }

      if (check === 'docker-build') {
        if (!existsSync(dockerCompose)) { results.push({ check, status:'skipped', log:'infra/docker/compose.yml not found' }); continue; }
        // Validate compose file (cheaper than building images)
        const { code, out, err } = await run('docker', ['compose','-f', `"${dockerCompose}"`, 'config'], repoRoot);
        results.push({ check, status: code===0?'passed':'failed', log: out + (err? ('\n'+err):'') });
        continue;
      }

      results.push({ check, status:'skipped', log:'Unknown check' });
    } catch (e:any) {
      results.push({ check, status:'failed', log: String(e?.message||e) });
    }
  }

  const passed = results.filter(r=>r.status==='passed').length;
  const failed = results.filter(r=>r.status==='failed').length;
  const skipped = results.filter(r=>r.status==='skipped').length;
  const summary = `passed:${passed} failed:${failed} skipped:${skipped}`;
  return { results, summary };
}
