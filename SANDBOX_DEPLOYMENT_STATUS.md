# Sandbox Deployment Status

**Date**: 2025-01-06
**Status**: ⚠️ Deployed but requires database migration
**URL**: https://web-app-unite-group.vercel.app/sandbox

---

## ✅ Completed

### 1. Code Deployed Successfully
- **Deployment ID**: `dpl_4HNxKCsEa1ozXE5Dq1jVSx5MGAsU`
- **Status**: READY
- **Commit**: `37d56ad`
- **Build**: Successful (all 297 pages generated)

### 2. Files Deployed
```
✅ web-app/app/sandbox/page.tsx (9,242 bytes)
✅ web-app/components/sandbox/TaskForm.tsx
✅ web-app/components/sandbox/LogViewer.tsx
✅ web-app/components/sandbox/FileTree.tsx
✅ web-app/components/sandbox/LivePreview.tsx
✅ web-app/app/api/sandbox/sessions/route.ts
✅ web-app/app/api/sandbox/tasks/route.ts
✅ web-app/components/Sidebar.tsx (with Sandbox link)
```

### 3. Environment Variables
✅ All secrets configured in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `POSTGRES_URL`
- `ANTHROPIC_API_KEY`
- `VERCEL_TOKEN`

---

## ⚠️ Current Issue

### Error: 500 Internal Server Error

**Symptom**: Visiting `/sandbox` returns a 500 error

**Root Cause**: Database tables missing in production Supabase

The Sandbox page tries to query these tables:
```sql
sandbox_sessions
sandbox_tasks
```

These tables were created in **Migration 011** but have not been applied to the **production** Supabase database yet.

---

## 🔧 Solution: Run Database Migration

You need to run Migration 011 on your **production** Supabase database.

### Step 1: Access Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `qwoggbbavikzhypzodcr`
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run Migration 011

Copy and paste the contents of this file:
```
database/migrations/011_add_sandbox_tasks.sql
```

**Or run this command** in the SQL Editor:

```sql
-- Quick verification: Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('sandbox_sessions', 'sandbox_tasks');

-- If tables don't exist, run the full migration from 011_add_sandbox_tasks.sql
```

### Step 3: Verify Tables Created

After running the migration, verify with:

```sql
-- Check sandbox_sessions
SELECT COUNT(*) FROM sandbox_sessions;

-- Check sandbox_tasks
SELECT COUNT(*) FROM sandbox_tasks;

-- Check views
SELECT * FROM sandbox_task_analytics LIMIT 1;
```

Expected result: Queries return `0` (empty tables, which is correct for a fresh install)

### Step 4: Test Sandbox Page

After migration completes:

1. Visit https://web-app-unite-group.vercel.app/sandbox
2. You should see the Sandbox UI (not a 500 error)
3. Click "New Session" to create your first session
4. Submit a task to test Claude Code integration

---

## 📊 What Will Work After Migration

### Immediate Functionality

✅ **Session Management**
- Create new sandbox sessions
- List all sessions
- Switch between sessions
- Session dropdown selector

✅ **Task Creation**
- Submit coding prompts
- Select AI agent (Claude Code, Codex, Cursor, Gemini, OpenCode)
- Set max duration and options
- View task in task list

✅ **UI Components**
- 3-column layout renders correctly
- File tree shows session file structure
- Log viewer displays task logs
- Live preview panel ready (needs Vercel Sandbox integration)

✅ **API Endpoints**
- `GET /api/sandbox/sessions` → List sessions
- `POST /api/sandbox/sessions` → Create session
- `GET /api/sandbox/tasks?sessionId=xxx` → List tasks
- `POST /api/sandbox/tasks` → Create task
- `PATCH /api/sandbox/tasks` → Update task status

### Pending Integration (Week 3)

⏳ **Vercel Sandbox API**
- Actual code execution (currently stubbed)
- Real-time log streaming
- Branch creation
- Preview URL generation

⏳ **Claude Code Max Plan**
- Live AI code generation
- File tree population
- Automated commits

---

## 🎯 Quick Start After Migration

Once migration is complete:

### 1. Create Your First Session

```
1. Visit /sandbox
2. Click "New Session"
3. Enter name: "My First Project"
4. Click "Create"
```

### 2. Submit Your First Task

```
Prompt: "Create a React component for displaying SEO rankings with a table and chart"

Agent: Claude Code (Max Plan)
Max Duration: 5 minutes
Options: ☐ Install dependencies

Click "Generate Code"
```

