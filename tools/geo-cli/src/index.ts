#!/usr/bin/env node
import { Command } from 'commander';
import { baseUrl, jget, jpost, pwsh, sh, repoRoot } from './util.js';
import { runDoctor } from './doctor.js';
import { setSecretKV, getSecretKV, listSecretsRedacted } from './secrets.js';

const program = new Command();
program
  .name('geo')
  .description('GEO CRM & MCP CLI (Vercel-like)')
  .version('0.1.2');

program
  .command('status')
  .description('Ping key endpoints to verify the stack is up')
  .option('--base-url <url>', 'CRM base URL (default env GEO_BASE_URL or http://localhost:3000)')
  .action(async (opts)=>{
    const b = baseUrl(opts.baseUrl);
    const targets = ['/api/health','/api/builds','/api/blueprints'];
    for (const t of targets){
      try { const r = await jget(`${b}${t}`); console.log('✓', t, r?.ok!==false ? 'OK' : 'WARN'); }
      catch(e:any){ console.log('✖', t, e.message); }
    }
  });

program
  .command('build')
  .description('Build MCP + Web (local)')
  .action(async ()=>{
    console.log('• Building MCP…');
    await sh(process.platform==='win32'?'npm.cmd':'npm',['run','build'], 'tools/geo-builders-mcp');
    console.log('• Building web-app…');
    await sh(process.platform==='win32'?'npm.cmd':'npm',['run','build'], 'web-app');
    console.log('✓ Build complete');
  });

program
  .command('env')
  .description('Write env values to web-app/.env.local (append)')
  .requiredOption('--set <k=v...>','One or more KEY=VALUE pairs (space separated)')
  .action(async (opts)=>{
    const fs = await import('node:fs');
    const path = await import('node:path');
    const file = path.join(repoRoot(),'web-app','.env.local');
    const lines = String(opts.set).split(/\s+/).filter(Boolean);
    const toAdd = lines.map((s:string)=> s.includes('=')? s : '');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, toAdd.join('\n')+'\n');
    console.log('✓ Updated', file);
  });

program
  .command('deploy')
  .description('Docker compose deploy via CRM API (config/build/up/down/ps/logs)')
  .argument('<verb>', 'config|build|up|down|ps|logs')
  .option('--args <args...>','extra args e.g. -d')
  .option('--base-url <url>')
  .action(async (verb, opts)=>{
    const b = baseUrl(opts.baseUrl);
    const res = await jpost(`${b}/api/deploy`, { action: verb, args: opts.args||[] });
    console.log(JSON.stringify(res, null, 2));
  });

program
  .command('link')
  .description('Create GitHub repo and link to Vercel project via CRM API')
  .requiredOption('--owner <owner>','GitHub org/user')
  .requiredOption('--repo <repo>','Repository name')
  .option('--vercel <name>','Vercel project name (defaults to repo)')
  .option('--private','Create repo as private', false)
  .option('--base-url <url>')
  .action(async (opts)=>{
    const b = baseUrl(opts.baseUrl);
    const r = await jpost(`${b}/api/autolink`, { owner: opts.owner, repo: opts.repo, private: !!opts.private, vercelProject: opts.vercel||opts.repo });
    console.log(JSON.stringify(r,null,2));
  });

program
  .command('mcp')
  .description('Run an MCP tool (list_builders | inspect_builder | preview_apply | apply_builder | post_install_check)')
  .requiredOption('--tool <name>')
  .option('--id <builderId>')
  .option('--variables <json>','JSON string of variables')
  .option('--engine <eta|handlebars>','Template engine','eta')
  .option('--strategy <safe-merge|overwrite>','Apply strategy','safe-merge')
  .action(async (opts)=>{
    const { spawn } = await import('node:child_process');
    const { join, resolve } = await import('pathe');
    const entry = join(resolve(process.cwd()), 'tools','geo-builders-mcp','dist','index.js');
    const payload:any = { id: opts.id, variables: opts.variables ? JSON.parse(opts.variables) : {}, engine: opts.engine, strategy: opts.strategy };
    const req = { id: String(Date.now()), tool: opts.tool, params: payload };
    const child = spawn('node', [entry], { stdio: ['pipe','pipe','inherit'] });
    child.stdin.write(JSON.stringify(req)+'\n'); child.stdin.end();
    child.stdout.on('data', d=> process.stdout.write(d));
    await new Promise(r=> child.on('close', r));
  });

