# Fix Company Creation Issue - Deployment Guide

## Issue Summary

**Problem**: Users cannot create companies on production (`https://geo-seo-domination-tool.vercel.app`)

**Root Causes Identified**:
1. Migration 008 trigger not applied (auto-create organisations for new users)
2. RLS policy conflict between different migration files
3. Existing production users don't have organisation memberships
4. Companies table missing `organisation_id` or has NULL values

## Fix Overview

The `database/FIX_COMPANY_CREATION.sql` script will:
1. ✅ Create/verify organisations and organisation_members tables
2. ✅ Create default organisation
3. ✅ Auto-create personal organisations for existing users
4. ✅ Add organisation_id to companies table
5. ✅ Fix RLS policies for proper multi-tenant access
6. ✅ Install trigger for auto-organisation creation on signup
7. ✅ Add performance indexes

## Deployment Steps

### Option 1: Via Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Navigate to `SQL Editor` in left sidebar
   - Click `New Query`

3. **Run the Fix Script**
   - Copy entire contents of `database/FIX_COMPANY_CREATION.sql`
   - Paste into SQL editor
   - Click `Run` or press `Ctrl+Enter`

4. **Verify Results**
   - Check the verification queries at the end of the script
   - Ensure all users have organisations
   - Ensure all companies have organisation_id

### Option 2: Via Supabase CLI

```bash
# Make sure you're in the project root
cd d:/GEO_SEO_Domination-Tool

# Login to Supabase (if not already)
npx supabase login

# Link to your production project
npx supabase link --project-ref <your-project-ref>

# Run the migration
npx supabase db push --include-all --db-url "<your-production-db-url>"

# Or run the script directly
psql "<your-production-db-url>" -f database/FIX_COMPANY_CREATION.sql
```

### Option 3: Via psql Command (Direct)

```bash
# Get your database URL from Supabase Dashboard > Settings > Database > Connection string
# Format: postgresql://postgres:[password]@[host]:[port]/postgres

psql "postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres" \
  -f database/FIX_COMPANY_CREATION.sql
```

## Post-Deployment Testing

### Test 1: Verify Database State

Run these queries in Supabase SQL Editor:

```sql
-- Should show at least 2 organisations (default + user orgs)
SELECT COUNT(*) as org_count FROM organisations;

-- Should show at least 1 membership per user
SELECT COUNT(*) as membership_count FROM organisation_members;

-- Should be 0 (all users have organisations)
SELECT COUNT(*) as users_without_org
FROM auth.users u
LEFT JOIN organisation_members om ON u.id = om.user_id
WHERE om.id IS NULL;

-- Check RLS policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'companies' 
AND schemaname = 'public';
```

### Test 2: Test Company Creation via Production UI

1. Login to production: `https://geo-seo-domination-tool.vercel.app`
2. Navigate to Companies page
3. Click "Add Company"
4. Fill in form:
   - Name: "Test Company Fix"
   - Website: "https://testcompany.com"
   - Industry: "Technology"
   - Location: "Sydney"
5. Submit form
6. ✅ Company should be created successfully
7. ✅ Should appear in companies list

### Test 3: Test via API Directly

```bash
# Get your auth token from browser DevTools
# Application > Local Storage > supabase.auth.token

# Test GET /api/companies
curl https://geo-seo-domination-tool.vercel.app/api/companies \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test POST /api/companies
curl -X POST https://geo-seo-domination-tool.vercel.app/api/companies \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Company",
    "website": "https://apitest.com",
    "industry": "Testing",
    "location": "Melbourne"
  }'
```

## Rollback Plan

If something goes wrong, you can rollback by running:

```sql
BEGIN;

-- Disable RLS temporarily
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Remove organisation_id constraint
ALTER TABLE companies ALTER COLUMN organisation_id DROP NOT NULL;

-- Restore old simple policies
DROP POLICY IF EXISTS "Users can view companies" ON companies;
DROP POLICY IF EXISTS "Users can insert companies" ON companies;
DROP POLICY IF EXISTS "Users can update companies" ON companies;
DROP POLICY IF EXISTS "Users can delete companies" ON companies;

CREATE POLICY "Users can view own companies" ON companies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own companies" ON companies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies" ON companies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies" ON companies
  FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

COMMIT;
```

## Expected Outcomes

After successful deployment:

✅ All existing users have personal organisations
✅ New signups automatically get organisations
✅ Companies table has organisation_id for all rows
✅ RLS policies allow proper multi-tenant access
✅ Company creation works on production
✅ No breaking changes to existing functionality

## Troubleshooting

### Issue: "Users without organisations"

**Solution**: Re-run Step 3 of the fix script
```sql
-- Run the DO block from FIX_COMPANY_CREATION.sql Step 3
```

### Issue: "RLS policy error on insert"

**Solution**: Check user has organisation membership
```sql
SELECT om.* 
FROM organisation_members om
WHERE om.user_id = 'USER_ID_HERE';
```

### Issue: "Unauthorised: User not member of any organisation"

**Solution**: Manually add user to default organisation
```sql
INSERT INTO organisation_members (organisation_id, user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'USER_ID_HERE', 'member')
ON CONFLICT DO NOTHING;
```

## Contact

If you encounter issues during deployment:
1. Check the verification queries output
2. Review Supabase logs for SQL errors
3. Test with a single user account first
4. Verify RLS policies are correctly applied

## Next Steps After Fix

Once company creation is working:
1. ✅ Test all CRUD operations (Create, Read, Update, Delete)
2. ✅ Test with multiple users
3. ✅ Verify data isolation between organisations
4. ✅ Monitor production for any RLS-related errors
5. ✅ Consider adding organisation switcher UI
