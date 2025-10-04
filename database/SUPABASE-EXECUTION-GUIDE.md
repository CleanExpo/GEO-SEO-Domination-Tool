# Supabase Database Setup - Complete Execution Guide

## Overview

This guide provides step-by-step instructions for executing all 8 SQL files in the correct order to set up your complete database schema for the GEO SEO Domination Tool.

**Total Tables Created**: 35
**Total Views Created**: 2 (crm_events, resource_ai_tools)
**Total Functions Created**: 10
**Total Triggers Created**: 30+

---

## Prerequisites

1. **Supabase Project Created**: You have a Supabase project at supabase.com
2. **SQL Editor Access**: Navigate to SQL Editor in your Supabase dashboard
3. **Admin Access**: You're logged in as project owner/admin

---

## Execution Order

Execute these files **ONE AT A TIME** in the exact order listed below. Wait for each file to complete successfully before proceeding to the next.

### File 1: SUPABASE-01-auth-tables.sql
**Purpose**: Authentication and user management tables
**Tables Created**: 3 (profiles, user_settings, user_api_keys)
**Dependencies**: None (uses auth.users built-in table)

**Expected Result**: "Success. No rows returned" or verification query showing 3 tables

---

### File 2: SUPABASE-02-core-seo.sql
**Purpose**: Core SEO tracking functionality
**Tables Created**: 4 (companies, keywords, rankings, seo_audits)
**Dependencies**: auth.users

**Expected Result**: Verification query showing 4 tables with column counts

---

### File 3: SUPABASE-03-crm.sql
**Purpose**: CRM system tables
**Tables Created**: 6 (crm_contacts, crm_deals, crm_tasks, crm_calendar_events, crm_event_attendees, crm_support_tickets)
**Views Created**: 1 (crm_events alias for crm_calendar_events)
**Dependencies**: auth.users, crm_contacts (for foreign keys)

**Expected Result**: Verification showing 6 tables + 1 view

---

### File 4: SUPABASE-04-projects.sql
**Purpose**: Project management and hub tables
**Tables Created**: 9 (hub_projects, hub_collections, hub_collection_projects, project_templates, generated_projects, crm_projects, crm_project_members, crm_project_notes, crm_github_projects)
**Dependencies**: auth.users, hub_projects, hub_collections, crm_projects

**Expected Result**: Verification showing 9 tables

---

### File 5: SUPABASE-05-resources.sql
**Purpose**: Resource library (prompts, components, AI tools, tutorials)
**Tables Created**: 5 (crm_prompts, crm_components, crm_ai_tools, crm_tutorials, resource_categories)
**Views Created**: 1 (resource_ai_tools alias for crm_ai_tools)
**Dependencies**: auth.users

**Expected Result**: Verification showing 5 tables + 1 view

---

### File 6: SUPABASE-06-job-scheduler.sql
**Purpose**: Job scheduling, execution tracking, and reporting
**Tables Created**: 4 (job_executions, job_schedules, reports, job_alerts)
**Functions Created**: 3 (cleanup_old_job_executions, get_job_statistics, get_ranking_trends)
**Dependencies**: auth.users, companies, keywords, rankings

**Expected Result**: Verification showing 4 tables + 3 functions

**Note**: This file also inserts 4 default job schedules

---

### File 7: SUPABASE-07-enable-rls.sql
**Purpose**: Enable Row Level Security on all tables
**Policies Created**: 100+ (4 policies per table: SELECT, INSERT, UPDATE, DELETE)
**Dependencies**: All tables from Files 1-6

**Expected Result**:
- All tables show `rowsecurity = true`
- Policy count verification shows multiple policies per table

**IMPORTANT**: This file enables data isolation. After this, users can only see their own data.

---

### File 8: SUPABASE-08-create-triggers.sql
**Purpose**: Create database triggers for automation
**Triggers Created**: 30+
**Functions Created**: 7
**Dependencies**: All tables from Files 1-7

**Triggers Include**:
- Auto-profile creation on user signup
- Auto-update `updated_at` timestamps (23 tables)
- Auto-calculate ranking changes
- Auto-update keyword current_rank
- Auto-update company timestamps

**Expected Result**: Verification showing all triggers and functions created

---

## Step-by-Step Execution Process

### For Each File:

