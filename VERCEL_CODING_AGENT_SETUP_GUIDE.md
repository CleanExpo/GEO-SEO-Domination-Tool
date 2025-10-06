# Vercel Coding Agent - Quick Setup Guide

**Date**: 2025-01-06
**Status**: Step-by-step completion guide
**Location**: `tools/coding-agent/`

---

## ✅ Completed
- [x] Repository cloned to `tools/coding-agent/`
- [x] Dependencies installed (`pnpm install` complete - node_modules exists)
- [x] `.env` template created
- [x] Database migration ready (`database/migrations/011_add_sandbox_tasks.sql`)

---

## 🚀 Quick Start (4 Steps)

### Step 1: Get Your API Keys

You need these credentials to proceed:

#### A. Vercel Credentials
1. **Go to**: https://vercel.com/dashboard
2. **Get Team ID**:
   - Click Settings (left sidebar)
   - General tab
   - Copy "Team ID" (looks like `team_xxxxxxxxxxxxx`)
3. **Get Project ID**:
   - Open your project
   - Settings → General
   - Copy "Project ID" (looks like `prj_xxxxxxxxxxxxx`)
4. **Create Token**:
   - Click your avatar (top right)
   - Account Settings → Tokens
   - Create new token with **read/write permissions**
   - Copy token (looks like `xxxxxxxxxxxxxx`)

#### B. Anthropic API Key (Claude Code Max Plan)
1. **Go to**: https://console.anthropic.com/
2. **Navigate to**: API Keys
3. **Copy existing key** or create new one (starts with `sk-ant-`)
4. **Verify Max Plan**: Check your plan tier - Max gives you 8000 tokens vs 4000

#### C. GitHub Token
1. **Go to**: https://github.com/settings/tokens
2. **Generate new token** (classic)
3. **Required scopes**:
   - ✅ `repo` (full control of repositories)
   - ✅ `workflow` (update GitHub Action workflows)
   - ✅ `write:packages` (upload packages)
4. **Copy token** (starts with `ghp_`)

#### D. Supabase Database URL
1. **Go to**: https://supabase.com/dashboard/project/_/settings/database
2. **Copy "Connection string"** under "Connection pooling"
3. **Format**: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`

---

### Step 2: Configure Environment Variables

Edit the `.env` file in `tools/coding-agent/` with your actual values:

```bash
# Open in VSCode
code tools/coding-agent/.env

# Or use notepad
notepad tools/coding-agent\.env
```

**Fill in these required fields**:

```env
# ============================================================================
# REQUIRED: Vercel Sandbox Configuration
# ============================================================================
VERCEL_TEAM_ID=team_xxxxxxxxxxxxx              # From Step 1A
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxx            # From Step 1A
VERCEL_TOKEN=xxxxxxxxxxxxxx                    # From Step 1A

# ============================================================================
# REQUIRED: Database Configuration
# ============================================================================
POSTGRES_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# ============================================================================
# REQUIRED: Claude Code (Your Max Plan!)
# ============================================================================
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx         # From Step 1B

# ============================================================================
# REQUIRED: GitHub Integration
# ============================================================================
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx                 # From Step 1C

# ============================================================================
# OPTIONAL: Additional AI Agents (can add later)
# ============================================================================
# OPENAI_API_KEY=sk-xxxxxxxxxxxxx              # For GPT-5 Codex
# CURSOR_API_KEY=xxxxxxxxxxxxx                 # For Cursor
# GEMINI_API_KEY=xxxxxxxxxxxxx                 # For Google Gemini
# NPM_TOKEN=xxxxxxxxxxxxx                       # For private packages
```

**Save the file** after editing.

---

### Step 3: Run Database Migration

This creates the `sandbox_tasks` table in your Supabase database.

#### Option A: Using npm script (Recommended)
```bash
# From project root (d:/GEO_SEO_Domination-Tool)
npm run db:migrate
```

#### Option B: Manual via Supabase SQL Editor
If the npm script doesn't work:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New query**
5. Open `database/migrations/011_add_sandbox_tasks.sql`
6. Copy entire contents
7. Paste into SQL Editor
8. Click **Run**

#### Verify Migration Success
Run this query in Supabase SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'sandbox_tasks';
```

Expected result: 1 row with `sandbox_tasks`

---

### Step 4: Test Locally

Now test the Vercel Coding Agent:

```bash
# Navigate to coding-agent directory
cd tools/coding-agent

# Push schema to database (creates tables if not exists)
pnpm run db:push

# Start development server
pnpm dev
```

