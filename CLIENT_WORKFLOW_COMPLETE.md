# Complete Client Workflow - Implementation Status

## 🎯 Your Vision: Systematic Client Progression

> "Once a client is onboarded, the system needs to automatically and systematically run through all the steps included in their tier sign-in."

## 📊 Current Workflow Status

### ✅ What EXISTS (The Skeleton)

```
1. Onboarding Form → Client fills out intake form
2. Save to Database → Creates onboarding_sessions record
3. Create Company → Inserts into companies table
4. Processor Runs → onboarding-processor.ts executes
5. Steps Tracked → Progress saved in steps_data column
```

### ❌ What's MISSING (The Automation)

The processor has **TODO placeholders** instead of actual implementations:

```typescript
// Step 3: Run SEO Audit
console.log('[Processor] Step 3: Run SEO Audit');
steps[2].status = 'running';

// TODO: Integrate actual Lighthouse audit  ← THIS IS A PLACEHOLDER
steps[2].status = 'completed';
```

**Result**: The system PRETENDS to complete steps but doesn't actually DO them.

---

## 🔧 What Needs to Be Implemented

### Step 3: Run SEO Audit (Currently TODO)

**Current Code** (services/onboarding/onboarding-processor.ts:102-110):
```typescript
// Step 3: Run SEO Audit
steps[2].status = 'running';
// TODO: Integrate actual Lighthouse audit
steps[2].status = 'completed';
```

**Should Be**:
```typescript
// Step 3: Run SEO Audit
steps[2].status = 'running';

try {
  // Call the actual comprehensive audit endpoint
  const auditResponse = await fetch(
    `http://localhost:3000/api/companies/${companyId}/audit/comprehensive`,
    { method: 'POST' }
  );

  if (!auditResponse.ok) {
    throw new Error('Audit failed');
  }

  const auditResult = await auditResponse.json();
  steps[2].status = 'completed';
  steps[2].details = `Audit completed with score: ${auditResult.overall_score}/100`;
} catch (error) {
  steps[2].status = 'failed';
  steps[2].error = error.message;
  throw error;
}
```

### Step 4: Generate Content Calendar (Currently TODO)

**Current Code** (services/onboarding/onboarding-processor.ts:112-120):
```typescript
// Step 4: Generate Content Calendar
steps[3].status = 'running';
// TODO: Generate actual content calendar
steps[3].status = 'completed';
```

**Should Be**:
```typescript
// Step 4: Generate Content Calendar
steps[3].status = 'running';

try {
  // Use AI to generate content strategy
  const { cascadingAI } = await import('@/services/api/cascading-ai');

  const prompt = `Create a 30-day content calendar for ${requestData.businessName} targeting: ${requestData.targetKeywords.join(', ')}. Include blog topics, social media posts, and video ideas.`;

  const contentPlan = await cascadingAI(prompt, {
    temperature: 0.7,
    maxTokens: 2000
  });

  // Save to database
  await db.query(
    `INSERT INTO content_calendars (company_id, content_plan, created_at)
     VALUES (?, ?, ?)`,
    [companyId, contentPlan, new Date().toISOString()]
  );

  steps[3].status = 'completed';
} catch (error) {
  steps[3].status = 'failed';
  steps[3].error = error.message;
  // Don't throw - allow process to continue
}
```

### Step 5: Send Welcome Email (Currently TODO)

**Current Code** (services/onboarding/onboarding-processor.ts:122-128):
```typescript
// Step 5: Send Welcome Email
steps[4].status = 'running';
// TODO: Send actual welcome email
steps[4].status = 'completed';
```

**Should Be**:
```typescript
// Step 5: Send Welcome Email
steps[4].status = 'running';

