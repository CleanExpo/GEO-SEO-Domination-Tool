# ✅ Execute Post-Audit Automation Migration NOW

**Updated:** January 11, 2025 - After Supabase OAuth Setup
**Time Required:** 3 minutes
**Your Status:** Supabase OAuth App configured with full access ✅

---

## 🎯 What You're About to Create

6 new database tables for automated website fixes:

| Table | Purpose | Columns |
|-------|---------|---------|
| `website_credentials` | Encrypted credential storage | 30+ (WordPress, FTP, GitHub, Vercel, Shopify, SSH) |
| `agent_tasks` | Automation task queue | 40+ (task type, priority, status, execution logs) |
| `task_execution_logs` | Detailed execution history | 12 (timestamps, logs, errors) |
| `task_templates` | Reusable task templates | 15 (instructions, agent types, estimates) |
| `credentials_access_log` | Security audit log | 10 (who, when, what, result) |
| `automation_rules` | Automation rule engine | 18 (triggers, actions, priorities) |

---

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase Dashboard
Click this link: **[Open Supabase SQL Editor](https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/editor/sql)**

**Or manually:**
1. Go to: https://supabase.com/dashboard
2. Select project: `qwoggbbavikzhypzodcr`
3. Click **"SQL Editor"** in left sidebar
4. Click **"New query"** button

---

### Step 2: Copy Schema SQL

**Option A: Use VS Code (Recommended)**
1. In VS Code, open: `database/post-audit-automation-schema.sql`
2. Select all: `Ctrl+A` (Windows) or `Cmd+A` (Mac)
3. Copy: `Ctrl+C` (Windows) or `Cmd+C` (Mac)

**Option B: Use Command Line**
```bash
# Windows (PowerShell)
Get-Content database/post-audit-automation-schema.sql | Set-Clipboard

# Mac/Linux
cat database/post-audit-automation-schema.sql | pbcopy  # Mac
cat database/post-audit-automation-schema.sql | xclip -selection clipboard  # Linux
```

---

### Step 3: Paste and Execute

1. Click into the SQL Editor text area in Supabase
2. Paste: `Ctrl+V` (Windows) or `Cmd+V` (Mac)
3. You should see ~396 lines of SQL
4. Click **"Run"** button (bottom right) or press `Ctrl+Enter`

**Wait 5-10 seconds...**

---

### Step 4: Check Results

You should see success messages like:

```
✅ CREATE TABLE website_credentials
✅ CREATE TABLE agent_tasks
✅ CREATE TABLE task_execution_logs
✅ CREATE TABLE task_templates
✅ CREATE TABLE credentials_access_log
✅ CREATE TABLE automation_rules
✅ CREATE INDEX idx_website_credentials_company_id
✅ CREATE INDEX idx_agent_tasks_company_id
✅ CREATE INDEX idx_agent_tasks_status
... (15+ indexes total)
✅ CREATE TRIGGER update_website_credentials_updated_at
✅ CREATE TRIGGER update_agent_tasks_updated_at
✅ CREATE TRIGGER update_credentials_access_log_updated_at
```

**Note:** Some "already exists" warnings are OK if you've run this before.

---

### Step 5: Verify Tables Created

1. Click **"Table Editor"** in the left sidebar
2. Scroll down - you should see 6 new tables:

```
✅ website_credentials      (0 rows) - Ready to accept credentials
✅ agent_tasks              (0 rows) - Ready to queue tasks
✅ task_execution_logs      (0 rows) - Ready to log executions
✅ task_templates           (0 rows) - Ready for templates
✅ credentials_access_log   (0 rows) - Ready for audit logs
✅ automation_rules         (0 rows) - Ready for rules
```

3. Click on `website_credentials` and verify columns exist:
   - `id`, `company_id`, `created_at`, `updated_at`
   - `platform_type`, `primary_access_method`
   - `wp_url`, `wp_username`, `wp_app_password_encrypted`
   - `ftp_host`, `ftp_username`, `ftp_password_encrypted`
   - `github_repo`, `github_token_encrypted`
   - ... (30+ total columns)

---

## 🎉 Success! What's Next?

Now that the database is ready, let's set up encryption:

### Generate Encryption Key

