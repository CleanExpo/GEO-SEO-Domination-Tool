import { spawn } from 'node:child_process';
import { once } from 'node:events';

// Usage: npm run call:list
//        npm run call:inspect
//        npm run call:preview:health
//        npm run call:apply:health
// Or:    node scripts/call-mcp.mjs <toolName> '<paramsJson>'

const [, , tool, paramsArg] = process.argv;
if (!tool) {
  console.error('Usage: node scripts/call-mcp.mjs <tool> <paramsJson>');
  process.exit(1);
}

let params = {};
try { params = paramsArg ? JSON.parse(paramsArg) : {}; } catch (e) {
  console.error('Invalid JSON for params:', e.message);
  process.exit(1);
}

const server = spawn(process.execPath, ['dist/index.js'], { stdio: ['pipe', 'pipe', 'pipe'] });

const req = { id: String(Date.now()), tool, params };
server.stdin.write(JSON.stringify(req) + '\n');

let out = '';
let err = '';
server.stdout.on('data', (d) => { out += d.toString(); });
server.stderr.on('data', (d) => { err += d.toString(); });

server.stdin.end();

(async () => {
  await once(server, 'close');
  if (err.trim()) console.error(err.trim());
  const line = (out.split('\n').find(l => l.trim().startsWith('{')) || out.trim());
  console.log(line);
  try {
    const parsed = JSON.parse(line);
    if (!parsed.ok) process.exit(1);
  } catch { /* best-effort */ }
})();