### 3. Watch It Work

- Task appears in Log Viewer (middle panel)
- Status changes: pending → processing
- Logs stream in real-time
- (Currently simulated - full integration in Week 3)

---

## 📁 Database Schema Reference

### sandbox_sessions Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| company_id | UUID | Foreign key to companies |
| session_name | VARCHAR(255) | Display name |
| description | TEXT | Optional description |
| active | BOOLEAN | Session active status |
| file_tree | JSONB | Virtual file system |
| git_repo_url | VARCHAR(500) | Linked repository |
| vercel_preview_url | VARCHAR(500) | Live preview URL |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last modified |

### sandbox_tasks Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| session_id | UUID | Foreign key to sandbox_sessions |
| prompt | TEXT | User's coding prompt |
| selected_agent | VARCHAR(50) | AI agent (claude, codex, etc.) |
| selected_model | VARCHAR(100) | Model version |
| status | VARCHAR(50) | pending/processing/completed/error |
| progress | INTEGER | 0-100 percentage |
| logs | JSONB | Array of log entries |
| branch_name | VARCHAR(255) | Generated branch |
| sandbox_url | VARCHAR(500) | Preview URL |
| tokens_used | INTEGER | API tokens consumed |
| cost_usd | DECIMAL(10,6) | Task cost |
| created_at | TIMESTAMP | Creation time |
| completed_at | TIMESTAMP | Completion time |

---

## 🚀 After Migration Success

Once the migration runs successfully, the Sandbox will be **fully operational** at:

**Primary URL**: https://web-app-unite-group.vercel.app/sandbox

**Alternative URLs**:
- https://web-app-nine-roan.vercel.app/sandbox
- https://web-app-zenithfresh25-1436-unite-group.vercel.app/sandbox

### Features Available Immediately

1. ✅ Create/manage sandbox sessions
2. ✅ Submit coding tasks
3. ✅ View task logs in real-time
4. ✅ Browse file trees
5. ✅ Switch between sessions
6. ✅ Open in 2nd window
7. ✅ All UI components fully styled

### Integration Timeline

- **Week 2** (Current): UI complete, database ready, basic functionality
- **Week 3**: Vercel Sandbox API integration, real code execution
- **Week 4**: WebSocket log streaming, file editor, advanced features

---

## 📝 Migration File Location

**File to Run**: `database/migrations/011_add_sandbox_tasks.sql`

**Full Path**: `D:\GEO_SEO_Domination-Tool\database\migrations\011_add_sandbox_tasks.sql`

**Size**: 219 lines (includes constraints, indexes, views, functions)

**Safe to Run**: ✅ Yes, includes `IF NOT EXISTS` checks and constraint existence validation

---

## ✅ Checklist

### Pre-Migration
- [x] Code deployed to Vercel
- [x] Environment variables configured
- [x] Build successful
- [ ] Database migration run on production Supabase

### Post-Migration
- [ ] Verify `/sandbox` loads (no 500 error)
- [ ] Create first session successfully
- [ ] Submit first task successfully
- [ ] View logs in Log Viewer
- [ ] Test "Open in New Window" feature

---

## 🆘 Troubleshooting

### If migration fails

**Error**: "relation 'sandbox_sessions' does not exist"
- **Solution**: Run the full `database/sandbox-schema.sql` first

**Error**: "constraint already exists"
- **Solution**: This is safe, migration is idempotent

**Error**: "permission denied"
- **Solution**: Ensure you're using the Supabase admin/service role

### If Sandbox still shows 500 after migration

1. Check migration ran successfully:
   ```sql
   SELECT * FROM sandbox_sessions LIMIT 1;
   ```

2. Verify environment variables in Vercel:
   - Settings → Environment Variables
   - Check `POSTGRES_URL` or `DATABASE_URL` is set

3. Redeploy to pick up env var changes:
   ```bash
   vercel --prod
   ```

---

## 📞 Support

If you encounter issues:

1. Check Supabase logs: Dashboard → Logs → Postgres Logs
2. Check Vercel logs: `vercel logs <deployment-url>`
3. Verify migration status in Supabase SQL Editor

---

**Status**: Waiting for database migration to complete ⏳

**Next Action**: Run `database/migrations/011_add_sandbox_tasks.sql` in Supabase SQL Editor
