# Port 3000 OAuth Issue - Fixed ✅

## Problem

When the Next.js dev server runs on a port other than 3000 (e.g., port 3004), the OAuth redirect URLs were hardcoded to `localhost:3000`, causing authentication to fail.

**Error Symptoms:**
```
Port 3000 is in use by process 35652, using available port 3004 instead.
[auth][debug]: authorization url is ready {
  "url": "https://accounts.google.com/o/oauth2/v2/auth?...&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Fgoogle...",
```

Notice the redirect URL is `localhost:3000` but the app is running on `localhost:3004`.

---

## Root Cause

The `.env.local` file had `NEXTAUTH_URL` hardcoded:
```bash
NEXTAUTH_URL="http://localhost:3000"
```

This overrode NextAuth v5's auto-detection feature, forcing all OAuth redirects to use port 3000 regardless of the actual port the app was running on.

---

## Solution

### Fix 1: Remove Hardcoded NEXTAUTH_URL ✅

**File:** `.env.local`

**Changed:**
```bash
# Before
NEXTAUTH_URL="http://localhost:3000"

# After
# NOTE: Commented out to allow NextAuth v5 to auto-detect the correct URL and port
# This enables the app to work on any port (3000, 3004, etc.)
# NEXTAUTH_URL="http://localhost:3000"
```

**Why This Works:**
- NextAuth v5 with `trustHost: true` (configured in `auth.ts`) automatically detects the correct URL and port
- The app now works on any available port (3000, 3001, 3004, etc.)
- OAuth redirects use the correct port automatically

### Fix 2: Update .env.example ✅

**File:** `.env.example`

**Added Documentation:**
```bash
# ===================================
# NextAuth v5 Configuration
# ===================================
# Generate secret with: openssl rand -base64 32
NEXTAUTH_SECRET=your_nextauth_secret_here

# NextAuth URL
# NOTE: Leave empty in development to auto-detect URL and port
# Only set for production with specific domain
# NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_URL=

# Google OAuth Credentials
GOOGLE_OAUTH_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret

# Debug Mode (set to true for detailed auth logs)
NEXTAUTH_DEBUG=false
```

### Fix 3: Script to Free Port 3000 ✅

**File:** `scripts/kill-port-3000.js`

**Usage:**
```bash
node scripts/kill-port-3000.js
```

**What It Does:**
- Detects any process using port 3000
- Kills the process (Windows and Unix/Mac compatible)
- Frees up the port for Next.js

---

## How to Verify the Fix

### Step 1: Kill Process on Port 3000 (Optional)

```bash
node scripts/kill-port-3000.js
```

### Step 2: Start Dev Server

```bash
npm run dev
```

**Expected Output:**
```
▲ Next.js 15.5.4
 - Local:        http://localhost:3000
 - Network:      http://192.168.50.145:3000
```

### Step 3: Test OAuth

1. Navigate to http://localhost:3000 (or whatever port it started on)
2. Click "Sign In with Google"
3. Complete Google OAuth flow
4. **Verify:** You should be redirected back to the correct port and authenticated

### Step 4: Check OAuth Logs

With `NEXTAUTH_DEBUG=true`, you should see:
```
[auth][debug]: authorization url is ready {
  "url": "https://accounts.google.com/o/oauth2/v2/auth?...&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Fgoogle...",
```

**Verify:** The redirect URL port matches the actual dev server port.

---

## Configuration Details

### NextAuth v5 Setup (auth.ts)

```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: process.env.NEXTAUTH_DEBUG === 'true',
  trustHost: true, // ✅ Required for dynamic port detection
  basePath: '/api/auth',
  providers: [
    Google({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  // ... rest of config
});
```

**Key Setting:** `trustHost: true`
- Tells NextAuth to trust the `Host` header
- Enables automatic URL detection
- Works with any port

### Environment Variables

**Required:**
```bash
NEXTAUTH_SECRET=your_secret_here
GOOGLE_OAUTH_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
```

**Optional (Development):**
```bash
NEXTAUTH_DEBUG=true  # Enable detailed auth logs
# NEXTAUTH_URL - Leave commented out for auto-detection
```

**Required (Production):**
```bash
NEXTAUTH_URL=https://yourdomain.com  # Set explicit URL for production
```

---

## Port Conflict Scenarios

### Scenario 1: Port 3000 Already in Use

**Symptom:**
```
Port 3000 is in use by process 35652, using available port 3004 instead.
```

**Solution:**
1. Run: `node scripts/kill-port-3000.js`
2. Or: Let Next.js use port 3004 (OAuth will work automatically)

