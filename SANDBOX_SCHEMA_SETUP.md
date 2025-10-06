# Sandbox Schema Setup Guide

**Issue**: Site showing 500 error because `sandbox_sessions` table doesn't exist yet.

**Solution**: Run the base sandbox schema BEFORE migration 011.

---

## Step 1: Run Base Sandbox Schema

### In Supabase SQL Editor:

1. Go to https://supabase.com/dashboard
2. Select project: `qwoggbbavikzhypzodcr`
3. Click **SQL Editor** → **New query**
4. Copy and paste the **entire contents** of:
   ```
   database/sandbox-schema.sql
   ```
5. Click **Run**

This creates the foundational tables:
- ✅ `sandbox_sessions` - Main sandbox sessions
- ✅ `sandbox_terminal_history` - Command history
- ✅ `sandbox_agent_logs` - AI agent interactions
- ✅ `sandbox_repo_imports` - GitHub imports
- ✅ `sandbox_deployments` - Vercel deployments
- ✅ `sandbox_voice_commands` - Voice input history
- ✅ Views and functions

---

## Step 2: Run Migration 011 (Already Done)

You already ran this! ✅

Migration 011 added the `sandbox_tasks` table which extends the base schema.

---

## Verify Both Steps

Run this in Supabase SQL Editor:

```sql
-- Check all sandbox tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'sandbox%'
ORDER BY table_name;
```

**Expected result**: Should show:
- sandbox_agent_logs
- sandbox_deployments
- sandbox_repo_imports
- sandbox_sessions ← **This one was missing!**
- sandbox_tasks
- sandbox_terminal_history
- sandbox_voice_commands

---

## After Running Base Schema

Visit https://geo-seo-domination-tool.vercel.app/

- ✅ 500 error should be GONE
- ✅ Landing page loads with MetaCoder Sandbox section
- ✅ /sandbox page works
- ✅ MCP server at /api/mcp works

---

## Quick SQL to Run

Just copy this entire file and paste into Supabase SQL Editor:

**File**: `database/sandbox-schema.sql`

Then click **Run**. Done! 🚀
