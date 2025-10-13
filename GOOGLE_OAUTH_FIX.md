# Google OAuth Sign-In Fix

## Issue Summary

The Google Sign-In is failing due to **OAuth callback URL mismatch**. Your Vercel deployment URL has changed, but the Google OAuth Console still has the old URLs configured.

## Root Cause

**Current Vercel URL**: `geo-seo-domination-tool-zenithfresh25-1436-unite-group.vercel.app`

**Configured URLs in Google OAuth Console**:
- ❌ `https://geo-seo-domination-tool.vercel.app/api/auth/callback/google` (OLD)
- ❌ `https://geo-seo-domination-tool-git-main-unite-group.vercel.app/api/auth/callback/google` (OLD)
- ✅ `http://localhost:3000/api/auth/callback/google` (Still valid for local dev)

## Solution: Update Google OAuth Console

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (the one with Client ID: `810093513411-o6b1eqol277rvgeh3n4ihnrv6vh8qbcj`)

### Step 2: Navigate to OAuth Consent Screen

1. In the left sidebar, click **APIs & Services** → **Credentials**
2. Find **OAuth 2.0 Client IDs** section
3. Click on **GEO-SEO Tool - Web Client** (or your client name)

### Step 3: Add New Authorized Redirect URIs

Add the following URLs to **Authorized redirect URIs**:

```
✅ http://localhost:3000/api/auth/callback/google
✅ http://localhost:3001/api/auth/callback/google
✅ http://localhost:3002/api/auth/callback/google
✅ http://localhost:3003/api/auth/callback/google
✅ http://localhost:3004/api/auth/callback/google
✅ https://geo-seo-domination-tool-zenithfresh25-1436-unite-group.vercel.app/api/auth/callback/google
```

**Important**: Keep the localhost URLs for local development testing.

### Step 4: Save Changes

1. Click **Save** at the bottom of the page
2. Wait 5-10 minutes for changes to propagate

## Alternative: Configure Production Domain

If you want to use a stable production URL instead of the Vercel preview URL:

### Option A: Set Up Custom Domain in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/unite-group/geo-seo-domination-tool)
2. Click **Settings** → **Domains**
3. Add your custom domain (e.g., `app.yourdomain.com`)
4. Update Google OAuth callback to: `https://app.yourdomain.com/api/auth/callback/google`

### Option B: Use Vercel Production URL

Set the production URL as a static domain:

1. In Vercel, go to **Settings** → **Git**
2. Set **Production Branch** to `main`
3. The production URL will be: `https://geo-seo-domination-tool.vercel.app`
4. Add this to Google OAuth: `https://geo-seo-domination-tool.vercel.app/api/auth/callback/google`

## Testing After Fix

### Local Testing (http://localhost:3000)

1. Visit: `http://localhost:3000/auth/signin`
2. Click **Continue with Google**
3. Should redirect to Google OAuth consent screen
4. After authorization, should redirect back to: `http://localhost:3000/dashboard`

### Production Testing (Vercel)

1. Visit: `https://geo-seo-domination-tool-zenithfresh25-1436-unite-group.vercel.app/auth/signin`
2. Click **Continue with Google**
3. Should redirect to Google OAuth consent screen
4. After authorization, should redirect back to dashboard

## Additional Issue: .next Build Cache

There's also a secondary issue with the `.next/trace` file being locked (permission denied). This is preventing clean builds.

### Quick Fix:

1. **Close any running dev servers** (Ctrl+C in terminal)
2. **Manually delete `.next` folder**:
   - In Windows Explorer, navigate to `d:\GEO_SEO_Domination-Tool`
   - Right-click `.next` folder → Delete
   - If it says "file in use", restart your computer
3. **Restart dev server**: `npm run dev`

## Summary

**Primary Issue**: Google OAuth callback URL mismatch (needs update in Google Cloud Console)

**Secondary Issue**: Build cache corruption (needs manual cleanup)

**Once both are fixed**:
- ✅ Google Sign-In will work locally (localhost:3000)
- ✅ Google Sign-In will work on Vercel production
- ✅ Dev server will compile without errors

## Quick Checklist

- [ ] Update Google OAuth Console with new Vercel URL
- [ ] Delete `.next` folder manually
- [ ] Restart dev server (`npm run dev`)
- [ ] Test sign-in locally
- [ ] Test sign-in on Vercel

---

**Note**: The build cache issue is Windows-specific (`.next/trace` file lock). On Linux/Mac, simply run `rm -rf .next` to clean it up.