**Windows (PowerShell):**
```powershell
# Open PowerShell and run:
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

**Mac/Linux (Terminal):**
```bash
openssl rand -base64 32
```

**Copy the output** - should look like: `abc123XYZ456def789GHI...`

---

### Add to .env.local

1. Open `.env.local` in VS Code
2. Scroll to bottom
3. Add this line:
```env
CREDENTIALS_ENCRYPTION_KEY="paste_your_key_here"
```

**Example:**
```env
CREDENTIALS_ENCRYPTION_KEY="kX3mQp9vL2nR8tY5hJ7fG1bN4cM6wS0aZ3xD9eT2uI8o="
```

4. Save file: `Ctrl+S` or `Cmd+S`

---

### Test Encryption (Optional but Recommended)

Let me know when you've added the encryption key, and I'll create a test script to verify everything works!

---

## ❓ Troubleshooting

### Issue: "Permission denied" error
**Solution:** Your OAuth app is now configured with full Supabase access, so this shouldn't happen. If it does:
1. Check you're logged into the correct Supabase account
2. Verify you selected project `qwoggbbavikzhypzodcr`
3. Try refreshing the browser

### Issue: "Table already exists" warnings
**Solution:** This is normal! It means you've run the migration before. The `IF NOT EXISTS` clauses prevent errors.

To start fresh (optional):
```sql
DROP TABLE IF EXISTS automation_rules CASCADE;
DROP TABLE IF EXISTS credentials_access_log CASCADE;
DROP TABLE IF EXISTS task_templates CASCADE;
DROP TABLE IF EXISTS task_execution_logs CASCADE;
DROP TABLE IF EXISTS agent_tasks CASCADE;
DROP TABLE IF EXISTS website_credentials CASCADE;
```
Then re-run the full schema.

### Issue: SQL Editor not loading
**Solution:**
1. Clear browser cache
2. Try incognito/private mode
3. Try a different browser

---

## 📊 What This Enables

Once the encryption key is added, you'll be able to:

### 1. Store Website Credentials Securely
```typescript
// Example: Save WordPress credentials
POST /api/companies/123/credentials
{
  platform_type: "wordpress",
  wp_url: "https://example.com",
  wp_username: "admin",
  wp_app_password: "xxxx xxxx xxxx xxxx"  // Will be encrypted
}
```

### 2. Auto-Generate Tasks from Audits
```typescript
// After audit completes, automatically create fix tasks
POST /api/agent-tasks/create-from-audit
{
  audit_id: "abc-123",
  company_id: "456-def"
}
// Returns: 12 tasks created (add H1, optimize images, etc.)
```

### 3. Execute Tasks with AI Agents
```typescript
// Execute a task (e.g., add missing H1 tag)
POST /api/agent-tasks/789/execute
// Agent connects to WordPress via REST API
// Adds H1 tag: "Welcome to Example Company"
// Returns: Success in 15 seconds
```

### 4. Track Progress in Real-Time
```typescript
// Watch execution logs stream in
GET /api/agent-tasks/789/progress
// [12:34:56] Connecting to WordPress...
// [12:34:57] ✅ Connected
// [12:34:58] Adding H1 tag...
// [12:35:01] ✅ H1 tag added successfully
```

---

## 🚀 Ready to Execute?

1. **Open Supabase SQL Editor:** [Click Here](https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/editor/sql)
2. **Copy schema:** From `database/post-audit-automation-schema.sql`
3. **Paste and Run:** In SQL Editor
4. **Verify tables:** In Table Editor
5. **Generate key:** Using command above
6. **Add to .env.local:** `CREDENTIALS_ENCRYPTION_KEY="..."`

**Let me know when you've completed the migration and I'll create the test script!**

---

## 📚 Reference Documentation

- **Full Status Report:** `POST_AUDIT_AUTOMATION_STATUS.md`
- **Migration Troubleshooting:** `MIGRATION_INSTRUCTIONS_POST_AUDIT.md`
- **Quick Start Guide:** `QUICK_START_MIGRATION.md`
- **Database Schema:** `database/post-audit-automation-schema.sql`
- **TypeScript Types:** `types/post-audit-automation.ts`
- **Encryption Utilities:** `lib/crypto-credentials.ts`
- **Task Mapper:** `lib/audit-to-task-mapper.ts`

---

**Questions?** Just ask! I'm here to help.

**Ready?** Open that SQL Editor and let's get these tables created! 🎉