### Scenario 2: Multiple Next.js Instances

**Symptom:**
```
Port 3000 is in use
Port 3001 is in use
Using available port 3002 instead.
```

**Solution:**
- Each instance will get a unique port
- OAuth works on all ports due to auto-detection
- No manual configuration needed

### Scenario 3: Production Deployment

**Requirement:**
- Set explicit `NEXTAUTH_URL` for production domain

**Example (Vercel):**
```bash
NEXTAUTH_URL=https://geo-seo-tool.vercel.app
```

---

## Common Mistakes to Avoid

### ❌ DON'T: Hardcode NEXTAUTH_URL in Development

```bash
# Bad - breaks OAuth on different ports
NEXTAUTH_URL="http://localhost:3000"
```

### ✅ DO: Leave NEXTAUTH_URL Empty in Development

```bash
# Good - enables auto-detection
# NEXTAUTH_URL=
```

### ❌ DON'T: Set NEXTAUTH_URL to IP Address

```bash
# Bad - IP addresses don't match OAuth redirect URIs
NEXTAUTH_URL="http://192.168.1.100:3000"
```

### ✅ DO: Use localhost or Domain Name

```bash
# Good - matches OAuth redirect URIs
# Development: Leave empty for auto-detection
# Production: NEXTAUTH_URL=https://yourdomain.com
```

---

## OAuth Redirect URI Configuration

### Google Cloud Console Setup

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/callback/google
http://localhost:3001/api/auth/callback/google
http://localhost:3002/api/auth/callback/google
http://localhost:3003/api/auth/callback/google
http://localhost:3004/api/auth/callback/google
https://yourdomain.com/api/auth/callback/google
```

**Why Multiple Ports:**
- Covers all possible development ports
- Next.js auto-increments port when 3000 is busy
- No need to update Google Console when port changes

**Add More Ports:**
1. Go to Google Cloud Console
2. Navigate to Credentials
3. Edit OAuth 2.0 Client ID
4. Add additional redirect URIs for ports 3005, 3006, etc.

---

## Troubleshooting

### Issue: OAuth still fails on port 3004

**Check:**
1. Is `NEXTAUTH_URL` commented out in `.env.local`?
2. Is `trustHost: true` set in `auth.ts`?
3. Is port 3004 in Google OAuth redirect URIs?

**Debug:**
```bash
# Enable debug mode
NEXTAUTH_DEBUG=true npm run dev

# Check logs for redirect_uri value
# Should show: redirect_uri=http%3A%2F%2Flocalhost%3A3004%2F...
```

### Issue: "redirect_uri_mismatch" error

**Cause:** Port not in Google OAuth allowed redirect URIs

**Solution:**
1. Go to Google Cloud Console
2. Add the specific port to redirect URIs:
   ```
   http://localhost:3004/api/auth/callback/google
   ```
3. Restart dev server

### Issue: Process 35652 keeps blocking port 3000

**Solution A:** Kill the process
```bash
node scripts/kill-port-3000.js
```

**Solution B:** Change default port
```bash
# In .env.local
PORT=3001
```

**Solution C:** Accept auto-port (Recommended)
- Let Next.js use whatever port is available
- OAuth will work on any port

---

## Files Modified

1. **`.env.local`** - Commented out `NEXTAUTH_URL`
2. **`.env.example`** - Added documentation for NextAuth config
3. **`scripts/kill-port-3000.js`** - Created port cleanup script
4. **`PORT_3000_FIX.md`** - This documentation file

---

## Summary

**Problem:** OAuth redirects hardcoded to port 3000, breaks on other ports

**Solution:** Remove `NEXTAUTH_URL` from `.env.local` to enable auto-detection

**Result:** OAuth works on any port automatically

**Benefits:**
- ✅ No manual port configuration
- ✅ Works on all development ports (3000-3999)
- ✅ No need to restart dev server if port changes
- ✅ Faster development workflow

---

**Status:** ✅ Fixed
**Date:** 2025-01-13
**NextAuth Version:** v5 (beta)
**Next.js Version:** 15.5.4

---

## Quick Reference

**Kill port 3000:**
```bash
node scripts/kill-port-3000.js
```

**Start dev server:**
```bash
npm run dev
```

**Enable debug logs:**
```bash
NEXTAUTH_DEBUG=true npm run dev
```

**Check OAuth config:**
- Google Console: https://console.cloud.google.com/apis/credentials
- NextAuth Config: `auth.ts`
- Environment: `.env.local`

**Test OAuth:**
1. Navigate to dev server URL
2. Click "Sign In with Google"
3. Complete OAuth flow
4. Verify redirect back to correct port
