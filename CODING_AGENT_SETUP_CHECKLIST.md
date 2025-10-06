# Vercel Coding Agent Setup - Progress Checklist

**Quick Reference**: See `VERCEL_CODING_AGENT_SETUP_GUIDE.md` for detailed instructions

---

## ✅ Pre-Setup (Already Complete)
- [x] Repository cloned to `tools/coding-agent/`
- [x] Dependencies installed (`pnpm install` complete)
- [x] `.env` template created
- [x] Database migration file ready

---

## 📋 Your Next Steps

### ☐ Step 1: Gather API Credentials (15 min)

Copy these values as you get them:

```
Vercel Team ID: ________________________
Vercel Project ID: ________________________  
Vercel Token: ________________________
Supabase URL: ________________________
Anthropic Key: ________________________
GitHub Token: ________________________
```

**Where to get them**: See Step 1 in `VERCEL_CODING_AGENT_SETUP_GUIDE.md`

---

### ☐ Step 2: Configure .env File (5 min)

```bash
# Open the file
code tools/coding-agent/.env

# Fill in the values from Step 1
# Save and close
```

**Required fields**:
- [ ] VERCEL_TEAM_ID
- [ ] VERCEL_PROJECT_ID  
- [ ] VERCEL_TOKEN
- [ ] POSTGRES_URL
- [ ] ANTHROPIC_API_KEY
- [ ] GITHUB_TOKEN

---

### ☐ Step 3: Run Database Migration (2 min)

```bash
# From project root (d:/GEO_SEO_Domination-Tool)
npm run db:migrate
```

**Expected output**: 
```
✓ Migration 011_add_sandbox_tasks.sql applied successfully
```

**If that doesn't work**, use Supabase SQL Editor:
1. Go to https://supabase.com/dashboard
2. SQL Editor → New query
3. Copy/paste `database/migrations/011_add_sandbox_tasks.sql`
4. Run

---

### ☐ Step 4: Test Locally (3 min)

```bash
cd tools/coding-agent

# Push schema (creates tables)
pnpm run db:push

# Start dev server
pnpm dev
```

**Expected**: Server starts at http://localhost:3000

---

### ☐ Step 5: Verify Everything Works

**Open browser**: http://localhost:3000

You should see:
- [ ] Task creation form
- [ ] Agent selector dropdown
- [ ] Repository URL input field
- [ ] Prompt textarea
- [ ] "Create Task" button

**Optional: Test Drizzle Studio**
```bash
cd tools/coding-agent
pnpm run db:studio
```
Opens database browser at http://localhost:4983

---

## 🎉 Success!

When all checkboxes above are complete, you're ready to:
1. Create your first coding task
2. Watch Claude Code generate code
3. See real-time logs
4. Review the created branch

---

## 🆘 Need Help?

**Common issues**: See Troubleshooting section in `VERCEL_CODING_AGENT_SETUP_GUIDE.md`

**Quick checks**:
```bash
# Verify node_modules exists
ls tools/coding-agent/node_modules

# Check .env has content
cat tools/coding-agent/.env

# Test database connection
cd tools/coding-agent
pnpm run db:studio
```

---

## 📊 Time Estimate

- Step 1 (API keys): ~15 minutes
- Step 2 (.env config): ~5 minutes  
- Step 3 (Migration): ~2 minutes
- Step 4 (Test): ~3 minutes

**Total**: ~25 minutes

---

## 🎯 Current Status

Last updated: 2025-01-06 14:52 AEST

**Phase**: Initial Setup
**Next milestone**: Create first coding task
**Blockers**: None (all dependencies ready)

---

**Start here**: Step 1 - Gather API Credentials ⬆️
