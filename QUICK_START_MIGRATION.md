# Quick Start: Post-Audit Automation Migration

**Time Required:** 5 minutes
**Difficulty:** Easy

---

## 🎯 Goal

Create 6 new database tables in Supabase to enable post-audit automation:
1. `website_credentials` - Encrypted credential storage
2. `agent_tasks` - Automation task queue
3. `task_execution_logs` - Execution history
4. `task_templates` - Reusable templates
5. `credentials_access_log` - Security audit log
6. `automation_rules` - Automation rules

---

## ✅ Step 1: Open Supabase SQL Editor (30 seconds)

1. Go to: **https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr**
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"** button

---

## ✅ Step 2: Copy Schema SQL (10 seconds)

1. In VS Code, open: **`database/post-audit-automation-schema.sql`**
2. Select all: **Ctrl+A** (Windows) or **Cmd+A** (Mac)
3. Copy: **Ctrl+C** (Windows) or **Cmd+C** (Mac)

---

## ✅ Step 3: Execute Migration (10 seconds)

1. Paste SQL into Supabase SQL Editor: **Ctrl+V** (Windows) or **Cmd+V** (Mac)
2. Click **"Run"** button (or press **Ctrl+Enter** / **Cmd+Enter**)
3. Wait for success message (should take ~5 seconds)

**Expected Output:**
```
✅ CREATE TABLE website_credentials
✅ CREATE TABLE agent_tasks
✅ CREATE TABLE task_execution_logs
✅ CREATE TABLE task_templates
✅ CREATE TABLE credentials_access_log
✅ CREATE TABLE automation_rules
✅ CREATE INDEX idx_website_credentials_company_id
✅ CREATE INDEX idx_agent_tasks_company_id
... (more success messages)
```

**Note:** Some "already exists" warnings are normal if you've run this before. Safe to ignore.

---

## ✅ Step 4: Verify Tables Created (1 minute)

1. Click **"Table Editor"** in the left sidebar
2. Scroll down and confirm these 6 new tables exist:
   - ✅ `website_credentials`
   - ✅ `agent_tasks`
   - ✅ `task_execution_logs`
   - ✅ `task_templates`
   - ✅ `credentials_access_log`
   - ✅ `automation_rules`

---

## ✅ Step 5: Generate Encryption Key (2 minutes)

### Windows (PowerShell):
```powershell
# Generate 32-byte random key
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### Mac/Linux (Terminal):
```bash
openssl rand -base64 32
```

**Copy the output** (should look like: `abc123XYZ...`)

---

## ✅ Step 6: Add Encryption Key to .env.local (1 minute)

1. Open: **`.env.local`** in VS Code
2. Scroll to the bottom
3. Add this line:
```env
CREDENTIALS_ENCRYPTION_KEY="paste_your_key_here"
```

**Example:**
```env
CREDENTIALS_ENCRYPTION_KEY="abc123XYZ456def789GHI012jkl345MNO678pqr="
```

4. Save file: **Ctrl+S** (Windows) or **Cmd+S** (Mac)

---

## ✅ Step 7: Test Encryption (1 minute)

Run this command to verify encryption is working:

```bash
node -e "console.log('Encryption key loaded:', process.env.CREDENTIALS_ENCRYPTION_KEY ? '✅ YES' : '❌ NO')"
```

**Expected Output:**
```
Encryption key loaded: ✅ YES
```

---

## 🎉 Done!

You've successfully set up the Post-Audit Automation database infrastructure!

---

## 📝 What's Next?

Now that the database is ready, you can:

### 1. Build API Endpoints (30 minutes each)
- `POST /api/companies/[id]/credentials` - Save credentials
- `POST /api/agent-tasks/create-from-audit` - Generate tasks from audit
- `POST /api/agent-tasks/[id]/execute` - Execute task
- `GET /api/agent-tasks/[id]/progress` - Track progress

### 2. Build UI Components (1 hour each)
- Credentials management form
- Task list dashboard
- Progress viewer
- Approval workflow

### 3. Build Agent Executors (1 hour each)
- WordPress REST API executor
- FTP script executor
- GitHub API executor
- Claude Computer Use executor

---

## ❓ Troubleshooting

### Issue: SQL Editor shows errors
**Solution:** Check if tables already exist. If so, drop them first:
```sql
DROP TABLE IF EXISTS automation_rules CASCADE;
DROP TABLE IF EXISTS credentials_access_log CASCADE;
DROP TABLE IF EXISTS task_templates CASCADE;
DROP TABLE IF EXISTS task_execution_logs CASCADE;
DROP TABLE IF EXISTS agent_tasks CASCADE;
DROP TABLE IF EXISTS website_credentials CASCADE;
```
Then re-run the full schema.

### Issue: Can't access Supabase dashboard
**Solution:** Check if you're logged in:
1. Go to: https://supabase.com/dashboard
2. Log in with your credentials
3. Select project: `qwoggbbavikzhypzodcr`

### Issue: Encryption key not loading
**Solution:** Restart your development server:
```bash
# Stop current server (Ctrl+C)
# Start fresh
npm run dev
```

---

## 📚 Documentation

For more details, see:
- **Full Status:** `POST_AUDIT_AUTOMATION_STATUS.md`
- **Migration Instructions:** `MIGRATION_INSTRUCTIONS_POST_AUDIT.md`
- **PRD Document:** `PRD_POST_AUDIT_AUTOMATION.md`
- **Database Schema:** `database/post-audit-automation-schema.sql`
- **TypeScript Types:** `types/post-audit-automation.ts`

---

**Questions?** Check the troubleshooting section above or review the full documentation.

**Ready to proceed?** Start with building the first API endpoint: `POST /api/companies/[id]/credentials`
