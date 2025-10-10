# Tom Genie: Comprehensive Validation System

**Mission**: Validate EVERY aspect of the system BEFORE deployment - no more whack-a-mole debugging.

## The Problem You're Facing

> "We are currently using the whack a mole version of fixing which is absolute insanity and not checking the loops, sequences, steps, stages, buttons, navigations, api connections, containers, workflows, and the list just continues."

## Tom Genie Solution

Tom becomes a **Code Engineer Genie** that understands:
1. What you're TRYING to achieve (intent)
2. ALL the moving parts (complete system map)
3. How they SHOULD work together (expected behavior)
4. What's ACTUALLY happening (reality check)
5. What you HAVEN'T thought of (blind spots)

## Comprehensive Validation Matrix

### 1. USER JOURNEY VALIDATION

**What Tom Checks**:
- Complete user flows from start to finish
- Every button click → API call → database → response → UI update
- Error states at each step
- Loading states during transitions
- Success states after completion

**Example: "Run Audit" Journey**:
```
User Action: Click "Run Audit" button
  ↓
Tom Validates:
  ✓ Button exists and is clickable
  ✓ onClick handler is defined (not empty)
  ✓ Handler calls correct API endpoint
  ↓
API Call: POST /api/seo-audits
  ↓
Tom Validates:
  ✓ Endpoint exists in app/api/seo-audits/route.ts
  ✓ POST handler is implemented
  ✓ Request body validation (company_id, url)
  ✓ API keys available (GOOGLE_API_KEY, FIRECRAWL_API_KEY)
  ↓
External APIs: Lighthouse + Firecrawl
  ↓
Tom Validates:
  ✓ API clients initialized
  ✓ Error handling for API failures
  ✓ Timeout configuration
  ✓ Retry logic
  ↓
Database Write: INSERT INTO seo_audits
  ↓
Tom Validates:
  ✓ Using admin client (not createClient with RLS issues)
  ✓ Schema matches TypeScript types
  ✓ Required fields present
  ✓ Foreign key constraints valid
  ↓
API Response: 201 with audit data
  ↓
Tom Validates:
  ✓ Response schema matches frontend interface
  ✓ All expected fields present
  ✓ No placeholder/mock data
  ↓
Frontend Update: Fetch audits list
  ↓
Tom Validates:
  ✓ GET /api/seo-audits called after POST
  ✓ Using admin client (not empty array)
  ✓ Response data displayed in UI
  ✓ No "No audits yet" message when data exists
  ↓
UI Render: Audit card appears
  ↓
Tom Validates:
  ✓ Scores displayed (overall, SEO, performance, accessibility)
  ✓ Audit details visible (URL, date, issues)
  ✓ Navigation to detail page works
```

**Result**: Tom would have caught BOTH issues (RLS in GET + POST creating but not displaying) in a SINGLE scan.

### 2. STATE MANAGEMENT VALIDATION

**What Tom Checks**:
```typescript
// Tom traces state flow
const [loading, setLoading] = useState(false);  // ← Tom checks: Is this set to true during API call?
const [error, setError] = useState(null);       // ← Tom checks: Is this set when API fails?
const [data, setData] = useState([]);           // ← Tom checks: Is this updated after successful fetch?

// Tom validates state machine
Initial State → Loading → Success → Display
              ↘ Error → Show Error Message
```

**Tom Finds**:
- States that never change
- Loading indicators that never show
- Error states that never trigger
- Success states that don't update UI

### 3. API CONNECTION VALIDATION

**Deep Tracing**:
```
Frontend Component
  ↓ (imports)
API Call Function
  ↓ (fetch/axios)
API Endpoint
  ↓ (database client)
Database Table
  ↓ (response)
Return to Frontend
  ↓ (render)
UI Update
```

**Tom Validates Each Step**:
- ✓ Import paths resolve
- ✓ Function is called (not just defined)
- ✓ Endpoint URL matches actual route
- ✓ HTTP method matches (GET vs POST)
- ✓ Request body structure correct
- ✓ Response handling implemented
- ✓ Error handling present
- ✓ UI updates on success/error

### 4. DATABASE SCHEMA CONSISTENCY

**Tom Cross-Checks**:
```sql
-- Database Schema (database/schema.sql)
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  website VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);
```

```typescript
// TypeScript Types (types/database.ts)
interface Company {
  id: string;
  name: string;
  website?: string;  // ← Tom checks: Optional in TS matches nullable in DB
  created_at: string;
}
```

```typescript
// API Response (app/api/companies/route.ts)
return NextResponse.json({
  company: {
    id: data.id,
    name: data.name,
    website: data.website,
    created_at: data.created_at
  }
});  // ← Tom validates: All fields match
```

```typescript
// Frontend Interface (components/CompanyCard.tsx)
interface CompanyCardProps {
  company: Company;  // ← Tom validates: Uses correct type
}
```

**Tom Finds**:
- Column name mismatches (`company_name` vs `name`)
- Type mismatches (`number` in DB, `string` in TS)
- Missing required fields
- Extra fields in response not in schema

### 5. LOOP & SEQUENCE VALIDATION

