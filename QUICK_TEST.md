# Quick OAuth Test Guide

## Run This Command First:
```bash
node scripts/test-oauth-setup.js
```

If all checks pass ✓, continue below.

## Start the Server:
```bash
npm run dev
```

## Test OAuth:
1. Open: http://localhost:3000/auth/signin
2. Click "Continue with Google"
3. Sign in with: phill.mcgurk@gmail.com or zenithfresh25@gmail.com

## What to Look For:

### ✅ SUCCESS - You should see:
- Server terminal: "✓ Created new user: [your-email]"
- Browser redirects to: http://localhost:3000/dashboard
- No console errors

### ❌ FAILURE - Common errors:

**"redirect_uri_mismatch"**
→ Fix: Add http://localhost:3000/api/auth/callback/google to Google Console

**"access_denied"** 
→ Fix: Add your email to Test Users in Google Console

**"Error saving user to database"**
→ Fix: Run `npm run db:init`

## Verify User Was Saved:
```bash
node -e "const { getDatabase } = require('./lib/db.js'); (async () => { const db = getDatabase(); await db.initialize(); const users = await db.query('SELECT email, created_at FROM users'); console.log(users.rows); })();"
```

## Get Help:
See OAUTH_FIX_SUMMARY.md for detailed troubleshooting.