try {
  const { sendEmail } = await import('@/services/notifications/email-service');

  await sendEmail({
    to: requestData.email,
    template: 'client-welcome',
    data: {
      businessName: requestData.businessName,
      contactName: requestData.contactName,
      companyId: companyId,
      dashboardUrl: `https://your-domain.com/companies/${companyId}/dashboard`
    }
  });

  steps[4].status = 'completed';
} catch (error) {
  steps[4].status = 'failed';
  steps[4].error = error.message;
  // Don't throw - email failure shouldn't stop onboarding
}
```

---

## 🚀 Complete Implementation Plan

### Phase 1: Core Automation (High Priority)

**File to Edit**: `services/onboarding/onboarding-processor.ts`

1. **Step 3: Implement Real SEO Audit**
   - Call `/api/companies/[id]/audit/comprehensive`
   - Wait for completion (30-60 seconds)
   - Store audit_id in onboarding_sessions
   - Handle failures gracefully

2. **Step 4: Implement Content Calendar Generation**
   - Use cascadingAI to generate content plan
   - Create content_calendars table if needed
   - Save generated plan to database

3. **Step 5: Implement Welcome Email**
   - Use existing email service
   - Send personalized welcome with dashboard link
   - Include audit summary if available

### Phase 2: Extended Workflow (Medium Priority)

Add more automated steps based on tier:

**Basic Tier**:
- ✅ Company creation
- ✅ Initial audit
- ✅ Welcome email

**Standard Tier**:
- ✅ Everything in Basic
- ➕ Keyword research (10 keywords)
- ➕ Competitor analysis (3 competitors)
- ➕ Monthly ranking tracking setup

**Premium Tier**:
- ✅ Everything in Standard
- ➕ Comprehensive 117-point audit
- ➕ AI content strategy (30-day calendar)
- ➕ Local SEO setup (GBP optimization)
- ➕ Backlink analysis
- ➕ Weekly ranking reports

### Phase 3: Task Generation (High Value)

After onboarding completes:
- Automatically generate improvement tasks from audit
- Assign to client's task board
- Prioritize by impact
- Set due dates based on urgency

**Implementation**:
```typescript
// After Step 5 completes
console.log('[Processor] Step 6: Generate Improvement Tasks');

const tasksResponse = await fetch('/api/agent-tasks/create-from-audit', {
  method: 'POST',
  body: JSON.stringify({
    audit_id: auditId,
    company_id: companyId
  })
});

const tasks = await tasksResponse.json();
console.log(`[Processor] Generated ${tasks.count} improvement tasks`);
```

---

## 🔄 Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ CLIENT ONBOARDING FORM                                  │
│ • Business Info                                         │
│ • Goals & Keywords                                      │
│ • Service Tier Selection                                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ POST /api/onboarding/start                              │
│ • Validate form data                                    │
│ • Create onboarding_sessions record                     │
│ • Call processOnboarding()                              │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 1: Create Company Record                           │
│ ✅ INSERT INTO companies                                 │
│ ✅ Generate company UUID                                 │
│ Status: COMPLETED                                       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 2: Setup Workspace                                 │
│ ✅ Create company portfolio entry                        │
│ ❌ TODO: Additional workspace setup                      │
│ Status: PLACEHOLDER                                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 3: Run SEO Audit ⚠️ CRITICAL MISSING               │
│ ❌ TODO: Call comprehensive audit API                    │
│ ❌ TODO: Wait for audit completion                       │
│ ❌ TODO: Store audit_id in session                       │
│ Status: PLACEHOLDER (Marks complete without doing work) │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 4: Generate Content Calendar ⚠️ MISSING            │
│ ❌ TODO: AI content strategy generation                  │
│ ❌ TODO: Save to content_calendars table                 │
│ Status: PLACEHOLDER                                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 5: Send Welcome Email ⚠️ MISSING                   │
│ ❌ TODO: Send email via notification service             │
│ ❌ TODO: Include audit summary & dashboard link          │
│ Status: PLACEHOLDER                                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ ONBOARDING COMPLETE                                     │
│ • Update status to 'completed'                          │
│ • Set completed_at timestamp                            │
│ • Return companyId to frontend                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 What You Should See (When Fully Implemented)

### Current Behavior (Broken)
1. Client fills form
2. System says "Onboarding complete!"
3. Company exists in database
4. **But NO audit was run**
5. **No content calendar was generated**
6. **No welcome email was sent**
7. Client goes to audit page → "No audit data available"

### Expected Behavior (Fixed)
1. Client fills form
2. System shows real-time progress:
   - ✅ Creating company record...
   - ✅ Setting up workspace...
   - ⏳ Running comprehensive SEO audit... (30-60s)
   - ⏳ Generating content calendar... (10-15s)
   - ⏳ Sending welcome email... (2-3s)
3. System says "Onboarding complete!"
4. Client receives welcome email with:
   - Dashboard link
   - Audit summary (score, top 3 issues)
   - Next steps
5. Client clicks dashboard link
6. Sees pre-populated audit results
7. Sees suggested improvement tasks
8. Sees 30-day content calendar

---

## 🔧 How to Fix It

### Quick Fix (Minimum Viable)

Edit `services/onboarding/onboarding-processor.ts` and replace TODOs with actual implementations.

**Priority Order**:
1. **Step 3: SEO Audit** (Most Important - this is what you're asking about)
2. Step 5: Welcome Email (Good UX)
3. Step 4: Content Calendar (Nice to have)
4. Step 6: Task Generation (Automation gold)

### Step 3 Implementation (SEO Audit)

**Location**: `services/onboarding/onboarding-processor.ts:102-110`

**Replace**:
```typescript
// Step 3: Run SEO Audit
console.log('[Processor] Step 3: Run SEO Audit');
steps[2].status = 'running';
await updateProgress(onboardingId, 'in_progress', 'Run SEO Audit', steps, companyId);

