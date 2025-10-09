# Production Issue Analysis - Vercel Deployment

**URL**: https://geo-seo-domination-tool.vercel.app/onboarding/new
**Date**: January 10, 2025
**Status**: ⚠️ **IDENTIFIED - REQUIRES ACTION**

---

## 🔍 Root Cause Summary

Based on the investigation of production deployment and historical documentation:

### **Primary Issue: Missing Database Table**

**Error**: `/api/onboarding/save` returns 500 Internal Server Error

**Cause**: The `saved_onboarding` table does not exist in Supabase production database

**Evidence**:
1. ✅ Local development works (auto-creates table via `database/quick-init.sql`)
2. ❌ Production fails with PostgreSQL error: `relation 'saved_onboarding' does not exist`
3. ✅ Schema file exists: `database/supabase-saved-onboarding.sql`
4. ❌ Table was never manually created in Supabase

**Impact**:
- Auto-save functionality fails
- Users cannot save onboarding progress
- Manual "Save Progress" button returns 500 error
- Form data is lost on page refresh

---

## 📊 Current Production Status

### ✅ What's Working
- Page loads successfully
- Next.js renders onboarding form
- All 5 wizard steps display correctly
- Client-side form validation works
- UI interactions functional
- Theme switching works

### ❌ What's Broken
- Auto-save fails silently after 3 seconds
- Manual "Save Progress" button returns 500
- "Load Saved Progress" button fails
- Form data doesn't persist
- Users must complete onboarding in one session

---

## 🔧 Required Fixes

### Fix #1: Create Missing Table in Supabase (URGENT)

**Action Required**: Run SQL in Supabase SQL Editor

**Steps**:
1. Visit: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Navigate to: SQL Editor
3. Run this SQL:

```sql
-- Create saved_onboarding table
CREATE TABLE IF NOT EXISTS saved_onboarding (
  id SERIAL PRIMARY KEY,
  business_name TEXT NOT NULL,
  email TEXT NOT NULL,
  form_data JSONB NOT NULL,
  current_step INTEGER DEFAULT 0,
  last_saved TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_business_email UNIQUE(business_name, email)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_onboarding_lookup
  ON saved_onboarding(business_name, email);

CREATE INDEX IF NOT EXISTS idx_saved_onboarding_email
  ON saved_onboarding(email);

-- Add comment for documentation
COMMENT ON TABLE saved_onboarding IS
  'Stores saved progress from the onboarding wizard';
```

4. Verify table created:
```sql
SELECT * FROM saved_onboarding LIMIT 1;
```

**Expected Result**: Table exists, no errors

---

### Fix #2: Add Bytebot Tables (Before Deploying Integration)

Since we've now integrated Bytebot, we need to create those tables too:

```sql
-- Bytebot task tracking table
CREATE TABLE IF NOT EXISTS bytebot_tasks (
  id SERIAL PRIMARY KEY,
  bytebot_task_id TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  task_type TEXT NOT NULL,
  priority TEXT DEFAULT 'MEDIUM',
  status TEXT DEFAULT 'PENDING',

  -- Relationships
  company_id INTEGER,
  onboarding_id INTEGER,
  audit_id INTEGER,

  -- Metadata (JSONB for better querying)
  metadata JSONB,

  -- Results
  result JSONB,
  error TEXT,
  screenshots JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (onboarding_id) REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_bytebot_id ON bytebot_tasks(bytebot_task_id);
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_company ON bytebot_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_onboarding ON bytebot_tasks(onboarding_id);
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_audit ON bytebot_tasks(audit_id);
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_status ON bytebot_tasks(status);
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_type ON bytebot_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_created ON bytebot_tasks(created_at DESC);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_metadata ON bytebot_tasks USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_result ON bytebot_tasks USING GIN (result);

-- Bytebot task logs table
CREATE TABLE IF NOT EXISTS bytebot_task_logs (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  log_level TEXT DEFAULT 'INFO',
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (task_id) REFERENCES bytebot_tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bytebot_logs_task ON bytebot_task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_bytebot_logs_timestamp ON bytebot_task_logs(timestamp DESC);

-- Comments
COMMENT ON TABLE bytebot_tasks IS 'Tracks Bytebot AI desktop agent tasks';
COMMENT ON TABLE bytebot_task_logs IS 'Execution logs for Bytebot tasks';
```

---

### Fix #3: Environment Variables Check

**Verify these are set in Vercel**:

```bash
# Database (Required)
DATABASE_URL=postgresql://...
POSTGRES_URL=postgresql://...

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# API Keys (Required)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
SEMRUSH_API_KEY=...
GOOGLE_API_KEY=...
FIRECRAWL_API_KEY=...

# Bytebot (After Docker deployment - optional for now)
BYTEBOT_AGENT_URL=http://bytebot-agent:9991
BYTEBOT_DESKTOP_URL=http://bytebot-desktop:9990
```

