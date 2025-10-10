# Onboarding Sessions Table - Status Report

**Date:** 2025-10-10
**Issue:** `relation "onboarding_sessions" does not exist` error

## ✅ RESOLUTION: Table Created Successfully

The `onboarding_sessions` table has been successfully created in Supabase PostgreSQL with the correct schema.

### Table Structure

```sql
CREATE TABLE onboarding_sessions (
  id                TEXT PRIMARY KEY,
  company_id        UUID,                          -- Foreign key to companies.id
  business_name     TEXT NOT NULL,
  industry          TEXT,
  email             TEXT NOT NULL,
  phone             TEXT,
  status            TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'completed', 'failed')),
  current_step      TEXT,
  request_data      JSONB,                         -- Full intake form data
  steps_data        JSONB,                         -- Progress tracking
  error             TEXT,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  started_at        TIMESTAMP WITH TIME ZONE,
  completed_at      TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_onboarding_status ON onboarding_sessions(status);
CREATE INDEX idx_onboarding_email ON onboarding_sessions(email);
CREATE INDEX idx_onboarding_created ON onboarding_sessions(created_at DESC);

-- Row Level Security
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on onboarding_sessions" ON onboarding_sessions
  FOR ALL USING (true) WITH CHECK (true);
```

### ✅ Verification Results

```
✅ onboarding_sessions table exists

📋 Table structure:
   id: text (nullable: NO)
   company_id: uuid (nullable: YES)
   business_name: text (nullable: NO)
   industry: text (nullable: YES)
   email: text (nullable: NO)
   phone: text (nullable: YES)
   status: text (nullable: NO)
   current_step: text (nullable: YES)
   request_data: jsonb (nullable: YES)
   steps_data: jsonb (nullable: YES)
   error: text (nullable: YES)
   created_at: timestamp with time zone (nullable: NO)
   started_at: timestamp with time zone (nullable: YES)
   completed_at: timestamp with time zone (nullable: YES)

🧪 Testing insert with ID: test_1760051734287
✅ Insert successful
✅ Test row deleted

✅ Table is fully operational!
```

## 🔍 Current /api/onboarding/start Error

The endpoint `/api/onboarding/start` is now returning a different error:

```json
{
  "error": "Failed to start onboarding",
  "message": "fetch failed"
}
```

### Root Cause

The error is **NOT** from the database. It's from the Bytebot client call in [app/api/onboarding/start/route.ts:42](app/api/onboarding/start/route.ts#L42):

```typescript
// Create comprehensive Bytebot research task
const bytebot = getBytebotClient();
const bytebotTask = await bytebot.createTask(
  buildOnboardingResearchPrompt(body),
  {
    priority: 'HIGH',
    metadata: {
      onboardingId,
      businessName: body.businessName,
      website: body.website,
      taskType: 'onboarding_research'
    }
  }
);
```

The Bytebot client tries to fetch `http://localhost:9991/tasks` (see [lib/bytebot-client.ts:87](lib/bytebot-client.ts#L87)), but **Bytebot Docker containers are not running**:

```bash
$ docker ps --filter "name=bytebot"
NAMES     STATUS    PORTS
# No containers found
```

## 🔧 Next Steps

### Option 1: Start Bytebot Containers (Recommended for Full Functionality)

If you want the full onboarding experience with automated research:

1. Start Bytebot Docker containers
2. Verify they're running on ports 9990 (desktop) and 9991 (agent)
3. Test the endpoint again

### Option 2: Make Bytebot Optional (Quick Fix)

Modify [app/api/onboarding/start/route.ts](app/api/onboarding/start/route.ts) to make Bytebot optional:

```typescript
// Start traditional onboarding
const onboardingId = await onboardingOrchestrator.startOnboarding(body);

// Create Bytebot research task (optional - skip if Bytebot not available)
let bytebotTaskId = null;
try {
  const bytebot = getBytebotClient();
  const bytebotTask = await bytebot.createTask(
    buildOnboardingResearchPrompt(body),
    { priority: 'HIGH', metadata: { onboardingId, ... } }
  );
  bytebotTaskId = bytebotTask.id;

  // Store task reference...
} catch (error) {
  console.warn('Bytebot not available, skipping automated research:', error.message);
}

return Response.json({
  success: true,
  onboardingId,
  bytebotTaskId,
  message: bytebotTaskId
    ? 'Onboarding started successfully. Bytebot is conducting comprehensive research.'
    : 'Onboarding started successfully.'
}, { status: 201 });
```

### Option 3: Use Different Onboarding Endpoint

The traditional orchestrator at [services/onboarding/onboarding-orchestrator.ts:82](services/onboarding/onboarding-orchestrator.ts#L82) doesn't require Bytebot. The `/api/onboarding/start` route could bypass Bytebot if not needed.

## 📝 Summary

| Component | Status | Notes |
|-----------|--------|-------|
| `onboarding_sessions` table | ✅ Created | Fully operational in Supabase |
| Database schema | ✅ Correct | UUID foreign key matches companies.id |
| Table inserts | ✅ Working | Tested successfully |
| `/api/onboarding/start` | ⚠️ Requires Bytebot | Fails with "fetch failed" when Bytebot is down |
| Bytebot containers | ❌ Not running | Required for automated research |

## 🎯 Recommendation

**Implement Option 2** (Make Bytebot Optional) so onboarding can proceed even when Bytebot isn't available. This provides:
- ✅ Graceful degradation
- ✅ Onboarding still works without Bytebot
- ✅ Enhanced features when Bytebot is available
- ✅ Better error handling

---

**Files Created:**
- `database/supabase-onboarding-sessions.sql` - PostgreSQL schema
- `scripts/create-onboarding-sessions-fixed.mjs` - Table creation script
- `scripts/verify-onboarding-table.mjs` - Verification script
- `scripts/check-companies-table.mjs` - Companies table inspector
- `ONBOARDING_SESSIONS_TABLE_SETUP.md` - Setup documentation

**Related:**
- See [TROUBLESHOOTING_CHECKLIST.md](TROUBLESHOOTING_CHECKLIST.md) for debugging workflow
- See [lib/bytebot-client.ts](lib/bytebot-client.ts) for Bytebot client implementation
