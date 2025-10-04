#!/usr/bin/env node
import { Command } from 'commander';
import { baseUrl, jget, jpost, repoRoot } from './util.js';
import { runDoctor } from './doctor.js';
import { spawnSync } from 'node:child_process';

const program = new Command();
program
  .name('geo')
  .description('GEO CRM & MCP CLI (Vercel-like)')
  .version('0.1.5');

// ===== existing commands remain unchanged above/below ===== //

const bluegreen = program.command('bluegreen').description('Blue/Green deploy controls');

bluegreen
  .command('status')
  .option('--base-url <url>')
  .action(async (opts)=>{
    const b = baseUrl(opts.baseUrl); const r = await jpost(`${b}/api/bluegreen`, { action: 'status' }); console.log(JSON.stringify(r, null, 2));
  });

bluegreen
  .command('build')
  .requiredOption('--target <blue|green>')
  .option('--base-url <url>')
  .action(async (opts)=>{
    const b = baseUrl(opts.baseUrl); const r = await jpost(`${b}/api/bluegreen`, { action: 'build', target: opts.target }); console.log(JSON.stringify(r, null, 2));
  });

bluegreen
  .command('up')
  .requiredOption('--target <blue|green>')
  .option('--base-url <url>')
  .action(async (opts)=>{
    const b = baseUrl(opts.baseUrl); const r = await jpost(`${b}/api/bluegreen`, { action: 'up', target: opts.target }); console.log(JSON.stringify(r, null, 2));
  });

bluegreen
  .command('switch')
  .requiredOption('--target <blue|green>')
  .option('--base-url <url>')
  .action(async (opts)=>{
    const b = baseUrl(opts.baseUrl); const r = await jpost(`${b}/api/bluegreen`, { action: 'switch', target: opts.target }); console.log(JSON.stringify(r, null, 2));
  });

bluegreen
  .command('rollback')
  .option('--base-url <url>')
  .action(async (opts)=>{
    const b = baseUrl(opts.baseUrl); const r = await jpost(`${b}/api/bluegreen`, { action: 'rollback' }); console.log(JSON.stringify(r, null, 2));
  });

bluegreen
  .command('logs')
  .requiredOption('--target <blue|green>')
  .option('--tail <n>', '200')
  .option('--base-url <url>')
  .action(async (opts)=>{
    const b = baseUrl(opts.baseUrl); const r = await jpost(`${b}/api/bluegreen`, { action: 'logs', target: opts.target });
    const out = (r?.result?.stdout||'').split('\n').slice(-(Number(opts.tail)||200)).join('\n');
    console.log(out);
  });

// Doctor command
program
  .command('doctor')
  .description('Check system health and prerequisites')
  .action(async () => {
    await runDoctor();
  });

// Release helpers
function pwsh(cmd: string, args: string[]){
  const r = spawnSync('pwsh', ['-NoProfile','-ExecutionPolicy','Bypass','-File', cmd, ...args], { encoding:'utf8' });
  if ((r.status ?? 1) !== 0) { console.error(r.stderr||r.stdout); process.exit(r.status ?? 1); }
  process.stdout.write(r.stdout||'');
}

const rel = program.command('release').description('Release helpers');

rel
  .command('notes')
  .requiredOption('--repo <org/repo>')
  .requiredOption('--version <vX.Y.Z>')
  .option('--prev <tag>', 'previous tag (optional)')
  .action((opts)=>{
    pwsh('scripts/release/generate-notes.ps1', ['-Repo', opts.repo, '-Version', opts.version, ...(opts.prev? ['-PrevTag', opts.prev]:[]) ]);
  });

rel
  .command('tag')
  .requiredOption('--repo <org/repo>')
  .requiredOption('--version <vX.Y.Z>')
  .option('--prev <tag>')
  .option('--draft', 'create release as draft')
  .option('--target <branch>', 'target commitish', 'main')
  .action((opts)=>{
    const args = ['-Repo', opts.repo, '-Version', opts.version];
    if (opts.prev) args.push('-PrevTag', opts.prev);
    if (opts.draft) args.push('-Draft');
    args.push('-Target', opts.target);
    pwsh('scripts/release/tag-and-release.ps1', args);
  });

program.parseAsync(process.argv);