**Loops Tom Checks**:
```typescript
// Example: Onboarding flow
Step 0: Business Info → Save → Load
  ↓
Tom Validates:
  ✓ Save endpoint works (POST /api/onboarding/save)
  ✓ Data persists to database
  ✓ Load endpoint works (GET /api/onboarding/load)
  ✓ Loaded data matches saved data
  ↓
Step 1: Website Info → Save → Load
  ↓
Tom Validates:
  ✓ Previous step data still available
  ✓ New step data appends correctly
  ✓ No data loss between steps
  ↓
[Continues for all 5 steps]
  ↓
Final Step: Submit → Process → Redirect
  ↓
Tom Validates:
  ✓ All step data combined correctly
  ✓ Submit endpoint creates company
  ✓ Redirect URL is valid (not 404)
  ✓ Target page loads company data
```

### 6. WORKFLOW VALIDATION

**Multi-Step Processes Tom Traces**:
```
1. Create Company
   ↓ (company_id returned)
2. Run Initial Audit
   ↓ (audit_id returned)
3. Generate Keywords
   ↓ (keyword_ids returned)
4. Create Content Calendar
   ↓ (calendar_id returned)
5. Send Welcome Email
   ↓ (email_id returned)
```

**Tom Validates**:
- Each step completes before next starts
- IDs propagate correctly through chain
- Failure at any step is handled gracefully
- Partial completion doesn't leave orphaned data
- User sees progress indicators
- Errors don't break entire workflow

### 7. NAVIGATION VALIDATION

**Tom Maps All Routes**:
```
/companies
  ↓ Click company row
/companies/[id]/seo-audit
  ↓ Click "Keywords" tab
/companies/[id]/keywords
  ↓ Click "Add Keyword"
Modal opens → Add keyword → Close modal
  ↓ Keywords list updates
```

**Tom Checks**:
- All navigation links point to existing routes
- Dynamic routes ([id]) resolve correctly
- Back button works
- Breadcrumbs are accurate
- Active nav item highlighted
- No 404s in navigation flow

### 8. CONTAINER & COMPONENT VALIDATION

**Tom Analyzes Component Hierarchy**:
```
Layout
  ├─ Sidebar
  │   ├─ Nav Links (Tom: All links work?)
  │   └─ User Menu (Tom: Logout works?)
  ├─ Main Content
  │   ├─ Page Component
  │   │   ├─ Form (Tom: Validation works?)
  │   │   ├─ Button (Tom: Handler works?)
  │   │   └─ Modal (Tom: Opens/closes?)
  │   └─ Toast Notifications (Tom: Show/hide?)
  └─ Footer
```

**Tom Validates**:
- Props passed correctly
- State lifted/shared properly
- Context providers wrap correctly
- Event handlers bubble up
- Data flows down, events bubble up

### 9. ENVIRONMENT & CONFIGURATION

**Tom Checks**:
```
.env.local (Local)
  ├─ DATABASE_URL: ✓ Set
  ├─ ANTHROPIC_API_KEY: ✓ Set
  ├─ GOOGLE_API_KEY: ⚠️  Missing
  └─ FIRECRAWL_API_KEY: ✓ Set

.env.example (Documentation)
  ├─ DATABASE_URL: ✓ Documented
  ├─ ANTHROPIC_API_KEY: ✓ Documented
  ├─ GOOGLE_API_KEY: ✓ Documented
  └─ FIRECRAWL_API_KEY: ✗ NOT Documented

Vercel Environment Variables (Production)
  ├─ DATABASE_URL: ✓ Set
  ├─ ANTHROPIC_API_KEY: ✓ Set
  ├─ GOOGLE_API_KEY: ⚠️  Missing
  ├─ FIRECRAWL_API_KEY: ✓ Set
  └─ SUPABASE_SERVICE_ROLE_KEY: ✓ Set
```

**Tom Finds**:
- Missing env vars in production
- Undocumented env vars
- Unused env vars in code
- Hardcoded values that should be env vars

### 10. DEPENDENCY GRAPH VALIDATION

**Tom Traces Dependencies**:
```
Button Click
  ↓ depends on
onClick Handler
  ↓ depends on
API Client Function
  ↓ depends on
Environment Variable
  ↓ depends on
External Service
  ↓ returns
Data
  ↓ depends on
TypeScript Interface
  ↓ depends on
Database Schema
```

**Tom Validates**:
- All dependencies installed
- No circular dependencies
- Version compatibility
- Breaking changes in updates
- Security vulnerabilities

## Enhanced Tom Output Example

