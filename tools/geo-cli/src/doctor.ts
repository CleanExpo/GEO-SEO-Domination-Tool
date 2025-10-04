import { existsSync } from 'node:fs';
import { join, resolve } from 'pathe';
import { spawnSync } from 'node:child_process';
import { baseUrl, jget } from './util.js';

export async function runDoctor(opts:{ baseUrl?:string }){
  const issues: string[] = [];
  function log(s:string){ console.log(s); }

  // Local checks
  log('• Checking Node...');
  log(`  Node version: ${process.version}`);

  log('• Checking Docker...');
  try { const d = spawnSync('docker',['--version'],{encoding:'utf8'}); if(d.status!==0){ issues.push('Docker not available in PATH'); } log(`  ${ (d.stdout||d.stderr||'n/a').trim() }`);} catch{ issues.push('Docker not installed'); }

  const root = resolve(process.cwd());
  const mcp = join(root,'tools','geo-builders-mcp','dist','index.js');
  log('• Checking MCP dist...');
  if (!existsSync(mcp)) { issues.push('MCP dist missing. Run: cd tools/geo-builders-mcp && npm run build'); }
  log(`  ${existsSync(mcp)?'found':'missing'} → ${mcp}`);

  // Remote/CRM checks
  const b = baseUrl(opts.baseUrl);
  log(`• Fetching ${b}/api/health ...`);
  try {
    const j = await jget(`${b}/api/health`);
    log(`  Overall: ${j.ok?'PASS':'FAIL'}`);
    for(const r of (j.results||[])){
      log(`  - ${r.name}: ${r.status}`);
      if(r.status!=='pass'){ issues.push(`${r.name} failed`); }
    }
  } catch(e:any){ issues.push(`/api/health unreachable: ${e?.message||e}`); }

  if (issues.length){
    console.log('\n⚠ Issues detected:'); for(const s of issues) console.log(' -', s);
    console.log('\nSuggested fixes:');
    console.log(' - Build MCP:  cd tools/geo-builders-mcp && npm run build');
    console.log(' - Set Supabase envs:  geo env --set NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=...');
    console.log(' - Install Docker Desktop / add to PATH');
    console.log(' - Ensure secrets saved in /settings/integrations for GitHub/Vercel');
    process.exitCode = 1;
  } else {
    console.log('\n✓ All checks passed');
  }
}