**How to check**:
1. Go to Vercel Dashboard
2. Select project: `geo-seo-domination-tool`
3. Navigate to: Settings → Environment Variables
4. Verify all above variables exist

---

## 🚀 Deployment Strategy

### Phase 1: Fix Current Production (IMMEDIATE)

**Goal**: Make existing onboarding work without errors

**Steps**:
1. ✅ Create `saved_onboarding` table in Supabase (SQL above)
2. ✅ Verify table exists
3. ✅ Test production save at: https://geo-seo-domination-tool.vercel.app/onboarding/new
4. ✅ Confirm no 500 errors

**Expected Result**: Onboarding save/load works in production

**Time**: 5 minutes

---

### Phase 2: Deploy Bytebot Integration (NEXT)

**Goal**: Add AI-powered automated research to onboarding

**Prerequisites**:
- [ ] Phase 1 complete (tables exist)
- [ ] Docker environment ready for Bytebot
- [ ] Bytebot services tested locally
- [ ] Bytebot tables created in Supabase

**Steps**:

1. **Test Bytebot Locally**:
```bash
# Start Bytebot services
docker-compose -f docker-compose.dev.yml up -d

# Check services running
docker ps | grep bytebot

# Test integration
curl -X POST http://localhost:3000/api/bytebot/tasks \
  -F "description=Test task" \
  -F "priority=MEDIUM"
```

2. **Create Bytebot Tables in Supabase**:
   - Run SQL from Fix #2 above

3. **Commit and Deploy**:
```bash
git add .
git commit -m "feat: Integrate Bytebot AI desktop agent for automated client research"
git push origin main
```

4. **Verify Deployment**:
   - Check Vercel build logs
   - Test onboarding creates Bytebot tasks
   - Verify BytebotTaskViewer component works

**Expected Result**: Onboarding automatically triggers comprehensive client research

**Time**: 30 minutes (including testing)

---

## 📝 Testing Checklist

### Phase 1 Testing (Current Production Fix)

**Test URL**: https://geo-seo-domination-tool.vercel.app/onboarding/new

1. **Save Progress Test**:
   - [ ] Fill Business Name: "Test Company"
   - [ ] Fill Email: "test@example.com"
   - [ ] Click "Save Progress"
   - [ ] **Expected**: Success toast message
   - [ ] **Expected**: No 500 error in Network tab

2. **Auto-Save Test**:
   - [ ] Fill Business Name and Email
   - [ ] Wait 3 seconds
   - [ ] **Expected**: "Saved: [time]" appears in header
   - [ ] **Expected**: No console errors

3. **Load Progress Test**:
   - [ ] Click "Load Saved Progress"
   - [ ] Enter saved Business Name and Email
   - [ ] **Expected**: Form data loads
   - [ ] **Expected**: Current step restored

4. **Database Verification**:
```sql
-- In Supabase SQL Editor
SELECT * FROM saved_onboarding
ORDER BY created_at DESC
LIMIT 5;
```
   - [ ] **Expected**: See test data

---

### Phase 2 Testing (Bytebot Integration)

**Prerequisites**: Phase 1 passing + Bytebot services running

1. **Local Docker Test**:
```bash
docker ps | grep bytebot
# Should see 3 containers:
# - geo-seo-bytebot-desktop
# - geo-seo-bytebot-agent
# - geo-seo-bytebot-ui
```

2. **API Integration Test**:
```bash
# Create test task
curl -X POST http://localhost:3000/api/bytebot/tasks \
  -F "description=Visit https://example.com and take screenshot" \
  -F "priority=HIGH"

# Response should include taskId
```

3. **Onboarding Integration Test**:
   - [ ] Visit: http://localhost:3000/onboarding/new
   - [ ] Complete all 5 steps
   - [ ] Submit onboarding
   - [ ] **Expected**: Response includes `bytebotTaskId`
   - [ ] Check database:
```sql
SELECT * FROM bytebot_tasks
WHERE task_type = 'onboarding'
ORDER BY created_at DESC;
```

4. **BytebotTaskViewer Test**:
   - [ ] Add viewer component to dashboard
   - [ ] Pass `bytebotTaskId` from onboarding
   - [ ] **Expected**: See live desktop view
   - [ ] **Expected**: See execution logs
   - [ ] **Expected**: Auto-refresh works

---

## 🐛 Known Issues & Workarounds

### Issue #1: Bytebot Not Available in Vercel

**Problem**: Bytebot runs in Docker, Vercel is serverless

