# Quick Start: Authentication & RLS Testing

This guide will get you up and running with authentication testing in 5 minutes.

---

## Prerequisites

- Supabase account (free tier works)
- Node.js 18+ installed
- Basic familiarity with terminal/command line

---

## Step 1: Supabase Setup (2 minutes)

### 1.1 Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - Name: `geo-seo-domination`
   - Database Password: (save this somewhere safe)
   - Region: Choose closest to you
4. Click "Create new project" and wait ~2 minutes

### 1.2 Get API Credentials

Once project is ready:

1. Go to **Settings** (gear icon) > **API**
2. Copy these values:
   - Project URL: `https://xxxxx.supabase.co`
   - `anon` `public` key (starts with `eyJ...`)
   - `service_role` `secret` key (starts with `eyJ...`)

---

## Step 2: Configure Environment (1 minute)

```bash
cd D:\GEO_SEO_Domination-Tool\web-app

# Copy example env file
cp .env.example .env

# Edit .env file with your favorite editor
# Add the Supabase credentials from Step 1.2
```

**Edit `.env`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
```

---

## Step 3: Run Database Migrations (2 minutes)

1. Go to your Supabase project
2. Click **SQL Editor** (left sidebar)
3. Click **New query**

### 3.1 Run Migration 003 (Multi-Tenancy)

Copy and paste the entire contents of:
```
D:\GEO_SEO_Domination-Tool\database\migrations\003_multi_tenancy_foundation.sql
```

Click **Run** (or press F5)

**Expected:** "Success. No rows returned"

### 3.2 Run Migration 008 (Auto-Organisation)

Copy and paste the entire contents of:
```
D:\GEO_SEO_Domination-Tool\database\migrations\008_auto_add_users_to_organisation.sql
```

Click **Run** (or press F5)

**Expected:** "Success. No rows returned"

### 3.3 Verify Setup

Run this verification query:
```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('organisations', 'organisation_members')
ORDER BY table_name;

-- Check trigger exists
SELECT trigger_name
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Expected:**
- 2 tables: `organisation_members`, `organisations`
- 1 trigger: `on_auth_user_created`

---

## Step 4: Start Development Server

```bash
cd D:\GEO_SEO_Domination-Tool\web-app

# Install dependencies (if not already done)
npm install

# Start dev server
npm run dev
```

**Expected output:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

---

## Step 5: Test Authentication (5 minutes)

### 5.1 Create Test User

1. Open browser: http://localhost:3000/signup
2. Fill in:
   - Email: `test@geoseodomination.com`
   - Password: `GeoSEO2025!Test`
   - Confirm Password: `GeoSEO2025!Test`
3. Click "Sign Up"

**Expected:**
- Success message appears
- Email confirmation sent (check Supabase Auth logs)
- Redirect to login page

### 5.2 Confirm Email (Development Mode)

Since you're in development, auto-confirm the user:

1. Go to Supabase Dashboard > **Authentication** > **Users**
2. Find your test user
3. Click the `...` menu > **Confirm email**

### 5.3 Login

1. Go to http://localhost:3000/login
2. Enter:
   - Email: `test@geoseodomination.com`
   - Password: `GeoSEO2025!Test`
3. Click "Sign In"

**Expected:**
- Redirect to http://localhost:3000/ (home page)
- No errors in browser console

### 5.4 Verify Organisation Created

Go back to Supabase Dashboard > **SQL Editor**, run:

```sql
-- Get user info
SELECT id, email, created_at
FROM auth.users
WHERE email = 'test@geoseodomination.com';

-- Get organisation created for this user
SELECT
  o.id,
  o.name,
  o.slug,
  o.plan,
  om.role
FROM organisations o
JOIN organisation_members om ON om.organisation_id = o.id
JOIN auth.users u ON u.id = om.user_id
WHERE u.email = 'test@geoseodomination.com';
```

**Expected:**
- User exists with matching email
- Organisation exists with:
  - Name: `test@geoseodomination.com's Organisation`
  - Slug: `user-{user-id}`
  - Plan: `free`
  - Role: `owner`

---

## Step 6: Test Protected Routes

### 6.1 Test Redirect When Not Logged In

1. Logout (if logged in)
2. Try to visit: http://localhost:3000/companies

**Expected:**
- Redirect to: http://localhost:3000/login?redirectTo=/companies

### 6.2 Login and Access Protected Route

1. Login as test user
2. Visit: http://localhost:3000/companies

**Expected:**
- Page loads successfully
- Shows "No companies yet" or empty state

---

## Step 7: Test RLS Policies

### 7.1 Create a Company

1. Go to http://localhost:3000/companies
2. Click "Add Company" (if button exists) or use API:

```bash
# From terminal (while logged in)
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Test Local Business",
    "website": "https://testbusiness.com",
    "industry": "plumbing",
    "location": "San Francisco, CA"
  }'
```

### 7.2 Verify Data Isolation

Create a second test user:
1. Logout
2. Go to /signup
3. Create: `test2@geoseodomination.com` / `GeoSEO2025!Test`
4. Confirm and login as test2

Now try to access companies:
```bash
curl http://localhost:3000/api/companies
```

