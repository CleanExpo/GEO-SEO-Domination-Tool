# Google OAuth 400 Error - Diagnostic Guide

## Error Message
```
400. That's an error.
The server cannot process the request because it is malformed. It should not be retried.
```

## What This Means
Google is rejecting the OAuth request because something in the configuration doesn't match.

---

## ✅ Fix Checklist

### 1. Verify Redirect URI in Google OAuth Console

**Go to**: https://console.cloud.google.com/apis/credentials

**Find your OAuth client**: `810093513411-o6b1eqol277rvgeh3n4ihnrv6vh8qbcj`

**Verify "Authorized redirect URIs" contains EXACTLY**:
```
https://geo-seo-domination-tool.vercel.app/api/auth/callback/google
```

**Common mistakes**:
- ❌ Missing the path: `.../callback/google`
- ❌ Using `http://` instead of `https://`
- ❌ Trailing slash: `.../google/`
- ❌ Extra spaces
- ❌ Wrong domain

**Should look like**:
```
Authorized redirect URIs:
  ✅ http://localhost:3000/api/auth/callback/google
  ✅ http://localhost:3001/api/auth/callback/google
  ✅ http://localhost:3002/api/auth/callback/google
  ✅ https://geo-seo-domination-tool.vercel.app/api/auth/callback/google
```

---

### 2. Verify Environment Variables in Vercel

**Go to**: https://vercel.com/unite-group/geo-seo-domination-tool/settings/environment-variables

**Check these variables exist for Production**:
```
✅ NEXTAUTH_URL = https://geo-seo-domination-tool.vercel.app
✅ NEXTAUTH_SECRET = (your secret)
✅ GOOGLE_OAUTH_CLIENT_ID = 810093513411-o6b1eqol277rvgeh3n4ihnrv6vh8qbcj.apps.googleusercontent.com
✅ GOOGLE_OAUTH_CLIENT_SECRET = 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
```

**If `NEXTAUTH_URL` is missing, add it**:
- Variable name: `NEXTAUTH_URL`
- Value: `https://geo-seo-domination-tool.vercel.app`
- Environment: Production

---

### 3. Verify Client ID/Secret Match

**In Google OAuth Console**:
1. Click your OAuth client
2. Copy the **Client ID** (should start with `810093513411-`)
3. Copy the **Client secret** (should start with `GOCSPX-`)

**In Vercel Environment Variables**:
1. Compare `GOOGLE_OAUTH_CLIENT_ID` with Client ID from Google
2. Compare `GOOGLE_OAUTH_CLIENT_SECRET` with Client secret from Google
3. They must match **EXACTLY** (no extra spaces, quotes, or characters)

---

### 4. Check OAuth Consent Screen

**Go to**: https://console.cloud.google.com/apis/credentials/consent

**Verify**:
- ✅ Publishing status: **"In production"** or **"Testing"**
- ✅ User type: **"External"** or **"Internal"**
- ✅ If "Testing", your email is in the test users list

**If status is "Testing"**:
- Click **"ADD USERS"**
- Add your email address
- Click **Save**

---

### 5. Force Redeploy Vercel

After making changes to environment variables:

```bash
# In your terminal (not PowerShell admin)
cd d:\GEO_SEO_Domination-Tool
vercel --prod
```

Or in Vercel dashboard:
1. Go to Deployments
2. Click the three dots on latest deployment
3. Click **"Redeploy"**

---

## 🧪 Test After Each Fix

1. Wait 2-3 minutes after making changes
2. Visit: https://geo-seo-domination-tool.vercel.app/auth/signin
3. Click "Sign in with Google"
4. Expected: Redirect to Google consent screen (not 400 error)

---

## 🔍 Additional Diagnostics

### Check What URL NextAuth is Sending

**Enable debug mode in Vercel**:
1. Add environment variable: `NEXTAUTH_DEBUG = true`
2. Redeploy
3. Check Vercel logs for the exact callback URL being used

**View logs**:
```bash
vercel logs --follow
```

Or in Vercel dashboard: Deployments → View Function Logs

---

## 🆘 Still Getting 400?

### Double-Check Everything Again

**Screenshot Checklist**:
1. Take screenshot of Google OAuth Console "Authorized redirect URIs"
2. Take screenshot of Vercel environment variables
3. Compare them character-by-character

**Most common issue**: The redirect URI in Google Console is slightly different from what you think it is (extra space, wrong path, etc.)

---

## ✅ Working Configuration Example

**Google OAuth Console** - Authorized redirect URIs:
```
http://localhost:3000/api/auth/callback/google
https://geo-seo-domination-tool.vercel.app/api/auth/callback/google
```

**Vercel Environment Variables** - Production:
```
NEXTAUTH_URL = https://geo-seo-domination-tool.vercel.app
NEXTAUTH_SECRET = WdxA4V/KOamTHuCGfvLs914jNj3SP1J8d6Mq1ZgUI+s=
GOOGLE_OAUTH_CLIENT_ID = 810093513411-o6b1eqol277rvgeh3n4ihnrv6vh8qbcj.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET = 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
```

**Result**: Google Sign-In works perfectly ✅

---

## 📝 After Fixing

Once it works:
1. Test sign-in on production
2. Test sign-out
3. Test session persistence
4. Mark task as complete in `INTEGRATION_COMPLETE.md`

---

**90% of 400 errors are caused by redirect URI mismatch** - double-check that first!