program
  .command('blueprint')
  .description('List or run blueprints via CRM API')
  .option('--run <id>','Run a blueprint by id')
  .option('--owner <owner>')
  .option('--repo <repo>')
  .option('--vercel <name>')
  .option('--no-autolink','Disable autolink')
  .option('--no-deploy','Disable first deploy')
  .option('--base-url <url>')
  .action( async (opts)=>{
    const b = baseUrl(opts.baseUrl);
    if (!opts.run){ const r = await jget(`${b}/api/blueprints`); console.log(JSON.stringify(r,null,2)); return; }
    const body:any = { id: opts.run, autolink: opts.autolink!==false, deploy: opts.deploy!==false };
    if (body.autolink){ body.githubOwner = opts.owner; body.githubRepo = opts.repo; body.vercelProject = opts.vercel||opts.repo; }
    const r = await jpost(`${b}/api/blueprints`, body); console.log(JSON.stringify(r,null,2));
  });

program
  .command('release')
  .description('Trigger Auto Merge Release workflow via PowerShell script')
  .option('--repo <org/repo>','ORG/REPO slug')
  .option('--release-branch <name>','release branch','release/geo-mcp-v1')
  .option('--target-branch <name>','target branch','main')
  .action(async (opts)=>{
    const script = 'scripts/trigger-workflow.ps1';
    const args = [script];
    if (opts.repo) { args.push('-Repo', opts.repo); }
    if (opts.releaseBranch) { args.push('-ReleaseBranch', opts.releaseBranch); }
    if (opts.targetBranch) { args.push('-TargetBranch', opts.targetBranch); }
    const { code } = await pwsh(args);
    if (code!==0) process.exit(code);
  });

program
  .command('logs')
  .description('Tail docker compose service logs via CRM API')
  .option('--service <name>','Service filter')
  .option('--tail <n>','Tail count','200')
  .option('--base-url <url>')
  .action(async (opts)=>{
    const b = baseUrl(opts.baseUrl);
    const r = await jpost(`${b}/api/deploy`, { action: 'logs', args: ['--tail', String(opts.tail||'200'), ...(opts.service? [opts.service] : [])] });
    console.log(JSON.stringify(r, null, 2));
  });

program
  .command('init')
  .description('Scaffold a SaaS starter via blueprint (with autolink + first deploy)')
  .requiredOption('--id <blueprintId>','Blueprint id (e.g., saas-starter)')
  .requiredOption('--owner <owner>')
  .requiredOption('--repo <repo>')
  .option('--vercel <name>')
  .option('--base-url <url>')
  .action(async (opts)=>{
    const b = baseUrl(opts.baseUrl);
    const r = await jpost(`${b}/api/blueprints`, { id: opts.id, autolink: true, deploy: true, githubOwner: opts.owner, githubRepo: opts.repo, vercelProject: opts.vercel||opts.repo });
    console.log(JSON.stringify(r,null,2));
  });

program
  .command('doctor')
  .description('Run local + remote health checks and suggest fixes')
  .option('--base-url <url>')
  .action(async (opts)=> runDoctor(opts));

program
  .command('secrets')
  .description('Manage local secrets (gitignored): github.token, vercel.token, supabase.url, supabase.anonKey')
  .option('--set <KEY=VALUE>', 'Set a secret (e.g., github_token=ghp_xxx, supabase_url=https://...)')
  .option('--get <KEY>', 'Get a secret by key (prints raw value)')
  .option('--list', 'List secrets redacted')
  .action((opts)=>{
    if (opts.set){
      const [k,v] = String(opts.set).split('=',2);
      if (!k || v===undefined) { console.error('Provide KEY=VALUE'); process.exit(1); }
      const fp = setSecretKV(k.replace('.', '_'), v);
      console.log('✓ Saved', k, '→', fp);
      return;
    }
    if (opts.get){
      const val = getSecretKV(String(opts.get).replace('.', '_'));
      if (val==null) { process.exitCode = 1; return; }
      process.stdout.write(String(val));
      return;
    }
    const j = listSecretsRedacted();
    console.log(JSON.stringify(j, null, 2));
  });

program.parseAsync(process.argv);