**Expected:**
- Empty array or "No companies"
- Does NOT show "Test Local Business" (belongs to user 1)

### 7.3 Verify in Database

In Supabase SQL Editor:

```sql
-- Should show company with organisation_id of user 1
SELECT
  c.id,
  c.name,
  c.organisation_id,
  o.name AS org_name,
  o.slug
FROM companies c
JOIN organisations o ON o.id = c.organisation_id
WHERE c.name = 'Test Local Business';
```

**Expected:**
- Company exists
- `organisation_id` matches user 1's organisation
- User 2 cannot see this when logged in (due to RLS)

---

## Step 8: Run Automated Tests

### 8.1 Make Test Script Executable

```bash
chmod +x test-auth-flow.sh
```

### 8.2 Set Environment Variables

```bash
export SUPABASE_ANON_KEY="your-anon-key-from-step-1.2"
```

### 8.3 Run Tests

```bash
./test-auth-flow.sh
```

**Expected output:**
```
==================================================
GEO-SEO Domination Tool - Auth & RLS Test Suite
==================================================

✓ PASS - Server is running
✓ PASS - Unauthenticated request blocked
✓ PASS - Login successful
✓ PASS - Authenticated request successful
...
==================================================
Test Summary
==================================================
Tests Passed: 10
Tests Failed: 0
Total Tests: 10

✓ All tests passed!
```

---

## Step 9: Verify RLS Policies

Run the SQL verification script:

1. Open Supabase Dashboard > SQL Editor
2. Copy contents of: `D:\GEO_SEO_Domination-Tool\RLS_VERIFICATION.sql`
3. Run each section one by one
4. Verify all checkboxes pass

**Key Checks:**
- [ ] All tables have RLS enabled
- [ ] Policies exist for SELECT, INSERT, UPDATE, DELETE
- [ ] Trigger fires on new user creation
- [ ] Organisation auto-created for new users
- [ ] Data isolation between organisations works

---

## Troubleshooting

### Issue: "Invalid API key"

**Solution:**
- Check `.env` file has correct Supabase credentials
- Restart dev server: `npm run dev`

### Issue: "User not in any organisation"

**Solution:**
```sql
-- Manually add user to organisation
INSERT INTO organisation_members (organisation_id, user_id, role)
VALUES (
  (SELECT id FROM organisations WHERE slug = 'default'),
  (SELECT id FROM auth.users WHERE email = 'test@geoseodomination.com'),
  'owner'
);
```

### Issue: Trigger not creating organisation

**Solution:**
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- If missing, re-run migration 008
```

### Issue: RLS blocking all queries

**Solution:**
```sql
-- Temporarily disable RLS for debugging (NOT IN PRODUCTION!)
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Run your query
SELECT * FROM companies;

-- Re-enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
```

### Issue: Cannot access /companies page

**Solution:**
1. Check browser console for errors
2. Verify logged in: Check for session cookie
3. Check middleware is running: Look for redirect to /login
4. Verify API route works:
   ```bash
   curl http://localhost:3000/api/companies -b cookies.txt
   ```

---

## Next Steps

Now that authentication is working:

1. **Test Full Workflow:**
   - Create companies
   - Add keywords
   - Run ranking checks
   - Generate reports

2. **Test Role Permissions:**
   - Create users with different roles (viewer, member, admin, owner)
   - Verify each role can only do what they're allowed

3. **Test Multi-Org:**
   - Create multiple organisations
   - Switch between them
   - Verify data isolation

4. **Deploy to Production:**
   - Follow production checklist in `AUTH_RLS_TESTING_REPORT.md`
   - Configure email provider
   - Enable rate limiting
   - Run security scan

---

## Summary

You now have:

✅ Supabase project configured
✅ Database migrations run
✅ RLS policies enabled
✅ Auto-organisation trigger installed
✅ Test users created
✅ Authentication working
✅ Data isolation verified
✅ Protected routes secured

**Time to complete:** ~15 minutes
**Test users created:** 2
**Companies created:** 1
**RLS policies verified:** 10+

---

## Quick Reference

**Test User 1:**
- Email: `test@geoseodomination.com`
- Password: `GeoSEO2025!Test`
- Role: Owner

**Test User 2:**
- Email: `test2@geoseodomination.com`
- Password: `GeoSEO2025!Test`
- Role: Owner (of different org)

**Key URLs:**
- Signup: http://localhost:3000/signup
- Login: http://localhost:3000/login
- Companies: http://localhost:3000/companies
- Dashboard: http://localhost:3000/dashboard

**Key Files:**
- Auth Report: `AUTH_RLS_TESTING_REPORT.md`
- RLS Verification: `RLS_VERIFICATION.sql`
- Test Script: `test-auth-flow.sh`
- Env Example: `web-app/.env.example`

---

**Need Help?**

Check the comprehensive documentation:
- `D:\GEO_SEO_Domination-Tool\AUTH_RLS_TESTING_REPORT.md`

Or review the migration files:
- `D:\GEO_SEO_Domination-Tool\database\migrations\003_multi_tenancy_foundation.sql`
- `D:\GEO_SEO_Domination-Tool\database\migrations\008_auto_add_users_to_organisation.sql`
