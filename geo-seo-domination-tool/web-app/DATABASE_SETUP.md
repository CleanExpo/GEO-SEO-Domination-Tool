# Database Setup Guide

## Overview

This guide explains how to set up the Supabase database with proper Row Level Security (RLS) policies for the GEO-SEO Domination Tool.

## Prerequisites

1. Supabase account: https://app.supabase.com
2. Project created in Supabase
3. Environment variables configured in Vercel/local `.env.local`

## Step 1: Create Tables

1. Go to your Supabase project: https://app.supabase.com/project/YOUR_PROJECT_ID
2. Navigate to **SQL Editor** → **New Query**
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click **Run** to execute the SQL

This will create:
- ✅ 20 database tables
- ✅ All foreign key relationships
- ✅ Performance indexes
- ✅ Automatic timestamp triggers

## Step 2: Enable Row Level Security (RLS)

**IMPORTANT:** Do this AFTER authentication is working to avoid locking yourself out!

1. Go to **SQL Editor** → **New Query**
2. Copy and paste the entire contents of `supabase-rls-policies.sql`
3. Click **Run** to execute the SQL

This will:
- ✅ Enable RLS on all tables
- ✅ Create policies for authenticated users
- ✅ Set up proper data isolation
- ✅ Add automatic updated_at triggers

## Step 3: Configure Environment Variables

Add these to your Vercel Environment Variables or local `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these values:**
1. Go to **Project Settings** → **API**
2. Copy the **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
3. Copy the **anon/public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

## Step 4: Enable Authentication Providers

### Email/Password (Enabled by default)
No setup required.

### Google OAuth (Optional but recommended)
1. Go to **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. Add your OAuth credentials from Google Cloud Console
4. Add authorized redirect URLs:
   - `https://your-project-id.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)

## Step 5: Test the Setup

### Test Database Connection:
```typescript
import { createClient } from '@/lib/auth/supabase-client'

const supabase = createClient()
const { data, error } = await supabase.from('companies').select('*').limit(1)

if (error) {
  console.error('Database connection failed:', error)
} else {
  console.log('Database connected successfully!')
}
```

### Test Authentication:
1. Navigate to `/login`
2. Try signing up with email/password
3. Check Supabase Dashboard → **Authentication** → **Users**
4. You should see your new user account

## Security Best Practices

### ✅ DO:
- Enable RLS on ALL tables
- Use authenticated user policies for user data
- Test policies thoroughly before going to production
- Use the Supabase client in API routes (server-side)
- Validate all user inputs
- Keep service_role key secret (never expose to client)

### ❌ DON'T:
- Disable RLS in production
- Use service_role key in client-side code
- Trust client-side validation alone
- Store sensitive data without encryption
- Expose internal database structure to clients

## Row Level Security (RLS) Policy Structure

### Companies, Keywords, Rankings, SEO Audits:
- Users can only access data for their own companies
- Authenticated users required for all operations
- Foreign key relationships enforced

### CRM (Contacts, Deals, Tasks, Events):
- Users can only access their own CRM data
- Full CRUD operations for authenticated users

### Projects & Notes:
- Users can only access their own projects
- Project notes inherit project permissions

### Resources (Prompts, Components, AI Tools, Tutorials):
- **Public read access** for all users
- **Write access** requires authentication
- Designed for community sharing

### Notifications:
- Users can only access their own preferences and history
- Queue is service-role only (background jobs)

## Troubleshooting

### Error: "new row violates row-level security policy"
**Solution:** Make sure you're authenticated. Check:
```typescript
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user)
```

### Error: "relation does not exist"
**Solution:** Tables not created. Re-run `supabase-schema.sql`

### Error: "permission denied for table"
**Solution:** RLS policy too restrictive. Check:
1. Are you authenticated?
2. Does the policy allow your operation?
3. Test with RLS temporarily disabled (development only):
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY; -- DEVELOPMENT ONLY
```

### Authentication not working:
**Solution:** Check:
1. Environment variables are correct
2. Supabase URL and anon key are set
3. Middleware is properly configured
4. Browser cookies are enabled

## Monitoring & Maintenance

### Check RLS Status:
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### View Active Policies:
```sql
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### Monitor Query Performance:
1. Go to **Database** → **Query Performance**
2. Look for slow queries
3. Add indexes as needed

## Next Steps

After database setup:
1. ✅ Test authentication flows
2. ✅ Verify RLS policies work correctly
3. ✅ Create seed data for development
4. ✅ Set up database backups in Supabase
5. ✅ Configure Point-in-Time Recovery (PITR)

## Support

- Supabase Docs: https://supabase.com/docs
- RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
- Community: https://github.com/supabase/supabase/discussions
