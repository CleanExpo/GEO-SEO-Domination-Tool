# Fix 500 Error - Missing Environment Variables

## Problem
The site is returning 500 errors because Vercel has **no environment variables** set. The middleware is trying to connect to Supabase without the required credentials.

## Solution
Add Supabase environment variables to Vercel.

---

## Step 1: Get Supabase Credentials

1. Go to: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/settings/api
2. Copy these two values:
   - **Project URL**: `https://qwoggbbavikzhypzodcr.supabase.co`
   - **Anon (public) key**: Long string starting with `eyJ...`

---

## Step 2: Add to Vercel (Choose Method A or B)

### Method A: Via Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/unite-group/web-app/settings/environment-variables
2. Click **"Add New"**
3. Add these two variables:

   **Variable 1:**
   - Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://qwoggbbavikzhypzodcr.supabase.co`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **Variable 2:**
   - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: [Paste your anon key from Supabase]
   - Environments: ✅ Production, ✅ Preview, ✅ Development

4. Click **"Save"**

### Method B: Via CLI

```bash
cd web-app

# Add SUPABASE_URL
echo "https://qwoggbbavikzhypzodcr.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production

# Add SUPABASE_ANON_KEY (paste your key when prompted)
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

---

## Step 3: Redeploy

After adding the environment variables, trigger a new deployment:

```bash
cd web-app
vercel --prod
```

---

## Step 4: Verify

Visit https://geo-seo-domination-tool.vercel.app/

- ✅ Should load the landing page (no 500 error)
- ✅ /sandbox page should work
- ✅ /api/mcp should respond

---

## Why This Happened

The database was set up correctly in Supabase, but Vercel didn't have the credentials to connect to it. The middleware runs on every request and tries to initialize Supabase, which fails without these environment variables.

## What Was Created

- ✅ Database tables (via COMPLETE_SANDBOX_SETUP.sql)
- ✅ New deployment (web-puwnstpmg)
- ❌ Missing: Environment variables (you're about to add them)
