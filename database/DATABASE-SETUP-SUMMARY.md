# Database Setup Summary - Quick Reference

## 🎯 What We've Created

**8 SQL Files** to execute in order, creating a complete production database schema.

---

## 📋 File Execution Checklist

Copy this checklist and mark off as you complete each file:

- [ ] **File 1**: SUPABASE-01-auth-tables.sql (3 tables)
- [ ] **File 2**: SUPABASE-02-core-seo.sql (4 tables)
- [ ] **File 3**: SUPABASE-03-crm.sql (6 tables + 1 view)
- [ ] **File 4**: SUPABASE-04-projects.sql (9 tables)
- [ ] **File 5**: SUPABASE-05-resources.sql (5 tables + 1 view)
- [ ] **File 6**: SUPABASE-06-job-scheduler.sql (4 tables + 3 functions)
- [ ] **File 7**: SUPABASE-07-enable-rls.sql (100+ policies)
- [ ] **File 8**: SUPABASE-08-create-triggers.sql (30+ triggers + 7 functions)

---

## 📊 Database Statistics

| Metric | Count |
|--------|-------|
| **Total Tables** | 35 |
| **Total Views** | 2 |
| **Total Functions** | 10 |
| **Total Triggers** | 30+ |
| **RLS Policies** | 100+ |
| **Execution Time** | ~2-5 minutes |

---

## 🗂️ Tables by Category

### Authentication & Users (3)
- `profiles` - User roles and info
- `user_settings` - User preferences
- `user_api_keys` - API key management

### Core SEO (4)
- `companies` - Company/client tracking
- `keywords` - Keyword monitoring
- `rankings` - Historical ranking data
- `seo_audits` - Audit results

### CRM (6)
- `crm_contacts` - Contacts/leads
- `crm_deals` - Sales pipeline
- `crm_tasks` - Task management
- `crm_calendar_events` - Calendar & meetings
- `crm_event_attendees` - Event attendees
- `crm_support_tickets` - Support system

### Projects (9)
- `hub_projects` - Project registry
- `hub_collections` - Project collections
- `hub_collection_projects` - Collection mapping
- `project_templates` - Scaffolding templates
- `generated_projects` - Generated project tracking
- `crm_projects` - CRM projects
- `crm_project_members` - Team members
- `crm_project_notes` - Project notes
- `crm_github_projects` - GitHub integration

### Resources (5)
- `crm_prompts` - AI prompt library
- `crm_components` - Code component library
- `crm_ai_tools` - AI tools directory
- `crm_tutorials` - Tutorial library
- `resource_categories` - Resource categorization

### Job Scheduler (4)
- `job_executions` - Job run history
- `job_schedules` - Cron schedules
- `reports` - Generated reports
- `job_alerts` - Job alerts/notifications

---

## 🔑 Key Design Decisions

### UUID Primary Keys
All tables use `UUID` instead of `INTEGER` for better scalability and security.

### TIMESTAMPTZ Timestamps
All timestamps use `TIMESTAMPTZ` for timezone awareness.

### user_id on Every Table
Every table has `user_id UUID REFERENCES auth.users(id)` for RLS filtering.

### Profiles Table Exception
`profiles.id` IS the user ID (references `auth.users.id`), no separate `user_id` column.

### View Aliases
- `crm_events` → alias for `crm_calendar_events`
- `resource_ai_tools` → alias for `crm_ai_tools`

These provide backward compatibility with existing API routes.

---

## 🔒 Row Level Security (RLS)

**All tables have RLS enabled** with standard policies:

1. **SELECT**: Users can view own data (`auth.uid() = user_id`)
2. **INSERT**: Users can insert own data (`auth.uid() = user_id`)
3. **UPDATE**: Users can update own data (`auth.uid() = user_id`)
4. **DELETE**: Users can delete own data (`auth.uid() = user_id`)

**Admin Exception**: `profiles` table has additional policies for admin role.

---

## ⚡ Automated Triggers

### Auto-Profile Creation
When user signs up → profile automatically created with `role='free'`

### Auto-Timestamp Updates
23 tables have `updated_at` auto-updated on every UPDATE

### Business Logic Automation
- **Rankings**: Auto-calculate `rank_change` based on previous ranking
- **Keywords**: Auto-update `current_rank` when new ranking added
- **Companies**: Auto-update timestamp when keywords/audits modified

---

## 🚀 Quick Start Commands

### Execute in Supabase SQL Editor
1. Open https://supabase.com → Your Project → SQL Editor
2. Copy contents of `SUPABASE-01-auth-tables.sql`
3. Paste and click "Run"
4. Verify success (check output)
5. Repeat for files 2-8

### Verify All Tables Created
```sql
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';
```
**Expected**: 35 tables

### Check RLS Enabled
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
```
**Expected**: 35 tables

### List All Policies
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```
**Expected**: 100+ policies across all tables

---

## ⚠️ Critical Notes

### Execution Order Matters
Files MUST be run in order 1→2→3→4→5→6→7→8. Dependencies will fail otherwise.

### One File at a Time
Wait for each file to complete successfully before proceeding to next.

### RLS Blocks Unauthenticated Access
After File 7, all queries must be authenticated or they'll return empty results.

### Service Role Bypasses RLS
Use `SUPABASE_SERVICE_ROLE_KEY` for server-side operations that need full access.

---

## 🔧 Post-Setup Tasks

### 1. Create Admin User
```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### 2. Test Authentication
- Sign up new user via Supabase Auth
- Verify profile auto-created
- Check role is 'free'

### 3. Set Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Deploy to Vercel
- Set environment variables in Vercel dashboard
- Redeploy application
- Test production database connection

---

## 📚 Documentation Files

- **SUPABASE-EXECUTION-GUIDE.md** - Detailed step-by-step instructions
- **DATABASE-SETUP-SUMMARY.md** - This quick reference
- **SUPABASE-01 through 08.sql** - The actual SQL files to execute

---

## ✅ Success Criteria

You'll know setup is complete when:

1. ✅ All 8 files executed without errors
2. ✅ 35 tables exist in database
3. ✅ All tables have RLS enabled
4. ✅ New user signup creates profile automatically
5. ✅ Users can only see their own data
6. ✅ `updated_at` timestamps update automatically
7. ✅ Job schedules table has 4 default entries

---

## 🆘 Troubleshooting

**Error: "column user_id does not exist"**
→ You skipped a file or ran out of order. Start over from File 1.

**Error: "relation does not exist"**
→ Previous file didn't complete. Re-run the previous file.

**Error: "permission denied"**
→ Check you're using correct Supabase project and have admin access.

**Empty query results after File 7**
→ This is expected. RLS is now enabled. Authenticate to see data.

---

## 📞 Support

For issues during setup:
1. Check Supabase Dashboard → Logs
2. Review the exact error message
3. Verify all previous files completed successfully
4. Consult SUPABASE-EXECUTION-GUIDE.md for detailed troubleshooting

---

**Ready to begin?** Start with File 1: `SUPABASE-01-auth-tables.sql` 🚀
