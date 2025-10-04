# Redis-backed Multi-Runner Workers

## What this adds
- **Redis queue** (`REDIS_URL`) with per-type lists and a job index.
- **Worker process** `server/worker/redis-worker.ts` that pops jobs and executes build/deploy/api_call.
- `/api/jobs` now uses Redis if `REDIS_URL` is set; otherwise it falls back to the file queue.

## Setup
1. **Install dependency** (one-time):
   ```bash
   cd web-app && npm i ioredis && cd ..
   ```
2. **Run Redis locally** (optional):
   ```bash
   docker run -p 6379:6379 -d --name dev-redis redis:7-alpine
   ```
3. **Set env** (e.g., in `web-app/.env.local`):
   ```env
   REDIS_URL=redis://localhost:6379
   ```
4. **Start worker** (from repo root):
   ```bash
   node --require esbuild-register server/worker/redis-worker.ts
   ```
   > For Windows PowerShell, you can create a script alias or npm script.

## How it works
- Enqueue via **/jobs** UI or `POST /api/jobs` — API writes to Redis (or file store when no Redis).
- Any number of worker processes can run on different machines; each calls `RPOP` on job queues to claim work.
- Quotas are enforced in the worker, and usage is recorded.

## Notes
- Keep the existing file-backed worker for single-host dev; this feature activates automatically when `REDIS_URL` is present.
- For production, supervise workers with PM2/Systemd and supply the same repo + env.