**Expected output**:
```
   ▲ Next.js 15.5.3
   - Local:        http://localhost:3000
   - Network:      http://192.168.x.x:3000

 ✓ Starting...
 ✓ Ready in 2.3s
```

**Open in browser**: http://localhost:3000

You should see the Coding Agent UI with:
- Task creation form
- Agent selector (Claude, Codex, Cursor, Gemini)
- Repository URL input
- Prompt textarea

---

## 🧪 Quick Test

### Create Your First Task

1. **Repository URL**: Enter any public GitHub repo (e.g., `https://github.com/vercel/next.js`)
2. **Agent**: Select "Claude Code" (your Max Plan!)
3. **Prompt**: Enter something simple like:
   ```
   Add a README.md file explaining what this repository does
   ```
4. **Click "Create Task"**

The agent will:
- Create a Vercel sandbox
- Clone the repository
- Execute Claude Code
- Generate the README
- Create a new branch
- Commit changes
- Show you the logs in real-time

---

## 🎯 Success Checklist

After completing all steps, verify:

- [ ] `.env` file has all required API keys filled in
- [ ] `npm run db:migrate` completed successfully
- [ ] `pnpm dev` starts without errors
- [ ] http://localhost:3000 opens in browser
- [ ] You can see the Coding Agent UI
- [ ] Drizzle Studio opens: `pnpm run db:studio`
- [ ] You can see `sandbox_tasks` table in Drizzle Studio

---

## 📊 Database Schema Created

The migration creates:

### 1. `sandbox_tasks` Table
Stores code generation tasks:
- `id` (UUID) - Unique task identifier
- `session_id` (UUID) - Links to sandbox_sessions
- `prompt` (TEXT) - User's coding request
- `repo_url` (TEXT) - Repository URL
- `selected_agent` (TEXT) - Which agent to use
- `selected_model` (TEXT) - AI model version
- `status` (TEXT) - pending/in_progress/completed/failed
- `logs` (JSONB) - Execution logs
- `result_branch` (TEXT) - Git branch created
- `tokens_used` (INTEGER) - Cost tracking
- `cost_usd` (NUMERIC) - Cost tracking

### 2. `sandbox_task_analytics` View
Aggregated statistics:
- Success rate per agent
- Average cost per agent
- Total tasks completed
- Failed task analysis

### 3. Updated Functions
- `get_sandbox_session_stats()` - Now includes task counts

---

## 🔧 Troubleshooting

### Issue 1: "pnpm: command not found"
**Solution**:
```bash
npm install -g pnpm
```

### Issue 2: ".env file not loading"
**Solution**: Rename to `.env.local` if using Next.js:
```bash
cd tools/coding-agent
copy .env .env.local
```

### Issue 3: "Database connection failed"
**Solution**: 
- Verify `POSTGRES_URL` is correct
- Check Supabase project is not paused
- Try connection pooler URL instead of direct connection

### Issue 4: "Vercel Sandbox creation failed"
**Solution**:
- Verify `VERCEL_TOKEN` has correct permissions
- Check `VERCEL_TEAM_ID` and `VERCEL_PROJECT_ID` match your project
- Ensure you have Vercel Pro or Enterprise plan (Sandbox requires paid plan)

### Issue 5: "Claude API error"
**Solution**:
- Verify `ANTHROPIC_API_KEY` is correct
- Check API key has sufficient credits
- Confirm Max Plan is active at https://console.anthropic.com/

---

## 📝 What Happens Next?

After completing this setup, you'll be ready for:

### Week 2: CRM Integration
- Build `/sandbox` page in main CRM (`web-app/app/sandbox/page.tsx`)
- Add task creation form with live log viewer
- Implement file tree browser
- Create live preview panel

### Week 3: Advanced Features
- Smart agent routing (use cheapest agent for simple tasks)
- Cost tracking dashboard
- Automated testing pipeline
- Performance optimization

---

## 💰 Cost Estimates

Using Claude Code Max Plan:

| Task Type | Tokens | Cost | Example |
|-----------|--------|------|---------|
| Simple (README) | ~2,000 | $0.06 | "Add README explaining this repo" |
| Medium (Component) | ~5,000 | $0.15 | "Create a React button component" |
| Complex (Feature) | ~20,000 | $0.60 | "Add user authentication with JWT" |

**Monthly estimate** (50 tasks/month):
- Simple (30): $1.80
- Medium (15): $2
