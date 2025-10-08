# Fix 404 OAuth Error - URGENT

## The Problem

You're getting a **404 error** from Google because your OAuth redirect URIs don't match where the callback is actually being sent.

## Root Cause

Looking at your screenshot, your Google OAuth settings have:
```
❌ http://localhost:3000/api/auth/callback/google  (WRONG - missing /api/auth prefix)
❌ https://geo-seo-domination-tool.vercel.app/api/auth/callback/google
```

But NextAuth v5 is trying to redirect to:
```
✅ http://localhost:3000/api/auth/callback/google  (CORRECT)
```

## EXACT Fix Required

Go to Google Cloud Console and update your OAuth client:

### 1. Authorized JavaScript Origins
```
http://localhost:3000
http://localhost:3001
https://geo-seo-domination-tool.vercel.app
https://geo-seo-domination-tool-git-main-unite-group.vercel.app
```

### 2. Authorized Redirect URIs (CRITICAL - Copy Exactly)
```
http://localhost:3000/api/auth/callback/google
http://localhost:3001/api/auth/callback/google
https://geo-seo-domination-tool.vercel.app/api/auth/callback/google
https://geo-seo-domination-tool-git-main-unite-group.vercel.app/api/auth/callback/google
```

## Verification Steps

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Find**: Your OAuth 2.0 Client ID named "Client ID for Web application"
3. **Click**: The edit pencil icon
4. **Clear all existing URIs** in both sections
5. **Copy-paste** the URIs above EXACTLY as shown
6. **Click Save**
7. **Wait 5 minutes** for Google to propagate changes

## Testing After Fix

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Close all browser tabs**
3. **Restart dev server**:
   ```bash
   # Kill existing process
   taskkill //F //IM node.exe

   # Start fresh
   npm run dev
   ```
4. **Open**: http://localhost:3000/auth/signin
5. **Click**: "Continue with Google"
6. **You should see**: Google consent screen (NOT 404)

## What the Error Means

- **404 from Google** = The redirect URI sent by your app doesn't match ANY of the URIs in your Google OAuth settings
- **Solution** = Add the EXACT URI to Google Console

## Current Configuration

Your `.env.local` is correct:
```env
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_OAUTH_CLIENT_ID="810093513411-o6b1eqol277rvgeh3n4ihnrv6vh8qbcj.apps.googleusercontent.com"
GOOGLE_OAUTH_CLIENT_SECRET="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"
```

Your NextAuth route is correct:
```
✅ app/api/auth/[...nextauth]/route.ts exists
✅ Exports { GET, POST } handlers
✅ Uses NextAuth v5 configuration
```

## Still Getting 404?

If you still see 404 after updating Google Console:

1. **Check the actual URL** in browser address bar when error occurs
2. **Copy that exact URL** and add it to Google Console redirect URIs
3. **Double-check spelling** - even one character difference causes 404
4. **Verify Client ID matches** - you might have multiple OAuth clients

## Common Mistakes

❌ Missing `/api/auth` prefix in redirect URI
❌ Wrong port number (3001 instead of 3000)
❌ Trailing slash (e.g., `/callback/google/`)
❌ Wrong protocol (http vs https)
❌ Not waiting 5 minutes after saving Google Console changes

## Production Deployment

For Vercel, also add these environment variables:
```
NEXTAUTH_URL=https://geo-seo-domination-tool.vercel.app
NEXTAUTH_SECRET=<generate-new-secret>
GOOGLE_OAUTH_CLIENT_ID=<same-as-local>
GOOGLE_OAUTH_CLIENT_SECRET=<same-as-local>
```

Generate secret:
```bash
openssl rand -base64 32
```
