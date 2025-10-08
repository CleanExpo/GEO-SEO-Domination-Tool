# 🔴 URGENT: Fix Google OAuth Redirect URIs

## Problem

You're getting a **404 error from Google** because the OAuth redirect URIs are configured for the old Supabase authentication system, but we're now using NextAuth.js which has different callback URLs.

---

## Solution: Update Google Cloud Console

### 1. Go to Google Cloud Console Credentials

**Direct Link**: https://console.cloud.google.com/apis/credentials

### 2. Find Your OAuth Client ID

Look for: `GEO-SEO Tool - Web Client` or similar name

Click on it to edit.

### 3. Update Authorized Redirect URIs

**REMOVE** these old Supabase URIs:
```
❌ http://localhost:3000/auth/callback
❌ https://geo-seo-domination-tool.vercel.app/auth/callback
❌ https://qwoggbbavikzhypzodcr.supabase.co/auth/v1/callback
```

**ADD** these NextAuth URIs:
```
✅ http://localhost:3000/api/auth/callback/google
✅ https://geo-seo-domination-tool.vercel.app/api/auth/callback/google
```

### 4. Keep Authorized JavaScript Origins

These should stay the same:
```
✅ http://localhost:3000
✅ https://geo-seo-domination-tool.vercel.app
```

### 5. Save Changes

Click **SAVE** at the bottom.

---

## Complete Configuration

After the update, your Google OAuth Client should have:

### Authorized JavaScript origins
```
http://localhost:3000
https://geo-seo-domination-tool.vercel.app
```

### Authorized redirect URIs
```
http://localhost:3000/api/auth/callback/google
https://geo-seo-domination-tool.vercel.app/api/auth/callback/google
```

---

## Why This Happened

- **Old system**: Supabase Auth used `/auth/callback`
- **New system**: NextAuth.js uses `/api/auth/callback/google`

Google OAuth checks the redirect URI exactly - if it doesn't match, you get a 404 error.

---

## Test After Update

1. Save changes in Google Cloud Console
2. Wait ~30 seconds for changes to propagate
3. Visit: http://localhost:3000/auth/signin
4. Click "Continue with Google"
5. Should now redirect correctly! ✅

---

## Screenshot Guide

### Where to Find It

1. **Google Cloud Console** → https://console.cloud.google.com
2. **Left sidebar** → APIs & Services → Credentials
3. **OAuth 2.0 Client IDs section**
4. Click on your client ID name
5. Scroll to **Authorized redirect URIs**
6. Click the pencil icon to edit
7. Delete old URIs
8. Add new NextAuth URIs
9. Click **SAVE**

---

## What the URLs Look Like

**Old (Supabase)**:
```
http://localhost:3000/auth/callback
                      ^^^^^^^^^^^^^ Supabase endpoint
```

**New (NextAuth)**:
```
http://localhost:3000/api/auth/callback/google
                      ^^^^^^^^^^^^^^^^^^^^^^^^ NextAuth endpoint
```

The key difference:
- Supabase: `/auth/callback`
- NextAuth: `/api/auth/callback/google`

---

## Verification

After updating, you should see:

**In Google Cloud Console**:
- ✅ 2 Authorized JavaScript origins
- ✅ 2 Authorized redirect URIs (both with `/api/auth/callback/google`)

**In your browser**:
- ✅ Sign-in flow completes successfully
- ✅ No more 404 errors
- ✅ Redirects to dashboard after authentication

---

**Status**: ⚠️ Waiting for you to update Google Cloud Console

Once you update the redirect URIs, authentication will work perfectly!
