# OAuth 404 Error - Complete Diagnosis

## Current Status

You're getting a 404 error from Google OAuth at:
```
accounts.google.com/signin/oauth/error?authError=Cg5KZWxIdGVtX23NsaWVudBldGhIE9RdXRoIGNsaWVudBldCB3YXMg...
```

## Server Logs Show Success

Your Next.js server successfully:
- ✅ Compiled auth routes
- ✅ Responded to signin request: `POST /api/auth/signin/google? 200`
- ✅ NextAuth is properly configured

**This means the problem is in Google Cloud Console configuration.**

## Root Cause Analysis

The 404 from Google means one of these:

### 1. **Redirect URI Mismatch** (90% probability)

**What Google expects vs what you configured:**

Looking at your earlier screenshot, URI #3 was truncated:
```
❌ https://geo-seo-domination-tool-git-main-unite-group.vercel.app/api/a
```

It should be:
```
✅ https://geo-seo-domination-tool-git-main-unite-group.vercel.app/api/auth/callback/google
```

**Action Required:**
1. Go to Google Cloud Console
2. Edit OAuth client
3. Fix the third redirect URI (currently cut off)
4. Ensure ALL three URIs end with `/api/auth/callback/google`

### 2. **OAuth Consent Screen Issues**

Google may be rejecting because:
- OAuth consent screen not configured
- App is in "Testing" mode but your email isn't added as test user
- Scopes not properly configured

**Action Required:**
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Check if OAuth consent screen is configured
3. If in "Testing" mode, add your email to test users
4. Verify these scopes are enabled:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`

### 3. **Client Secret Mismatch**

Your `.env.local` has:
```
GOOGLE_OAUTH_CLIENT_SECRET="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"
```

**Action Required:**
1. Go to Google Cloud Console → Credentials
2. Click on your OAuth client
3. Verify the client secret matches exactly
4. If it doesn't match, regenerate and update `.env.local`

## Step-by-Step Fix

### Step 1: Fix Redirect URIs

Go to: https://console.cloud.google.com/apis/credentials

1. Click "GEO-SEO Tool - Web Client"
2. Under "Authorized redirect URIs", ensure you have EXACTLY:
   ```
   http://localhost:3000/api/auth/callback/google
   https://geo-seo-domination-tool.vercel.app/api/auth/callback/google
   https://geo-seo-domination-tool-git-main-unite-group.vercel.app/api/auth/callback/google
   ```
3. **Delete any incomplete/truncated URIs**
4. Click "Save"
5. **Wait 5-10 minutes** for Google to propagate changes

### Step 2: Configure OAuth Consent Screen

Go to: https://console.cloud.google.com/apis/credentials/consent

1. Check "Publishing status":
   - If "Testing": Add your Google account email to "Test users"
   - If "In production": Verify it's approved

2. Check "Scopes":
   - Should include: `userinfo.email`, `userinfo.profile`, `openid`

3. Check "Authorized domains":
   - Add: `geo-seo-domination-tool.vercel.app`
   - Add: `localhost` (for local development)

### Step 3: Verify Client Credentials

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth client
3. Copy the **Client ID** (should start with numbers)
4. Copy the **Client secret** (should start with `GOCSPX-`)
5. Update `.env.local` if they don't match:
   ```env
   GOOGLE_OAUTH_CLIENT_ID="810093513411-o6b1eqol277rvgeh3n4ihnrv6vh8qbcj.apps.googleusercontent.com"
   GOOGLE_OAUTH_CLIENT_SECRET="GOCSPX-..."
   ```
6. Restart dev server: `npm run dev`

### Step 4: Clear Browser Cache

1. Press `Ctrl + Shift + Delete`
2. Select "Cookies and other site data"
3. Select "All time"
4. Click "Clear data"
5. Close all browser tabs

### Step 5: Test Again

1. Navigate to: http://localhost:3000/auth/signin
2. Click "Continue with Google"
3. You should see Google's account selection screen

## Expected Flow

### Correct OAuth Flow:
1. User clicks "Continue with Google" on your site
2. Redirects to: `accounts.google.com/o/oauth2/v2/auth?...`
3. User selects Google account and grants permissions
4. Google redirects to: `http://localhost:3000/api/auth/callback/google?code=...`
5. NextAuth exchanges code for tokens
6. User lands on: `/dashboard`

### Current (Broken) Flow:
1. User clicks "Continue with Google"
2. Redirects to Google
3. **Google returns 404** (redirect URI not found in their system)
4. Error page shown

## Debugging Tips

### Check Exact Redirect URI Google Received

1. Open browser DevTools (F12)
2. Go to Network tab
3. Click "Continue with Google"
4. Look for request to `accounts.google.com/o/oauth2/v2/auth`
5. Check the `redirect_uri` parameter in the URL
6. **This exact URI must be in Google Cloud Console**

### Enable Verbose Logging

Add to `.env.local`:
```env
NEXTAUTH_DEBUG=true
```

Restart server and check logs for detailed OAuth flow.

## Common Mistakes

❌ **Missing `/google` at end**: `/api/auth/callback` instead of `/api/auth/callback/google`
❌ **Wrong port**: Using `3001` instead of `3000`
❌ **Trailing slash**: `/api/auth/callback/google/` (Google is strict)
❌ **Wrong protocol**: Using `https` for localhost
❌ **Truncated URL**: Missing part of domain or path
❌ **Not waiting**: Clicking signin immediately after saving (wait 5 min)

## Nuclear Option (If Nothing Works)

If all else fails:

1. **Delete the OAuth client** in Google Cloud Console
2. **Create a brand new OAuth client**:
   - Application type: Web application
   - Name: GEO-SEO Tool
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
3. **Copy new Client ID and Secret** to `.env.local`
4. **Restart server**
5. **Test signin**

## Still Not Working?

If you've tried everything above and still see 404:

1. Take a screenshot of the **full browser address bar** when error occurs
2. Take a screenshot of your **complete OAuth client configuration** (all URIs visible)
3. Share both screenshots so I can identify the exact mismatch

The error is 100% a configuration mismatch between:
- What NextAuth is sending to Google
- What Google has in your OAuth client settings

The fix is ensuring these match exactly.
