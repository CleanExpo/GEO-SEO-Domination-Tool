# 🔑 GOOGLE_SPEED_KEY Configuration

## Overview

The `GOOGLE_SPEED_KEY` environment variable is used for **Google PageSpeed Insights API** (Lighthouse audits) in the GEO-SEO Domination Tool.

**Status**: ✅ **Configured in Vercel** (Production ready)

## Environment Variable Priority

The application checks for API keys in this order:

```javascript
const googleApiKey = process.env.GOOGLE_SPEED_KEY ||
                     process.env.GOOGLE_PAGESPEED_API_KEY ||
                     process.env.GOOGLE_API_KEY;
```

1. **`GOOGLE_SPEED_KEY`** ← Primary (Vercel production)
2. **`GOOGLE_PAGESPEED_API_KEY`** ← Fallback
3. **`GOOGLE_API_KEY`** ← Legacy fallback

## Production Setup (Vercel)

### Already Configured ✅

You've already added `GOOGLE_SPEED_KEY` to Vercel environment variables:

```bash
# Verify it's there
npx vercel env ls | grep GOOGLE_SPEED_KEY
```

Expected output:
```
GOOGLE_SPEED_KEY    Encrypted    Production, Preview, Development    [timestamp]
```

### If You Need to Update It

```bash
# Remove old value
npx vercel env rm GOOGLE_SPEED_KEY

# Add new value
npx vercel env add GOOGLE_SPEED_KEY
# Enter the key when prompted
# Select: Production, Preview, Development (all)
```

## Local Development Setup

### Option 1: Use Existing Fallback Keys (Current Setup)

Your `.env.local` currently uses fallback keys:
```bash
GOOGLE_API_KEY="AIzaSy..."
NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY="AIzaSy..."
```

This works but may have rate limits or be expired.

### Option 2: Add GOOGLE_SPEED_KEY Locally (Recommended)

1. **Uncomment and add your key** in `.env.local`:
   ```bash
   # Find this line (around line 18):
   # GOOGLE_SPEED_KEY="your_new_pagespeed_api_key_here"

   # Change to:
   GOOGLE_SPEED_KEY="your_actual_key_here"
   ```

2. **Restart your dev server**:
   ```bash
   npm run dev
   ```

## Getting a Google PageSpeed API Key

If you need a new API key:

### Step 1: Go to Google Cloud Console
👉 https://console.cloud.google.com/apis/credentials

### Step 2: Create or Select a Project
- Click "Select Project" at the top
- Create a new project or use existing

### Step 3: Enable PageSpeed Insights API
👉 https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com
- Click "Enable"

### Step 4: Create API Key
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "API Key"
3. Copy the generated key
4. **Recommended**: Click "Restrict Key"
   - Under "API restrictions", select "Restrict key"
   - Choose "PageSpeed Insights API" only
   - Save

### Step 5: Add to Vercel
```bash
npx vercel env add GOOGLE_SPEED_KEY
# Paste your new key
# Select all environments
```

### Step 6: Redeploy
```bash
npx vercel --prod
```

## Testing the Configuration

### Test Locally

```bash
# Start dev server
npm run dev

# In another terminal, test the API
curl -X POST http://localhost:3000/api/seo-audits \
  -H "Content-Type: application/json" \
  -d '{"company_id":"test","url":"https://www.example.com"}'
```

**Expected logs** (in dev server):
```
[SEO Audits API] Starting audit for https://www.example.com
[SEO Audits API] API keys available: { lighthouse: true, firecrawl: true }
[EnhancedSEOAuditor] Lighthouse service initialized with API key
[EnhancedSEOAuditor] Lighthouse audit completed for https://www.example.com
```

### Test Production

Navigate to your deployed app:
```
https://geo-seo-domination-tool.vercel.app/companies/[id]/seo-audit
```

Click "Run Audit" → Should complete without errors

## Files Modified

### Code Changes

1. **`lib/seo-audit-enhanced.ts`** (lines 17-30)
   - Updated constructor to check `GOOGLE_SPEED_KEY` first
   - Updated error messages to reference new variable

2. **`app/api/seo-audits/route.ts`** (lines 81-94)
   - Added `GOOGLE_SPEED_KEY` to availability check
   - Added logging for API key status

3. **`.env.local`** (lines 15-19)
   - Added comments explaining the new variable
   - Added placeholder for local key

## Security Best Practices

✅ **DO:**
- Keep API keys in environment variables (not in code)
- Restrict keys to specific APIs in Google Cloud Console
- Use separate keys for production/development if possible
- Rotate keys periodically

❌ **DON'T:**
- Commit API keys to git
- Share keys in public channels
- Use `NEXT_PUBLIC_` prefix (exposes to frontend)
- Reuse keys across multiple projects

## Troubleshooting

### Issue: "Invalid API key" Error

**Symptoms:**
```
[EnhancedSEOAuditor] Lighthouse API authentication failed - check GOOGLE_SPEED_KEY in Vercel
```

**Solutions:**
1. **Verify key is set in Vercel:**
   ```bash
   npx vercel env ls | grep GOOGLE_SPEED_KEY
   ```

2. **Check if key is restricted:**
   - Go to Google Cloud Console → Credentials
   - Ensure "PageSpeed Insights API" is allowed
   - Remove restrictions temporarily to test

3. **Generate new key:**
   - Follow steps in "Getting a Google PageSpeed API Key" above
   - Replace old key in Vercel

### Issue: "Rate limit exceeded"

**Symptoms:**
```
[EnhancedSEOAuditor] Lighthouse API rate limit exceeded
```

**Solutions:**
1. **Wait a few minutes** - Google has daily quotas
2. **Check quotas** in Google Cloud Console
3. **Request quota increase** (if needed for production)

### Issue: Lighthouse audits not running

**Check logs:**
```bash
# Local development
# Look for these logs in your dev server:
[EnhancedSEOAuditor] Lighthouse service initialized with API key

# If you see:
[EnhancedSEOAuditor] GOOGLE_SPEED_KEY not configured
```

**Solution:**
- Add `GOOGLE_SPEED_KEY` to `.env.local`
- Restart dev server

## Monitoring

### Check API Usage

👉 https://console.cloud.google.com/apis/api/pagespeedonline.googleapis.com/metrics

- Monitor daily requests
- Set up billing alerts
- Check for errors

### Free Tier Limits

Google PageSpeed Insights API:
- **25,000 requests/day** (free)
- **5 requests/second** (rate limit)

If you exceed these, audits will gracefully fall back to basic audits (without Lighthouse data).

## Summary

✅ **Production**: `GOOGLE_SPEED_KEY` configured in Vercel
✅ **Code**: Updated to use new variable
✅ **Fallbacks**: Legacy variables still work
✅ **Security**: Key kept secure in environment variables

**Next Steps:**
1. Test production deployment
2. Optionally add `GOOGLE_SPEED_KEY` to local `.env.local`
3. Monitor API usage in Google Cloud Console

---

**For support**: Check `RUN_AUDIT_BUTTON_FIX.md` for related audit system documentation.