1. **Open SQL Editor** in Supabase dashboard
2. **Create New Query** (click "New query" button)
3. **Copy File Contents** from `database/SUPABASE-XX-xxxxx.sql`
4. **Paste Into SQL Editor**
5. **Review the SQL** (optional but recommended)
6. **Click "Run"** button
7. **Wait for Completion** (usually 1-5 seconds)
8. **Check Results**:
   - ✅ Look for "Success" message
   - ✅ Review verification query output (at end of each file)
   - ✅ Ensure no error messages appear
9. **If Errors Occur**:
   - ❌ **STOP** - Do not proceed to next file
   - Copy the error message
   - Report the error (include file name and error text)
   - Wait for fix before continuing
10. **If Success**:
   - ✅ Move to next file
   - Repeat process

---

## Verification After All Files Complete

Run this query to verify all tables are created:

```sql
SELECT
  table_name,
  table_type,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected Output**: 35 tables + 2 views = 37 rows

---

## Common Issues and Solutions

### Issue 1: "Column does not exist" Error
**Solution**: You may have run files out of order. Start over from File 1.

### Issue 2: "Table already exists" Error
**Solution**: This is OK if re-running. The `IF NOT EXISTS` clauses prevent errors.

### Issue 3: "Policy already exists" Error (File 7)
**Solution**: This is OK. The `DROP POLICY IF EXISTS` statements handle this.

### Issue 4: RLS Prevents Data Access
**Solution**: Ensure you're authenticated in Supabase. RLS policies filter by `auth.uid()`.

### Issue 5: Trigger Not Firing
**Solution**: Check that File 8 completed without errors. Re-run if needed.

---

## Post-Setup Configuration

After all files execute successfully:

### 1. Create Your First User
- Use Supabase Auth to create a test user
- The `handle_new_user` trigger will auto-create a profile with role='free'

### 2. Create an Admin User (Optional)
```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

### 3. Test RLS Policies
- Log in as test user
- Try creating a company, keyword, or audit
- Verify you can only see your own data

### 4. Verify Job Schedules
```sql
SELECT * FROM job_schedules;
```

Should show 4 default schedules:
- audit-runner (daily at 2am)
- ranking-tracker (daily at 3am)
- ranking-tracker-hourly (disabled)
- report-generator (weekly Monday 8am)

---

## Table Relationships Overview

```
auth.users (Supabase built-in)
  ├── profiles (1:1)
  ├── user_settings (1:1)
  ├── user_api_keys (1:many)
  ├── companies (1:many)
  │   ├── keywords (1:many)
  │   │   └── rankings (1:many)
  │   ├── seo_audits (1:many)
  │   └── reports (1:many)
  ├── crm_contacts (1:many)
  │   ├── crm_deals (1:many)
  │   ├── crm_tasks (1:many)
  │   └── crm_calendar_events (1:many)
  │       └── crm_event_attendees (1:many)
  ├── hub_projects (1:many)
  ├── crm_projects (1:many)
  │   ├── crm_project_members (1:many)
  │   └── crm_project_notes (1:many)
  ├── crm_prompts (1:many)
  ├── job_executions (1:many)
  └── job_schedules (1:many)
```

---

## Environment Variables Needed

After database setup, ensure these are set in your `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Keys (for integrations)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
SEMRUSH_API_KEY=...
FIRECRAWL_API_KEY=fc-...

# Email (optional)
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_...
EMAIL_FROM=noreply@example.com
```

---

## Next Steps After Database Setup

1. ✅ **Test Database Connection**: Run `npm run db:test` locally
2. ✅ **Deploy to Vercel**: Set environment variables in Vercel dashboard
3. ✅ **Test Authentication**: Sign up a new user, verify profile created
4. ✅ **Test RLS**: Create data as different users, verify isolation
5. ✅ **Enable Job Scheduler**: Configure cron jobs in production
6. ✅ **Run First Audit**: Test SEO audit functionality
7. ✅ **Monitor Logs**: Check Supabase logs for any errors

---

## Support

If you encounter issues:

1. **Check Supabase Logs**: Dashboard → Logs → Database logs
2. **Review Error Message**: Copy full error text
3. **Check Dependencies**: Ensure previous files completed successfully
4. **Restart Fresh**: If needed, drop all tables and start from File 1

---

## Summary

**Total Execution Time**: ~2-5 minutes (all 8 files)
**Manual Steps**: 8 (one per file)
**Automated Setup**: Triggers, RLS policies, default data

Once complete, your database is fully configured and ready for production use!
