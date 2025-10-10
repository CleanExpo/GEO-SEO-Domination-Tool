# Supabase Pooler Fix for "Max Clients in Session Mode" Error

## Problem

Getting error: `MaxClientsInSessionMode: max clients reached - in Session mode max clients are limited to pool_size`

## Root Cause

The `DATABASE_URL` is using **Session mode** (direct connection) instead of **Transaction mode** (pooler).

### Supabase Connection Modes

1. **Session Mode (Direct)**: Limited to 160 connections
   - Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`
   - Problem: Each serverless function holds connections

2. **Transaction Mode (Pooler)**: Supports 800 connections
   - Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`
   - Solution: Uses PgBouncer connection pooling

## Fix

### In Vercel Dashboard

1. Go to: https://vercel.com/unite-group/geo-seo-domination-tool/settings/environment-variables

2. Update `DATABASE_URL` to use **port 6543** (Transaction mode pooler):

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

Key changes:
- Change port from `:5432` → `:6543`
- Add query parameter: `?pgbouncer=true`

### Alternative: Use Separate Pooler URL

Or add a new variable `POSTGRES_POOLER_URL` and update `lib/db.ts` to prefer it:

```typescript
const pgConnectionString =
  process.env.POSTGRES_POOLER_URL ||  // Prefer pooler
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;
```

## Verification

After updating the environment variable in Vercel:

1. Redeploy:
   ```bash
   npx vercel --prod
   ```

2. Test:
   ```bash
   node scripts/test-new-deployment.mjs
   ```

Expected result: No more "max clients" errors, even under load.

## Why This Happens

- Vercel serverless functions don't immediately release connections
- Multiple concurrent requests × multiple serverless instances = rapid connection exhaustion
- Session mode (160 limit) × serverless = instant overflow
- Transaction mode (800 limit) + PgBouncer pooling = proper scaling

## Reference

- Supabase Pooler Docs: https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler
- PgBouncer: https://www.pgbouncer.org/
