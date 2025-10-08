# 🔴 STOP: Google OAuth 404 Error Fix

## Why You're Getting 404

The Google OAuth Client is trying to redirect to:
```
http://localhost:3000/auth/callback
```

But this URL doesn't exist in NextAuth.js. NextAuth uses:
```
http://localhost:3000/api/auth/callback/google
```

---

## 🛠️ Fix in 5 Steps (Takes 2 Minutes)

### Step 1: Open Google Cloud Console
**Click this link**: https://console.cloud.google.com/apis/credentials

### Step 2: Find Your OAuth Client
Look for your OAuth 2.0 Client ID:
- Name is probably: **"GEO-SEO Tool - Web Client"**
- Or similar name you created
- **Click on the name** to edit it

### Step 3: Scroll to "Authorized redirect URIs"
You'll see a section that looks like:

```
Authorized redirect URIs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
URIs:
1. http://localhost:3000/auth/callback                          [X]
2. https://geo-seo-domination-tool.vercel.app/auth/callback    [X]
3. https://qwoggbbavikzhypzodcr.supabase.co/auth/v1/callback   [X]

                                            + ADD URI
```

### Step 4: Delete Old URIs and Add New Ones

**DELETE (click the X button) these 3 URIs:**
```
❌ http://localhost:3000/auth/callback
❌ https://geo-seo-domination-tool.vercel.app/auth/callback
❌ https://qwoggbbavikzhypzodcr.supabase.co/auth/v1/callback
```

**ADD (click + ADD URI) these 2 URIs:**
```
✅ http://localhost:3000/api/auth/callback/google
✅ https://geo-seo-domination-tool.vercel.app/api/auth/callback/google
```

**IMPORTANT**: Notice the difference:
- Old: `/auth/callback` (Supabase)
- New: `/api/auth/callback/google` (NextAuth)

### Step 5: Save
**Click the SAVE button** at the bottom of the page.

---

## ✅ What It Should Look Like After

Your OAuth Client should have exactly:

### Authorized JavaScript origins (2)
```
✓ http://localhost:3000
✓ https://geo-seo-domination-tool.vercel.app
```

### Authorized redirect URIs (2)
```
✓ http://localhost:3000/api/auth/callback/google
✓ https://geo-seo-domination-tool.vercel.app/api/auth/callback/google
```

---

## 🧪 Test After Saving

1. **Wait 30 seconds** for Google to propagate changes
2. Go to: http://localhost:3000/auth/signin
3. Click "Continue with Google"
4. **Should work now!** ✅

---

## 🔍 Visual Reference

**Before (WRONG - causes 404)**:
```
Authorized redirect URIs:
  http://localhost:3000/auth/callback          ← Old Supabase URL
```

**After (CORRECT - works)**:
```
Authorized redirect URIs:
  http://localhost:3000/api/auth/callback/google   ← NextAuth URL
```

---

## ⚠️ Common Mistakes

### ❌ WRONG - Missing "google" at the end:
```
http://localhost:3000/api/auth/callback
```

### ✅ CORRECT - Has "google" at the end:
```
http://localhost:3000/api/auth/callback/google
```

### ❌ WRONG - Missing "/api":
```
http://localhost:3000/auth/callback/google
```

### ✅ CORRECT - Has "/api":
```
http://localhost:3000/api/auth/callback/google
```

---

## 📸 Screenshot Checklist

When you're editing the OAuth Client, verify:

- [ ] Client ID matches your `GOOGLE_OAUTH_CLIENT_ID` env variable
- [ ] Authorized JavaScript origins has `http://localhost:3000`
- [ ] Authorized redirect URIs has `http://localhost:3000/api/auth/callback/google`
- [ ] **NO** `/auth/callback` URIs (those are old)
- [ ] Clicked SAVE button

---

## 🆘 Still Getting 404?

If you still get 404 after updating:

1. **Double-check the exact URL** in your browser when the error appears
2. **Verify in Google Console** that the URL is listed exactly
3. **Wait 60 seconds** for Google's cache to clear
4. **Try in incognito mode** to clear browser cache
5. **Check Client ID** matches in `.env.local`

---

## 📝 Quick Copy-Paste

For easy copying, here are the exact URIs:

**Local development:**
```
http://localhost:3000/api/auth/callback/google
```

**Production:**
```
https://geo-seo-domination-tool.vercel.app/api/auth/callback/google
```

---

**Status**: ⏳ Waiting for you to update Google Console

Once you click SAVE in Google Console, the authentication will work! 🎉
