# Post-Audit Automation Migration Instructions

## Issue: Database Connection Error

The automated migration script is failing with "Tenant or user not found" error. This indicates the Supabase pooler credentials may need verification.

## ✅ **RECOMMENDED: Manual Migration via Supabase SQL Editor**

This is the most reliable method and takes only 2 minutes:

### Steps:

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr
   - Navigate to: **SQL Editor** (left sidebar)

2. **Create New Query**
   - Click **"New query"** button

3. **Copy Schema SQL**
   - Open file: `database/post-audit-automation-schema.sql`
   - Select all (Ctrl+A / Cmd+A)
   - Copy (Ctrl+C / Cmd+C)

4. **Paste and Execute**
   - Paste the SQL into the Supabase SQL Editor
   - Click **"Run"** button (or press Ctrl+Enter / Cmd+Enter)

5. **Verify Success**
   - You should see success messages for each CREATE TABLE statement
   - Some "already exists" warnings are normal (safe to ignore)

6. **Verify Tables Created**
   - Navigate to: **Table Editor** (left sidebar)
   - Confirm these 6 new tables exist:
     - ✅ `website_credentials` (30+ columns for WordPress, FTP, GitHub, Vercel credentials)
     - ✅ `agent_tasks` (40+ columns for task management, execution tracking)
     - ✅ `task_execution_logs` (detailed execution history)
     - ✅ `task_templates` (reusable task templates)
     - ✅ `credentials_access_log` (security audit log)
     - ✅ `automation_rules` (automation rule definitions)

---

## Alternative: Fix Database Connection

If you prefer to fix the automated script, try these steps:

### Option A: Verify Supabase Password

The pooler connection requires the correct database password:

```bash
# Test connection manually
psql "postgresql://postgres.qwoggbbavikzhypzodcr:3McFC5u51nUOJ2IB@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres"
```

If this fails, reset your database password:
1. Go to: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/settings/database
2. Click "Reset database password"
3. Update `.env.local` with new password in `POSTGRES_URL`

### Option B: Use Direct Connection (Not Pooler)

Try the direct connection endpoint instead:

```bash
# In .env.local, replace POSTGRES_URL with:
POSTGRES_URL="postgresql://postgres:[PASSWORD]@db.qwoggbbavikzhypzodcr.supabase.co:5432/postgres"
```

Replace `[PASSWORD]` with your actual database password.

---

## After Migration: Next Steps

Once tables are created, proceed with:

### 1. Generate Encryption Key

```bash
openssl rand -base64 32
```

Add to `.env.local`:
```env
CREDENTIALS_ENCRYPTION_KEY="your_generated_key_here"
```

### 2. Test Encryption

```bash
node scripts/test-credential-encryption.mjs
```

### 3. Build API Endpoints

Create these endpoints:
- `POST /api/companies/[id]/credentials` - Save/update credentials
- `POST /api/agent-tasks/create-from-audit` - Auto-generate tasks from audit
- `POST /api/agent-tasks/[id]/execute` - Execute agent task
- `GET /api/agent-tasks/[id]/progress` - Real-time progress tracking

### 4. Build UI Components

Create these components:
- Credentials management form (Company Profile)
- Task list dashboard (view pending/in-progress/completed tasks)
- Progress viewer (real-time task execution logs)
- Approval workflow (for high-risk tasks)

---

## Schema Overview

The migration creates a complete post-audit automation system:

### 📦 **Tables Created:**

1. **website_credentials** - Encrypted credential storage
   - WordPress (REST API, username, app password)
   - FTP (host, username, password)
   - GitHub (repo, token)
   - Vercel (project, token)
   - Shopify (store, API key/token)
   - SSH (host, username, key)

2. **agent_tasks** - Automation task queue
   - Task type (add_h1_tag, optimize_images, etc.)
   - Priority (critical, high, medium, low)
   - Status (pending, in_progress, completed, failed)
   - Agent type (claude_computer_use, wp_rest_api, github_copilot)
   - Execution logs (JSON array)
   - Rollback data (for failed changes)

3. **task_execution_logs** - Detailed execution history
   - Start/end timestamps
   - Success/failure status
   - Output logs
   - Error messages

4. **task_templates** - Reusable task templates
   - Pre-configured instructions
   - Default agent types
   - Estimated execution times

5. **credentials_access_log** - Security audit trail
   - Who accessed credentials
   - When they were accessed
   - What they were used for

6. **automation_rules** - Automation rule definitions
   - Trigger conditions
   - Actions to execute
   - Priority assignments

### 🔒 **Security Features:**

- ✅ AES-256-GCM encryption for all credentials
- ✅ Unique IV (initialization vector) per credential
- ✅ Authentication tags for integrity verification
- ✅ Access logging for security audits
- ✅ Encrypted fields suffixed with `_encrypted`

### 🎯 **Task Intelligence:**

The system automatically maps 20+ audit issues to executable tasks:

- **Content Issues:** Missing H1, thin content, duplicate meta tags
- **Performance Issues:** Unoptimized images, blocking resources, excessive DOM size
- **SEO Issues:** Missing alt text, broken links, poor mobile usability
- **Accessibility Issues:** Low contrast, missing ARIA labels
- **Security Issues:** Mixed content, insecure resources

---

## Questions?

If you encounter any issues during migration, check:

1. ✅ Supabase project is active (not paused)
2. ✅ Database password is correct
3. ✅ Network connection is stable
4. ✅ `.env.local` has correct credentials

**Recommended:** Use the Supabase SQL Editor method (quickest and most reliable).