```
🧞 TOM GENIE: Comprehensive System Validation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 DEEP ANALYSIS MODE: Tracing ALL workflows...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 USER JOURNEY: Create Company → Run Audit → View Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Create Company
  ✓ Component: app/onboarding/new/page.tsx
  ✓ Form validation: ClientIntakeForm.tsx (React Hook Form)
  ✓ Submit handler: handleSubmit() → POST /api/onboarding/start
  ✓ API endpoint: app/api/onboarding/start/route.ts (IMPLEMENTED)
  ✓ Database write: INSERT INTO companies (admin client ✓)
  ✓ Response: 201 with company_id
  ✓ Redirect: /onboarding/[id] (route exists ✓)

Step 2: Run Audit
  ✓ Component: app/companies/[id]/seo-audit/page.tsx
  ❌ CRITICAL: URL field empty (Company GET fails)
  ❌ CRITICAL: Click "Run Audit" → POST /api/seo-audits (500 error)
     └─ Root Cause: RLS infinite recursion
     └─ Fix: Use createAdminClient() in app/api/companies/[id]/route.ts
  ❌ CRITICAL: Audit created but not displayed
     └─ Root Cause: GET /api/seo-audits using createClient()
     └─ Fix: Use createAdminClient() in app/api/seo-audits/route.ts

Step 3: View Results
  ⚠️  BLOCKED: Cannot view results (Step 2 failures)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 WORKFLOW VALIDATION: Complete Client Onboarding
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Workflow: /api/onboarding/start → /api/onboarding/process
  ✓ Stage 1: Save onboarding data (WORKS)
  ✓ Stage 2: Create company record (WORKS)
  ❌ Stage 3: Trigger initial audit (TODO placeholder)
     Location: services/onboarding/onboarding-processor.ts:107
     Current: steps[2].status = 'completed'; // TODO
     Fix: Call POST /api/seo-audits with company_id
  ❌ Stage 4: Generate content calendar (TODO placeholder)
     Location: services/onboarding/onboarding-processor.ts:117
     Fix: Implement calendar generation
  ❌ Stage 5: Send welcome email (TODO placeholder)
     Location: services/onboarding/onboarding-processor.ts:127
     Fix: Call email service with template

IMPACT: User completes onboarding but downstream actions never happen

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 API CONNECTION TRACE: Run Audit Button
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UI: app/companies/[id]/seo-audit/page.tsx:146
  <button onClick={runAudit}>Run Audit</button>
  ↓
Handler: runAudit() at line 73
  ↓ calls
API: POST /api/seo-audits
  ↓
Endpoint: app/api/seo-audits/route.ts:55
  ✓ POST handler exists
  ✓ Using createAdminClient() ✓
  ↓ calls
External APIs:
  ├─ Google Lighthouse API
  │   ❌ GOOGLE_API_KEY missing in Vercel
  │   Impact: HIGH - Audit will fail or use limited data
  └─ Firecrawl API
      ✓ FIRECRAWL_API_KEY present
  ↓ writes to
Database: seo_audits table
  ✓ Using admin client (bypasses RLS)
  ✓ Schema matches TypeScript types
  ↓ returns
Response: 201 with audit data
  ↓ triggers
Frontend: fetchAudits() at line 61
  ↓ calls
API: GET /api/seo-audits?company_id=X
  ↓
Endpoint: app/api/seo-audits/route.ts:7
  ✓ GET handler exists
  ✓ NOW using createAdminClient() (FIXED!)
  ↓ returns
Audits array
  ↓ updates
UI State: setAudits(data.audits)
  ↓ renders
Audit Cards: line 156-239

RESULT: Full connection traced end-to-end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 CRITICAL ISSUES (Prevent Deployment)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Missing GOOGLE_API_KEY in Vercel
   Impact: Audit feature degraded
   Users see: Incomplete audit data
   Fix: Add to Vercel environment variables

2. Onboarding workflow has TODO placeholders
   Impact: Promised features don't execute
   Users see: No follow-up after sign-up
   Fix: Implement stages 3-5 in onboarding-processor.ts

3. [List continues with all blocking issues...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 BLIND SPOTS: Issues You Didn't Know About
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Multiple API routes still using createClient()
   Routes affected: /api/keywords, /api/rankings, /api/scheduled-jobs
   Risk: Same RLS error will hit these features
   Fix: Batch update all to createAdminClient()

2. No error boundaries in React components
   Impact: One error crashes entire app
   Fix: Add <ErrorBoundary> wrappers

3. Loading states missing in 23 components
   Impact: Users think app is frozen
   Fix: Add loading spinners/skeletons

4. No request timeout configuration
   Impact: Infinite hangs on slow APIs
   Fix: Add timeout to all fetch calls

5. Success messages not showing after actions
   Impact: Users unsure if action completed
   Fix: Add toast notifications

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 DEPLOYMENT RECOMMENDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ DO NOT DEPLOY

Critical issues must be fixed first:
  1. Add GOOGLE_API_KEY to Vercel
  2. Complete onboarding workflow (remove TODOs)
  3. Update remaining createClient() calls

After fixing, run: npm run tom --full
```

## Implementation Plan

Tom Genie needs these new capabilities:

1. **AST Parser**: Analyze code structure deeply
2. **Call Graph Generator**: Map all function calls
3. **State Flow Tracer**: Follow React state changes
4. **API Connection Mapper**: Trace UI → API → DB
5. **Workflow Validator**: Check multi-step processes
6. **Blind Spot Detector**: Find issues user didn't mention
7. **Fix Generator**: Produce actual code fixes
8. **Impact Analyzer**: Predict cascading failures

This is what Tom needs to BE to stop the whack-a-mole madness.