// TODO: Integrate actual Lighthouse audit
steps[2].status = 'completed';
```

**With**:
```typescript
// Step 3: Run SEO Audit
console.log('[Processor] Step 3: Run SEO Audit');
steps[2].status = 'running';
await updateProgress(onboardingId, 'in_progress', 'Run SEO Audit', steps, companyId);

try {
  // Import the comprehensive audit handler directly
  const { POST: runAudit } = await import('@/app/api/companies/[id]/audit/comprehensive/route');

  // Create a mock request object
  const mockRequest = new Request('http://localhost/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  // Call the audit function directly
  const auditResponse = await runAudit(mockRequest, { params: Promise.resolve({ id: companyId }) });
  const auditResult = await auditResponse.json();

  if (auditResult.success) {
    console.log(`[Processor] Audit completed with score: ${auditResult.overall_score}/100`);

    // Store audit_id in session for reference
    await db.query(
      `UPDATE onboarding_sessions SET audit_id = ? WHERE id = ?`,
      [auditResult.audit_id, onboardingId]
    );

    steps[2].status = 'completed';
  } else {
    throw new Error(auditResult.error || 'Audit failed');
  }
} catch (auditError: any) {
  console.error('[Processor] Audit failed:', auditError);
  steps[2].status = 'failed';
  steps[2].error = auditError.message;
  // Continue anyway - don't block onboarding
}
```

---

## 🎬 Testing the Complete Flow

### Before Fix
```bash
# Client onboards → Company created → Audit page empty
curl -X POST http://localhost:3000/api/onboarding/start \
  -H "Content-Type: application/json" \
  -d '{...onboarding data...}'

# Response: "success": true, "companyId": "abc123"

# But when you visit /companies/abc123/seo-audit:
# → "No audit data available"
```

### After Fix
```bash
# Client onboards → Company created → Audit runs automatically
curl -X POST http://localhost:3000/api/onboarding/start \
  -H "Content-Type: application/json" \
  -d '{...onboarding data...}'

# Response (after 60 seconds):
# "success": true,
# "companyId": "abc123",
# "auditId": "xyz789",
# "auditScore": 78

# When you visit /companies/abc123/seo-audit:
# → Full audit results displayed automatically
```

---

## 📋 Summary

**The Problem**: Onboarding processor has placeholder TODOs instead of real implementations.

**The Impact**: Clients get "onboarded" but no actual work is done - no audits, no emails, no calendars.

**The Solution**: Replace TODOs with actual service calls in `onboarding-processor.ts`.

**Priority #1**: Step 3 - Run SEO Audit (this is what you're seeing broken)

**Time to Fix**: ~2 hours for full implementation

**Result**: True end-to-end automation from onboarding form to completed audit with generated tasks.

---

Would you like me to implement these fixes now?
