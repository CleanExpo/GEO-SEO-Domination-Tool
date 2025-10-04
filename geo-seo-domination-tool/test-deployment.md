# Deployment Test Checklist

## Live Site Testing for geo-seo-domination-tool

### Test URLs:
- Production: https://geo-seo-domination-tool.vercel.app
- Latest: https://geo-seo-domination-tool-bnb267gd4-unite-group.vercel.app

---

## Test 1: Home Page (Public)
**URL:** `/`
**Expected:** ✅ Loads without authentication
**Features to verify:**
- [ ] "GEO-SEO Domination Tool" heading visible
- [ ] "Get Started" and "View Companies" buttons visible
- [ ] Three feature cards displayed (SEO Audits, Keyword Tracking, Performance Metrics)
- [ ] No errors in browser console

---

## Test 2: Login Page (Public)
**URL:** `/login`
**Expected:** ✅ Loads without authentication
**Features to verify:**
- [ ] Email and password input fields visible
- [ ] "Sign In" button visible
- [ ] "Google" OAuth button visible
- [ ] "Sign up" link at bottom
- [ ] No errors in browser console

---

## Test 3: Protected Route Without Auth
**URL:** `/dashboard`
**Expected:** ↩️ Redirects to `/login?redirectTo=/dashboard`
**Features to verify:**
- [ ] Automatic redirect occurs
- [ ] Redirect URL includes `redirectTo` parameter
- [ ] Login page loads after redirect

---

## Test 4: API Health Check
**URL:** `/api/health/check`
**Expected:** JSON response with system status
**Features to verify:**
- [ ] Returns JSON (not HTML)
- [ ] Includes `database` connection status
- [ ] Includes `services` status for integrations
- [ ] Includes `environment` configuration

---

## Test 5: Database Connection (Via API)
**URL:** `/api/companies`
**Expected:**
- If authenticated: JSON array of companies
- If not authenticated: Might return empty array or error
**Features to verify:**
- [ ] Returns valid JSON
- [ ] No 500 errors
- [ ] Headers include proper CORS/security headers

---

## Console Error Checks

Open browser DevTools (F12) and check for:

### Should NOT see:
- ❌ `Failed to load resource: 401`
- ❌ `Supabase client initialization failed`
- ❌ `TypeError` or `ReferenceError`
- ❌ `CORS policy` errors

### May see (expected):
- ⚠️ `Failed to fetch companies` (if not authenticated)
- ⚠️ Analytics warnings (Vercel Analytics)
- ℹ️ CSP warnings (Content Security Policy - this is GOOD)

---

## Network Tab Checks

In DevTools Network tab:

### Check Response Headers:
- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Content-Security-Policy` present
- [ ] `Strict-Transport-Security` (if HTTPS)

---

## Troubleshooting

### If home page returns 401:
1. Check Supabase project is not paused (free tier pauses after inactivity)
2. Verify environment variables in Vercel dashboard
3. Check Supabase dashboard for errors
4. Redeploy the application

### If login doesn't work:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
3. Check Supabase dashboard → Authentication → Settings
4. Ensure email provider is configured in Supabase

### If API endpoints return errors:
1. Check `/api/health/check` first
2. Verify database tables exist in Supabase
3. Check Supabase RLS policies are disabled or properly configured
4. Review Vercel deployment logs

---

## Manual Browser Testing Steps

1. Open incognito/private window
2. Navigate to `https://geo-seo-domination-tool-bnb267gd4-unite-group.vercel.app`
3. Verify home page loads
4. Click "Get Started" → Should redirect to `/login`
5. Check browser console for errors
6. Try navigating to `/dashboard` directly → Should redirect to `/login`

---

## Expected Behavior Summary

| Route | Authentication | Action |
|-------|---------------|--------|
| `/` | Not required | Shows home page |
| `/login` | Not required | Shows login form |
| `/signup` | Not required | Shows signup form |
| `/dashboard` | Required | Redirect to `/login` |
| `/companies` | Required | Redirect to `/login` |
| `/keywords` | Required | Redirect to `/login` |
| `/rankings` | Required | Redirect to `/login` |
| `/audits` | Required | Redirect to `/login` |
| `/crm/*` | Required | Redirect to `/login` |
| `/projects/*` | Required | Redirect to `/login` |
| `/resources/*` | Required | Redirect to `/login` |
| `/api/*` | Varies | Returns JSON |

---

## Quick Fix Commands

### If you need to redeploy:
```bash
cd web-app
git add .
git commit -m "Fix deployment issue"
git push
# Vercel auto-deploys on push to main
```

### If you need to update environment variables:
```bash
# Via Vercel Dashboard (recommended):
# 1. Go to project settings
# 2. Environment Variables
# 3. Edit/Add variables
# 4. Redeploy

# Or via CLI:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### If database needs initialization:
```bash
# Run SQL in Supabase dashboard SQL Editor:
# Copy contents of: web-app/supabase-schema.sql
# Paste and run in Supabase
```

---

## Success Criteria

✅ Deployment is working if:
1. Home page loads without errors
2. Login page is accessible
3. Protected routes redirect to login
4. No 401 errors in console
5. `/api/health/check` returns valid JSON
6. Security headers are present in responses

---

**Last Updated:** October 2, 2025
**Deployment:** geo-seo-domination-tool-bnb267gd4-unite-group.vercel.app
**Status:** Ready (per Vercel dashboard)
