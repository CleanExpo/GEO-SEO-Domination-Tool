import { NextRequest } from 'next/server';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'pathe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WEB_CWD = process.cwd();
const REPO_ROOT = resolve(WEB_CWD, '..', '..');
const STORE = join(REPO_ROOT, 'server', 'temp', 'jobs.json');

async function loadLogs(id: string): Promise<string[]> {
  if (!existsSync(STORE)) return [];
  try {
    const j = JSON.parse(await readFile(STORE, 'utf8')) as { jobs: any[] };
    const job = j.jobs.find((x) => x.id === id);
    return job?.logs || [];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  if (!id) {
    return new Response('missing id', { status: 400 });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      let cursor = 0;
      let open = true;
      const send = (event: string, data: any) => {
        const payload = typeof data === 'string' ? data : JSON.stringify(data);
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      // initial burst
      try {
        const logs = await loadLogs(id);
        cursor = logs.length;
        send('hello', { id, cursor });
      } catch {}

      const iv = setInterval(async () => {
        if (!open) return;
        const logs = await loadLogs(id);
        if (logs.length > cursor) {
          for (let i = cursor; i < logs.length; i++) {
            send('line', logs[i]);
          }
          cursor = logs.length;
        }
      }, 1000);

      const abort = req.signal;
      abort.addEventListener('abort', () => {
        open = false;
        clearInterval(iv);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
