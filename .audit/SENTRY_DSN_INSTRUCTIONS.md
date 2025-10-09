# Get Sentry DSN - Quick Guide

**Auth Token:** ✅ Already configured  
**Organization:** carsi  
**Project:** geo-seo-domination-tool  
**Status:** Need DSN only (5 minutes)

## Step 1: Create Sentry Project

1. Go to https://sentry.io
2. Sign in or create account
3. Create organization named "**carsi**" (if new account)
4. Click "**Create Project**"
   - Platform: **Next.js**
   - Project name: **geo-seo-domination-tool**
   - Alert frequency: **On every new issue**
   - Team: Default

## Step 2: Get DSN

After project creation, you'll see the "Configure SDK" page:

1. Look for the DSN at the top:
   ```
   Sentry.init({
     dsn: "https://XXXXX@sentry.io/YYYYY",
   ```

2. Copy the entire DSN URL (format: `https://[key]@sentry.io/[project-id]`)

OR

1. Navigate to: Settings → Projects → geo-seo-domination-tool
2. Click "Client Keys (DSN)" in left sidebar
3. Copy the DSN

## Step 3: Update .env.local

Replace this line in `.env.local`:
```env
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id
```

With your actual DSN:
```env
NEXT_PUBLIC_SENTRY_DSN=https://[your-actual-key]@sentry.io/[your-project-id]
```

## Step 4: Test Integration

Server is already running on http://localhost:3000

1. Visit: http://localhost:3000/api/sentry-test
2. Expected response: 500 error with JSON:
   ```json
   {
     "error": "Test error captured by Sentry",
     "message": "This is a test error from Sentry integration - myUndefinedFunction()",
     "sentryCapture": "Error sent to Sentry with tags and context"
   }
   ```

3. Check Sentry dashboard:
   - Go to: https://sentry.io/organizations/carsi/issues/
   - Should see new error: "myUndefinedFunction()"
   - Verify tags: `test: true`, `route: sentry-test`
   - Verify breadcrumb: "About to trigger test error"

## Step 5: Verify and Clean Up

If test successful:
```bash
# Delete test route
rm -rf app/api/sentry-test

# Commit DSN update
git add .env.local
git commit -m "Add Sentry DSN - integration complete"
```

## What's Already Configured

✅ Auth Token: `SENTRY_AUTH_TOKEN=sntryu_bdcc...`  
✅ Organization: `SENTRY_ORG=carsi`  
✅ Project: `SENTRY_PROJECT=geo-seo-domination-tool`  
✅ Environment: `NEXT_PUBLIC_SENTRY_ENVIRONMENT=development`  
✅ Release: `NEXT_PUBLIC_RELEASE_VERSION=1.0.0`  
✅ Sentry configs: client, server, edge, instrumentation  
✅ next.config.js: Sentry webpack plugin enabled  
✅ Test route: /api/sentry-test with myUndefinedFunction()

**Only missing:** DSN (Data Source Name)

## Troubleshooting

**Problem:** Don't see error in Sentry dashboard

**Solutions:**
1. Wait 30 seconds - errors may take time to appear
2. Check DSN is correct (no typos)
3. Restart dev server: `npm run dev`
4. Check browser console for Sentry initialization errors
5. Verify environment: `echo $NEXT_PUBLIC_SENTRY_DSN`

**Problem:** Cannot create organization "carsi"

**Solutions:**
1. If name taken, use `carsi-seo` or `carsi-geo-seo`
2. Update `.env.local` with actual org name
3. Update `SENTRY_ORG=your-actual-org-name`

**Problem:** 404 when visiting /api/sentry-test

**Solutions:**
1. Verify file exists: `ls app/api/sentry-test/route.ts`
2. Restart dev server
3. Check terminal for compilation errors

## Next Steps After DSN

Once Sentry is working:

1. **Begin console.log Migration** (8h)
   - See: `.audit/SENTRY_SETUP_GUIDE.md` for migration patterns
   - Priority 1: Critical errors (services layer)
   - Priority 2: Security logging (auth, PII)
   - Priority 3: User-facing errors (components)
   - Priority 4: Debug logging (breadcrumbs)

2. **Configure Alerts**
   - Critical errors: Email + Slack
   - Performance degradation: Email
   - Crash rate drop: Email + Slack

3. **Set Up Dashboards**
   - Production health
   - API performance
   - User experience metrics

Time to full integration: **15 minutes** (create project + update DSN + test)
