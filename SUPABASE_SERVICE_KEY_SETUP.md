# Supabase Service Role Key Setup

## Issue
SEO Audit API fails with: `new row violates row-level security policy for table "seo_audits"`

## Root Cause
The API is using `NEXT_PUBLIC_SUPABASE_ANON_KEY` which respects Row Level Security (RLS) policies. Server-side operations need the Service Role Key to bypass RLS.

## Solution

### Step 1: Get Service Role Key from Supabase

1. Go to: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/settings/api
2. Find **Service Role Key** (labeled as "secret")
3. Copy the key (starts with `eyJhbGci...`)

### Step 2: Add to Vercel Environment Variables

1. Go to: https://vercel.com/unite-group/geo-seo-domination-tool/settings/environment-variables
2. Click "Add New"
3. Name: `SUPABASE_SERVICE_ROLE_KEY`
4. Value: (paste the service role key from Supabase)
5. Environments: Production, Preview, Development
6. Click "Save"

### Step 3: Redeploy

Vercel will auto-redeploy after adding the environment variable.

Or manually trigger:
```bash
npx vercel --prod
```

## Verification

After deployment, test the audit endpoint:

```bash
node scripts/test-audit-endpoint.mjs
```

Expected result:
```
✅ SUCCESS!
Audit ID: [uuid]
Score: [0-100]
```

## Security Notes

⚠️ **IMPORTANT**:
- Service Role Key bypasses ALL RLS policies
- NEVER expose this key to the frontend
- Only use in server-side API routes
- Keep it in environment variables only

## What This Fixes

✅ SEO audits can now be created
✅ Server-side operations bypass RLS
✅ No authentication required for audit API
✅ Admin operations work correctly