**Workaround**:
- Bytebot integration only works in self-hosted Docker environment
- For Vercel deployment, Bytebot features will be disabled
- Add feature flag:

```typescript
// lib/bytebot-client.ts
const BYTEBOT_ENABLED =
  process.env.BYTEBOT_AGENT_URL &&
  !process.env.VERCEL; // Disable on Vercel

export function isBytebotAvailable(): boolean {
  return BYTEBOT_ENABLED;
}
```

**Long-term Solution**:
- Deploy Bytebot to separate VPS/cloud server
- Update `BYTEBOT_AGENT_URL` to point to hosted instance
- Or migrate from Vercel to Docker-based hosting (Railway, Render, etc.)

---

### Issue #2: Database Table References May Not Exist

**Problem**: Bytebot integration references tables that might not exist in fresh Supabase instance

**Solution**: Create all tables before deploying

**Check if tables exist**:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('companies', 'onboarding_sessions', 'audits');
```

**If missing**, run complete schema from `database/supabase-schema.sql`

---

## 📊 Deployment Decision Matrix

### Option A: Quick Fix (Recommended for Now)

**Action**: Fix Phase 1 only (create `saved_onboarding` table)

**Pros**:
- ✅ Fast (5 minutes)
- ✅ Fixes current production issue immediately
- ✅ No code changes needed
- ✅ No redeployment needed

**Cons**:
- ❌ No Bytebot features yet
- ❌ Still manual client research

**When to choose**: Need production working ASAP

---

### Option B: Full Deployment (Best Long-term)

**Action**: Fix Phase 1 + Deploy Phase 2 (Bytebot integration)

**Pros**:
- ✅ Automated client research
- ✅ AI-powered insights
- ✅ Time savings (2-3 hours per client)
- ✅ Better client experience

**Cons**:
- ❌ Requires Docker environment setup
- ❌ Takes 30-60 minutes to test
- ❌ Won't work on Vercel (need self-hosted)

**When to choose**: Ready to migrate to Docker-based hosting

---

## 🎯 Recommended Action Plan

### Immediate (Next 10 minutes):

1. ✅ **Create `saved_onboarding` table in Supabase**
   - Run SQL from Fix #1 above
   - This fixes production immediately

2. ✅ **Test production save**
   - Visit onboarding page
   - Click "Save Progress"
   - Verify no 500 error

### Short-term (This week):

3. ✅ **Test Bytebot locally**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

4. ✅ **Create Bytebot tables in Supabase**
   - Run SQL from Fix #2 above

5. ✅ **Add feature flag for Bytebot**
   ```typescript
   if (isBytebotAvailable()) {
     // Create Bytebot task
   } else {
     // Skip Bytebot, use traditional onboarding
   }
   ```

6. ✅ **Deploy with feature flag**
   - Bytebot disabled on Vercel
   - Bytebot enabled when running locally with Docker

### Medium-term (Next month):

7. 🔄 **Evaluate hosting options**
   - Consider Railway/Render for Docker support
   - Or deploy Bytebot to separate VPS
   - Update environment variables to point to hosted Bytebot

---

## 📞 Support Resources

**Production Issues**:
- Vercel Dashboard: https://vercel.com/unite-group/geo-seo-domination-tool
- Supabase Dashboard: https://supabase.com/dashboard
- Error logs: `vercel logs`

**Bytebot Resources**:
- Docs: https://docs.bytebot.ai
- Discord: https://discord.gg/bytebot
- GitHub: https://github.com/bytebot-ai/bytebot

**Project Docs**:
- [BYTEBOT_INTEGRATION.md](./BYTEBOT_INTEGRATION.md) - Complete guide
- [BYTEBOT_QUICKSTART.md](./BYTEBOT_QUICKSTART.md) - Quick start
- [BUILD_SUCCESS_REPORT.md](./BUILD_SUCCESS_REPORT.md) - Latest build status

---

## ✅ Success Criteria

### Phase 1 Success:
- [ ] `saved_onboarding` table exists in Supabase
- [ ] Production save returns 200 (not 500)
- [ ] Auto-save works without errors
- [ ] Load saved progress works
- [ ] Form data persists in database

### Phase 2 Success:
- [ ] Bytebot services running in Docker
- [ ] Bytebot tables exist in database
- [ ] Bytebot tasks created on onboarding submit
- [ ] BytebotTaskViewer displays live desktop
- [ ] Tasks complete successfully
- [ ] Research results stored in database

---

**Next Action**: Create `saved_onboarding` table in Supabase SQL Editor (5 minutes)

**After that**: Test production save to verify fix

**Then**: Decide on Bytebot deployment timeline based on hosting requirements
