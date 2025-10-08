# 🔴 URGENT: Google OAuth Error Fix

## The Real Problem

You're getting `error?authError=Cg5k…` which means Google **IS** redirecting back to our app, but with an error code.

This is **NOT a 404** - it's an **OAuth authorization error** from Google.

---

## Root Cause: OAuth Consent Screen Not Published

Your OAuth app is in **"Testing"** mode, which has strict limitations:

1. ✅ Test users work (phill.mcgurk@gmail.com, zenithfresh25@gmail.com)
2. ❌ Any other email will get an error
3. ❌ App must be "Published" for general use

---

## SOLUTION 1: Publish Your OAuth App (Recommended)

### Step 1: Go to OAuth Consent Screen
https://console.cloud.google.com/apis/credentials/consent

### Step 2: Click "PUBLISH APP"

Look for a button that says:
- **"PUBLISH APP"** or
- **"Push to production"** or
- **"Submit for verification"**

### Step 3: Confirm Publishing

You'll see a warning:
> Publishing the app will make it available to any user with a Google Account

Click **"CONFIRM"**

### Step 4: Wait 1-2 Minutes

Google needs to propagate the changes.

---

## SOLUTION 2: Use a Test User Email (Quick Fix)

If you can't publish the app right now:

1. **Check which email you're using to sign in**
   - Look in your browser's Google account menu
   - Is it `phill.mcgurk@gmail.com` or `zenithfresh25@gmail.com`?

2. **If it's a different email**, add it to test users:
   - Go to: https://console.cloud.google.com/apis/credentials/consent
   - Scroll to "Test users" section
   - Click "+ ADD USERS"
   - Add your actual email
   - Click "SAVE"

3. **Try signing in again** after 1-2 minutes

---

## SOLUTION 3: Check OAuth Consent Screen Settings

### Verify These Settings:

1. **Go to**: https://console.cloud.google.com/apis/credentials/consent

2. **Check "Publishing status"**:
   - Should say: **"In production"** ✅
   - If it says: **"Testing"** ⚠️ → You need to publish

3. **Check "App domain"**:
   - Application home page: `https://geo-seo-domination-tool.vercel.app`
   - Authorized domains: `vercel.app`

4. **Check "Scopes"**:
   - ✅ `../auth/userinfo.email`
   - ✅ `../auth/userinfo.profile`
   - ✅ `openid`

---

## Debugging: What's the Exact Error?

The error code `authError=Cg5k…` is base64 encoded. To see the actual error:

### Option 1: Check Browser URL

When you get the error, look at the full URL in your browser. It should be:
```
http://localhost:3000?error=...&error_description=...
```

**Tell me the `error_description` value!**

### Option 2: Check Server Logs

Look at the terminal where `npm run dev` is running. You should see:
```
[auth][error]: Some error message here
```

**Tell me what error you see!**

---

## Most Common OAuth Errors

### Error: "access_denied"
**Cause**: You clicked "Cancel" or "Deny" on Google consent screen
**Fix**: Try again and click "Allow"

### Error: "redirect_uri_mismatch"
**Cause**: Redirect URI not configured correctly
**Fix**: Already fixed - we have `http://localhost:3000/api/auth/callback/google`

### Error: "unauthorized_client"
**Cause**: OAuth Client ID doesn't match or app not published
**Fix**: Publish the OAuth app (Solution 1 above)

### Error: "access_blocked"
**Cause**: User's email not in test users list (when app is in Testing mode)
**Fix**: Add your email to test users OR publish the app

---

## Quick Checklist

- [ ] OAuth app published (not in Testing mode)
- [ ] Test users include the email you're signing in with
- [ ] Authorized redirect URIs include `http://localhost:3000/api/auth/callback/google`
- [ ] OAuth consent screen has correct scopes
- [ ] Waited 1-2 minutes after making changes

---

## Testing After Fix

1. **Clear browser cookies**: Press Ctrl+Shift+Delete → Clear cookies
2. **Restart browser** (completely close and reopen)
3. **Go to**: http://localhost:3000/auth/signin
4. **Click "Continue with Google"**
5. **Sign in with test user email**
6. **Approve permissions**
7. **Should redirect to dashboard** ✅

---

## What I Need From You

To help debug further, please tell me:

1. **What's the publishing status?**
   - Is the app "In production" or "Testing"?

2. **What email are you using to sign in?**
   - Is it one of the test users?

3. **What's the exact error message?**
   - Copy the `error_description` from the URL

4. **Can you publish the app?**
   - Do you see a "PUBLISH APP" button?

---

## The Good News ✅

The OAuth flow **IS WORKING**:
- ✅ NextAuth is correctly redirecting to Google
- ✅ Google is processing the OAuth request
- ✅ Google is redirecting back to our callback URL
- ✅ The redirect URI is correct

The only issue is **Google's authorization decision** - either the app needs to be published or the user needs to be in the test users list.

---

**Status**: ⏳ Waiting for you to either publish the app or confirm the email you're using

Once we fix the Google Console configuration, authentication will work perfectly!
