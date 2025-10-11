# Post-Audit Automation Schema Migration

## 🎯 Quick Migration Guide

You have **2 options** to run the migration:

---

## Option 1: Supabase SQL Editor (Recommended - 2 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr)
2. Click **SQL Editor** in the left sidebar
3. Click **New query**

### Step 2: Copy Schema

Copy the entire contents of: `database/post-audit-automation-schema.sql`

### Step 3: Execute

1. Paste into the SQL Editor
2. Click **Run** (or press Ctrl+Enter)
3. Wait ~5-10 seconds for execution

### Step 4: Verify

Check the **Output** panel - you should see:

```
Success. No rows returned
```

Or individual success messages for each table created.

### Step 5: Confirm Tables Created

Run this query to verify:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'website_credentials',
    'agent_tasks',
    'task_execution_logs',
    'task_templates',
    'credentials_access_log',
    'automation_rules'
  )
ORDER BY table_name;
```

**Expected output**: 6 tables listed

---

## Option 2: Via Supabase MCP (If Available)

If you have Supabase MCP connected in Claude Desktop, I can run this directly.

Ask me:
```
"Execute the automation schema migration via Supabase MCP"
```

---

## ✅ After Migration Success

### 1. Generate Encryption Key

```bash
openssl rand -base64 32
```

**Example output**:
```
K8Jx2mP9vL3nQ7wR5tY8zA1bC4dE6fG0hI2jK5lM8nO=
```

### 2. Add to .env.local

```bash
# Credential Encryption Key (AES-256)
CREDENTIALS_ENCRYPTION_KEY="your_generated_key_here"
```

### 3. Add to Vercel (Production)

```bash
npx vercel env add CREDENTIALS_ENCRYPTION_KEY production preview development
# Paste the same key when prompted
```

### 4. Test Encryption

Create a test script:

```bash
node scripts/test-credential-encryption.mjs
```

---

## 📊 What Gets Created

### 6 Tables:

1. **website_credentials** (30+ columns)
   - Encrypted storage for WordPress, FTP, GitHub, etc.
   - AES-256-GCM encryption for all sensitive fields

2. **agent_tasks** (40+ columns)
   - Automation tasks generated from audits
   - Status tracking, execution logs, approval workflow

3. **task_execution_logs**
   - Detailed step-by-step logs
   - Debug, info, warning, error, success levels

4. **task_templates**
   - Reusable task definitions
   - 20+ common SEO/web fix templates

5. **credentials_access_log**
   - Security audit trail
   - Tracks every credential access with IP/user agent

6. **automation_rules**
   - Trigger-based task creation
   - Auto-execution rules

### 15+ Indexes:
- Optimized for company_id lookups
- Status and priority filtering
- Timestamp-based queries

### 3 Triggers:
- Auto-update timestamps
- Access logging (optional)

### 2 Functions:
- `update_website_credentials_updated_at()`
- `update_agent_tasks_updated_at()`

---

## 🚨 Common Issues

### Issue 1: "relation already exists"

**Cause**: Tables already created from a previous run

**Solution**: This is fine! The `IF NOT EXISTS` clauses prevent errors.

### Issue 2: "permission denied"

**Cause**: Using anon key instead of service role key

**Solution**: Make sure you're using `SUPABASE_SERVICE_ROLE_KEY` in the SQL Editor or verify your Supabase MCP configuration uses the service role key.

### Issue 3: Foreign key constraint fails

**Cause**: Referenced tables (companies, auth.users) don't exist

**Solution**:
1. Check if `companies` table exists: `SELECT * FROM companies LIMIT 1;`
2. If not, run the main schema first: `database/schema.sql`

---

## 🔍 Verification Queries

### Check All Tables

```sql
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%credential%'
   OR tablename LIKE '%task%'
   OR tablename LIKE '%automation%'
ORDER BY tablename;
```

### Check Indexes

```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('website_credentials', 'agent_tasks')
ORDER BY tablename, indexname;
```

### Check Constraints

```sql
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('website_credentials', 'agent_tasks')
ORDER BY tc.table_name, tc.constraint_type;
```

---

## 📝 Next Steps After Migration

1. ✅ Generate encryption key
2. ✅ Add to environment variables
3. ✅ Test credential encryption
4. 🚀 Build API endpoints:
   - POST `/api/companies/[id]/credentials`
   - POST `/api/agent-tasks/create-from-audit`
   - POST `/api/agent-tasks/[id]/execute`
5. 🧪 Test first automated fix end-to-end

---

## 🎉 Success Indicators

After successful migration, you should be able to:

✅ Insert test credentials:
```sql
INSERT INTO website_credentials (
  company_id,
  platform_type,
  primary_access_method,
  wp_url,
  wp_username
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  'wordpress',
  'wp_rest_api',
  'https://example.com',
  'admin'
);
```

✅ Create test task:
```sql
INSERT INTO agent_tasks (
  company_id,
  task_type,
  category,
  priority,
  instructions
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  'add_h1_tag',
  'seo',
  'high',
  '{"action": "add_element", "element": "h1", "content": "Test Heading"}'::jsonb
);
```

---

**Ready to migrate?** Choose Option 1 (Supabase SQL Editor) for the fastest results!
