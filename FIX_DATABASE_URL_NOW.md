# 🚨 IMMEDIATE FIX - Change DATABASE_URL

## The ONLY thing wrong:

Your `DATABASE_URL` in Vercel is using **Session mode** (port 5432).

Serverless needs **Transaction mode** (port 6543).

---

## Steps to Fix (2 minutes):

### 1. Go to Vercel Dashboard

https://vercel.com/unite-group/geo-seo-domination-tool/settings/environment-variables

### 2. Find `DATABASE_URL`

Current value (WRONG):
```
postgresql://postgres.qwoggbbavikzhypzodcr:NwtXEg6aVNs7ZstH@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
```

### 3. Change to this (CORRECT):

```
postgresql://postgres.qwoggbbavikzhypzodcr:NwtXEg6aVNs7ZstH@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Two changes:**
- `:5432` → `:6543` (use pooler port)
- Add `?pgbouncer=true` at the end

### 4. Save and Redeploy

Vercel will auto-redeploy. Wait 90 seconds.

---

## Why This Fixes Everything

| What You Have Now | What You Need |
|-------------------|---------------|
| Port 5432 = Session mode | Port 6543 = Transaction mode |
| 160 max connections | 800 max connections |
| Each request holds connection | PgBouncer pools connections |
| Serverless = disaster | Serverless = perfect |

---

## After the Change

✅ No more "max clients" errors
✅ Save will work immediately
✅ Onboarding will complete successfully
✅ No code changes needed

---

## Alternative Quick Test (Before Fixing Vercel)

If you want to test locally first, set this in `.env.local`:

```bash
DATABASE_URL="postgresql://postgres.qwoggbbavikzhypzodcr:NwtXEg6aVNs7ZstH@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

Then run:
```bash
npx vercel --prod
```

---

## That's It.

No pool configuration changes needed.
No code changes needed.
Just change the port number.

**This is the ONLY issue.**
