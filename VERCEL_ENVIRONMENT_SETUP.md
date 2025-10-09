# Vercel Environment Setup Guide

**Project:** GEO-SEO Domination Tool
**Vercel Project ID:** `prj_JxdLiaHoWpnXWEjEhXXpmo0eFBgQ`
**Production URL:** `https://geo-seo-domination-tool.vercel.app`
**Team:** Unite Group

**Status:** ⚠️ **CRITICAL - DATABASE_URL MUST BE CONFIGURED**

This guide documents **REQUIRED** environment variables for production deployment. Missing variables will cause save failures and application errors.

## 🔴 CRITICAL: Database Configuration

### PostgreSQL Production Database (REQUIRED)

**Status:** ⚠️ **MUST BE CONFIGURED** - Production saves will fail without this

**Variable:** `DATABASE_URL` or `POSTGRES_URL`

**Current Value (from .env.local):**
```bash
# Supabase PostgreSQL Connection
DATABASE_URL=postgresql://postgres.qwoggbbavikzhypzodcr:3McFC5u51nUOJ2IB@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres
```

**Why Critical:**
- Without this, production saves fail (see [PRODUCTION_DATABASE_FIX.md](PRODUCTION_DATABASE_FIX.md))
- Application defaults to SQLite (doesn't work in Vercel serverless)
- Fixed database detection bug in commit 0c704c3

**How to Set in Vercel:**

```bash
# Method 1: Vercel CLI
vercel env add DATABASE_URL production
# Paste connection string when prompted:
# postgresql://postgres.qwoggbbavikzhypzodcr:3McFC5u51nUOJ2IB@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres

# Method 2: Vercel Dashboard
# 1. Visit: https://vercel.com/unite-group/geo-seo-domination-tool/settings/environment-variables
# 2. Add DATABASE_URL for Production environment
# 3. Redeploy
```

### Supabase Public Keys (Already Configured)

**Variable:** `NEXT_PUBLIC_SUPABASE_URL`
**Value:** `https://qwoggbbavikzhypzodcr.supabase.co`

**Variable:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3b2dnYmJhdmlremh5cHpvZGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjY4MTksImV4cCI6MjA3NDk0MjgxOX0.VXYF4vR9bO5kMzWNun52G9oM8K7p3jvavhiaYLvfD8o`

**Note:** These are public keys and safe to expose client-side.

## AI Service APIs (Configured)

### Anthropic Claude API

**Variable:** `ANTHROPIC_API_KEY`
**Status:** ✅ Currently configured
**Value:** `sk-ant-api03-pu4iltgoZfSuSF7N...` (masked)
**Used in:** [services/api/claude.ts](services/api/claude.ts)

### OpenAI API

**Variable:** `OPENAI_API_KEY`
**Status:** ✅ Currently configured
**Value:** `sk-proj-9796gRs4lOgcaZeDd...` (masked)
**Used in:** Alternative AI service, embeddings

### Perplexity AI API

**Variable:** `PERPLEXITY_API_KEY`
**Status:** ✅ Currently configured
**Value:** `pplx-EoOocpEC1OwZFHpbz57...` (masked)
**Used in:** [services/api/perplexity.ts](services/api/perplexity.ts) - Citations, research

## SEO Tool APIs (Configured)

### Google APIs

**Variable:** `GOOGLE_API_KEY`
**Status:** ✅ Currently configured
**Value:** `AIzaSyDStJB2YvcQ9_2PgbuUbZHJNEyNN24zZi8`
**Used in:** PageSpeed Insights, GBP API, Search Console

**Variable:** `NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY`
**Status:** ✅ Same as GOOGLE_API_KEY
**Used in:** Client-side PageSpeed API calls

### Firecrawl API

**Variable:** `FIRECRAWL_API_KEY`
**Status:** ✅ Currently configured
**Value:** `fc-26f87837394a4078b41ce685c878f51a`
**Used in:** [services/api/firecrawl.ts](services/api/firecrawl.ts) - Web scraping

### DataForSEO API

**Variable:** `DATAFORSEO_API_KEY`
**Status:** ✅ Currently configured
**Value:** `phill@disasterrecovery.com.au:f1f7eebc972699a7`
**Used in:** [services/api/dataforseo.ts](services/api/dataforseo.ts) - SERP data, rankings

## Authentication (NextAuth - Configured)

### NextAuth Configuration

**Variable:** `NEXTAUTH_SECRET`
**Status:** ✅ Currently configured
**Value:** `WdxA4V/KOamTHuCGfvLs914jNj3SP1J8d6Mq1ZgUI+s=`
**Purpose:** Session encryption key (generated with `openssl rand -base64 32`)

**Variable:** `NEXTAUTH_URL`
**Current:** `http://localhost:3000` (local only)
**Production:** Set to `https://geo-seo-domination-tool.vercel.app` or let Vercel auto-detect

### Google OAuth

**Variable:** `GOOGLE_OAUTH_CLIENT_ID`
**Status:** ✅ Currently configured
**Value:** `810093513411-o6b1eqol277rvgeh3n4ihnrv6vh8qbcj.apps.googleusercontent.com`

**Variable:** `GOOGLE_OAUTH_CLIENT_SECRET`
**Status:** ✅ Currently configured
**Value:** `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`

**Authorized Redirect URIs (Google Console):**
- ✅ `http://localhost:3000/api/auth/callback/google` (development)
- ⚠️ **ADD:** `https://geo-seo-domination-tool.vercel.app/api/auth/callback/google` (production)

**Setup:** Visit [Google Cloud Console](https://console.cloud.google.com/apis/credentials) to add production redirect URI

## Error Tracking (Sentry - Configured)

**Variable:** `NEXT_PUBLIC_SENTRY_DSN`
**Status:** ✅ Currently configured
**Value:** `https://462cc71bd571574383459afc2a707fb8@o4509326515896320.ingest.us.sentry.io/4510149419401216`

**Variable:** `SENTRY_AUTH_TOKEN`
**Status:** ✅ Currently configured
**Value:** `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`
**Purpose:** Source map uploads

**Variable:** `SENTRY_ORG`
**Value:** `carsi`

**Variable:** `SENTRY_PROJECT`
**Value:** `geo-seo-domination-tool`

**Variable:** `NEXT_PUBLIC_SENTRY_ENVIRONMENT`
**Local:** `development`
**Production:** Set to `production` in Vercel

## Quick Setup: Configure DATABASE_URL in Vercel

**PRIORITY 1:** Set PostgreSQL connection string in Vercel Production environment

### Method 1: Vercel CLI (Recommended)

```bash
# Add DATABASE_URL to production environment
vercel env add DATABASE_URL production

# Paste this value when prompted:
postgresql://postgres.qwoggbbavikzhypzodcr:3McFC5u51nUOJ2IB@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres

# Verify it was added
vercel env ls

# Redeploy to apply changes
vercel deploy --prod
```

### Method 2: Vercel Dashboard

1. Visit: [https://vercel.com/unite-group/geo-seo-domination-tool/settings/environment-variables](https://vercel.com/unite-group/geo-seo-domination-tool/settings/environment-variables)
2. Click "Add New"
3. Name: `DATABASE_URL`
4. Value: `postgresql://postgres.qwoggbbavikzhypzodcr:3McFC5u51nUOJ2IB@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres`
5. Environment: **Production** (only)
6. Click "Save"
7. Trigger redeploy (git push or dashboard)

### Verification

After setting DATABASE_URL:

```bash
# Check environment variables
vercel env ls

# View deployment logs
vercel logs --follow

# Look for: "🔧 Using PostgreSQL database (production)"
```

## Other Vercel CLI Commands

### Add Environment Variable
```bash
# Add for all environments
vercel env add VARIABLE_NAME

# Add for specific environment
vercel env add VARIABLE_NAME production
```

### Pull Environment Variables Locally
```bash
vercel env pull .env.local
```

### View Environment Variables
```bash
vercel env ls
```

### Remove Environment Variable
```bash
vercel env rm VARIABLE_NAME production
```

## Missing/Optional Variables

### SEMrush API (Optional)

**Variable:** `SEMRUSH_API_KEY`
**Status:** ⚠️ NOT CONFIGURED
**Purpose:** Competitor keyword research, SERP tracking, backlink analysis

**Setup:**
1. Get API key from: https://www.semrush.com/api-analytics/
2. Add to Vercel: `vercel env add SEMRUSH_API_KEY production`

### Email Service (Optional)

**Status:** ⚠️ NOT CONFIGURED - Email notifications disabled

**Variables:**
```bash
EMAIL_PROVIDER=resend  # or sendgrid
EMAIL_API_KEY=re_...
EMAIL_FROM=noreply@geoseodomination.com
SUPPORT_EMAIL=support@geoseodomination.com
```

**Setup:**
1. Sign up at [resend.com](https://resend.com/)
2. Get API key
3. Add to Vercel environment

### Reddit API (Optional)

**Status:** ⚠️ NOT CONFIGURED - Content gap mining disabled

**Variables:**
```bash
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USERNAME=your_username
REDDIT_PASSWORD=your_password
REDDIT_USER_AGENT=geo-seo-tool/1.0
```

**Setup:**
1. Create Reddit app: https://www.reddit.com/prefs/apps
2. Get client credentials
3. Add to Vercel environment

## Deployment Checklist

Before deploying to production:

- [ ] `DATABASE_URL` is set in Production environment ⚠️ **CRITICAL**
- [ ] `NEXT_PUBLIC_SENTRY_ENVIRONMENT=production` is set
- [ ] `NEXTAUTH_URL` matches production URL (or let Vercel auto-detect)
- [ ] Google OAuth redirect URIs include production URL
- [ ] All API keys are valid and active
- [ ] Test deployment with `vercel deploy --prod`
- [ ] Verify save functionality works in production
- [ ] Check Vercel logs for database connection: `🔧 Using PostgreSQL database (production)`

## Common Issues

### Issue: Saves work locally but fail in production

**Cause:** `DATABASE_URL` not set in Vercel Production environment

**Fix:**
```bash
vercel env add DATABASE_URL production
# Paste: postgresql://postgres.qwoggbbavikzhypzodcr:3McFC5u51nUOJ2IB@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres
vercel deploy --prod
```

**Verification:** Check logs for `🔧 Using PostgreSQL database (production)`

### Issue: API rate limits exceeded

**Cause:** Missing or incorrect API keys

**Fix:**
1. Verify API key is valid and active
2. Check API quota/limits in provider dashboard
3. Add `SENTRY_DEBUG=true` to see detailed errors

### Issue: OAuth login fails in production

**Cause:** Redirect URI not whitelisted in Google Console

**Fix:**
1. Visit [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Add production redirect URI: `https://geo-seo-domination-tool.vercel.app/api/auth/callback/google`
3. Save and retry login

## Security Best Practices

### DO:
- ✅ Use `NEXT_PUBLIC_` prefix for client-exposed variables
- ✅ Rotate API keys quarterly
- ✅ Use different keys for Production/Preview/Development
- ✅ Enable Vercel's secret protection
- ✅ Add `.env.local` to `.gitignore`

### DON'T:
- ❌ Commit `.env.local` to git
- ❌ Share API keys in documentation
- ❌ Use production keys in development
- ❌ Hardcode secrets in application code
- ❌ Expose database credentials client-side

## References

- **Vercel Environment Variables:** https://vercel.com/docs/projects/environment-variables
- **Supabase Connection String:** https://supabase.com/docs/guides/database/connecting-to-postgres
- **NextAuth Configuration:** https://next-auth.js.org/configuration/options
- **Sentry Setup:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Production Database Fix:** [PRODUCTION_DATABASE_FIX.md](PRODUCTION_DATABASE_FIX.md)
- **Database Architecture:** [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md)

---

**Last Updated:** 2025-10-09
**Status:** ⚠️ **DATABASE_URL MUST BE CONFIGURED IN VERCEL PRODUCTION**
**Commit:** 0c704c3 (fixed database detection logic)
