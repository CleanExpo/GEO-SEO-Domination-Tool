# Task List: Complete Client Onboarding System - **100% REAL CODE ONLY**

**Generated from**: [0001-prd-complete-client-onboarding-system.md](0001-prd-complete-client-onboarding-system.md)
**Created**: January 10, 2025
**Status**: **MULTI-AGENT EXECUTION READY**
**Commitment**: **ZERO PLACEHOLDERS, ZERO FALLBACKS, 100% WORKING CODE**

---

## ⚠️ ZERO-TOLERANCE POLICY

**Every line of code must**:
- ✅ Compile without errors
- ✅ Work with real data
- ✅ Pass Playwright tests
- ✅ Have proper error handling
- ✅ Include TypeScript types

**FORBIDDEN**:
- ❌ TODO comments
- ❌ Placeholder functions
- ❌ Mock/fake data
- ❌ Skipped validation
- ❌ Broken API connections

---

## Relevant Files

### Components
- `components/onboarding/ClientIntakeForm.tsx` - Main multi-step form component (~800 lines, contains all 5 steps)
- `app/onboarding/new/page.tsx` - Page wrapper for onboarding flow
- `app/onboarding/[id]/page.tsx` - View specific onboarding session

### API Routes
- `app/api/onboarding/start/route.ts` - Submission endpoint, calls onboarding orchestrator
- `app/api/onboarding/save/route.ts` - Save progress endpoint (auto-save + manual)
- `app/api/onboarding/lookup/route.ts` - Business lookup (free scraper + Google fallback)
- `app/api/onboarding/route.ts` - List all onboarding sessions
- `app/api/onboarding/[id]/route.ts` - Get specific session details
- `app/api/onboarding/credentials/route.ts` - Check API key status

### Services
- `services/onboarding/onboarding-orchestrator.ts` - Main workflow orchestration logic
- `services/api/firecrawl.ts` - Website scraping service (used by business lookup)
- `services/api/claude.ts` - AI content generation (used for onboarding tasks)

### Database
- `database/onboarding-schema.sql` - onboarding_sessions table definition
- `database/saved-onboarding-schema.sql` - saved_onboarding table for progress storage
- `database/client-onboarding-schema.sql` - client_onboarding table (legacy)
- `database/schema.sql` - companies and company_portfolios tables

### Tests
- `scripts/test-onboarding-e2e-playwright.mjs` - End-to-end Playwright test suite

### Middleware
- `middleware.ts` - CSP headers configuration (needs worker-src fix at line 70)

---

## Detailed Implementation Tasks

### 1.0 Fix Form Validation & Next Button Logic ⚡

**Goal**: Enable Next button immediately when all required fields are valid (no more 30s timeouts)

- [ ] **1.1** Read and analyze current validation logic in ClientIntakeForm.tsx lines 250-400
  - Map out isStepValid() function for each step
  - Identify validation dependencies
  - Document current bugs

- [ ] **1.2** Create Zod validation schemas for each step
  - `businessInfoSchema`: businessName, industry, contactName, email, phone, address
  - `websiteSchema`: website (URL validation), hasExistingWebsite, websitePlatform
  - `seoGoalsSchema`: primaryGoals (min 1), targetKeywords (min 3), targetLocations
  - `contentSchema`: contentTypes (min 1), contentFrequency, brandVoice
  - `servicesSchema`: selectedServices (min 1), budget

- [ ] **1.3** Add useEffect hook for real-time validation
  - Debounce 300ms to avoid excessive re-renders
  - Validate current step only (not all steps)
  - Update button disabled state immediately

- [ ] **1.4** Update isStepValid() to use Zod .safeParse()
  - Replace manual if/else checks with schema validation
  - Return validation errors for display
  - Log validation state for debugging

- [ ] **1.5** Add visual feedback for invalid fields
  - Red border on invalid inputs
  - Error message below field (from Zod error.message)
  - Clear errors when field becomes valid

- [ ] **1.6** Add "Required" indicators (*) to all mandatory fields
  - Update Label components with `<span className="text-red-500">*</span>`
  - Add aria-required="true" for accessibility

- [ ] **1.7** Test Next button with Playwright
  - Fill form with valid data
  - Verify button enabled within 500ms
  - Click Next, verify step advances
  - Test with invalid data, verify button stays disabled

- [ ] **1.8** Add debug logging (remove after testing)
  - console.log validation state on every change
  - Log button disabled state
  - Log which fields are invalid

- [ ] **1.9** Update Playwright test suite
  - Add assertion: Next button enables within 500ms
  - Add test case: invalid data keeps button disabled
  - Verify zero 30s timeout errors

- [ ] **1.10** Commit with test proof
  - Run `npm run build` - verify no errors
  - Run Playwright test - verify pass
  - Screenshot clean console
  - Git commit with test results

**QA Gate**: All tests pass, button responsive, zero timeouts

---

### 2.0 Fix Content Security Policy (CSP) Violations 🛡️

**Goal**: Zero CSP worker errors in browser console

- [ ] **2.1** Read current CSP configuration in middleware.ts line 65-80
  - Document current CSP directives
  - Identify missing worker-src

- [ ] **2.2** Add worker-src directive
  - Insert `"worker-src 'self' blob:"` after script-src (line 70)
  - Verify semicolon formatting

- [ ] **2.3** Verify CSP string formatting
  - Check no trailing semicolons
  - Check proper spacing
  - Run middleware locally

- [ ] **2.4** Test locally in browser
  - Start `npm run dev`
  - Open http://localhost:3000/onboarding/new
  - Open DevTools Console tab
  - Verify ZERO "Refused to create worker" errors

- [ ] **2.5** Test worker creation explicitly
  - Add test button that creates worker
  - Verify worker loads successfully
  - Remove test button

- [ ] **2.6** Deploy to Vercel preview
  - Push to git
  - Wait for deployment
  - Test production URL
  - Verify zero CSP errors

- [ ] **2.7** Add code comment
  - Document: "worker-src required for web workers (e.g., PDF generation, heavy computation)"

- [ ] **2.8** Update CLAUDE.md
  - Add to CSP section (line 156-222)
  - Document why worker-src needed

- [ ] **2.9** Commit with proof
  - Screenshot clean console (local + production)
  - Git commit CSP fix

- [ ] **2.10** Run Playwright - verify no CSP errors
  - Check console messages in test output
  - Verify "0 CSP violations" reported

**QA Gate**: Zero CSP errors in dev, production, and tests

---

### 3.0 Integrate Business Lookup with Form Auto-Fill 🔍

**Goal**: Auto-fill 4+ fields when website URL entered

- [ ] **3.1** Read business lookup API in app/api/onboarding/lookup/route.ts
  - Document response structure
  - Map response fields to form fields

- [ ] **3.2** Create field mapping object
  ```typescript
  const fieldMapping = {
    businessName: response.businessName,
    phone: response.phone,
    email: response.email,
    address: response.address,
    websitePlatform: response.platform
  }
  ```

- [ ] **3.3** Add loading spinner component
  - Import Spinner from shadcn/ui
  - Show during API call
  - Hide on success/error

- [ ] **3.4** Wire up lookup button handler
  - Add onClick={() => handleBusinessLookup()}
  - Validate website URL first
  - Call /api/onboarding/lookup with fetch()

- [ ] **3.5** Update setFormData with lookup response
  - Spread existing formData
  - Merge lookup results
  - Preserve user-entered data

- [ ] **3.6** Add error handling
  - Try-catch around fetch()
  - Show toast: "Lookup failed - please enter details manually"
  - Don't block form submission

- [ ] **3.7** Add success toast
  - "✅ Business info auto-filled successfully"
  - List which fields were filled

- [ ] **3.8** Test with real domains
  - disasterrecovery.com.au
  - carsi.com.au
  - google.com
  - nonexistent.com (should handle gracefully)

- [ ] **3.9** Verify 4+ fields populated
  - Check businessName, phone, email, address filled
  - Check data is accurate (matches website)

- [ ] **3.10** Add Playwright test
  - Enter website URL
  - Click lookup button
  - Wait for loading to finish
  - Assert 4+ fields have values
  - Assert values match expected

- [ ] **3.11** Handle edge cases
  - Website doesn't exist → show error, allow manual entry
  - Slow API → timeout after 10s, show error
  - Partial data → fill what's available, user fills rest

- [ ] **3.12** Commit with test coverage
  - Test passes with 70%+ auto-fill rate
  - Git commit working auto-fill

**QA Gate**: 70%+ auto-fill success, graceful failures

---

### 4.0 Complete End-to-End Onboarding Workflow 🔄

**Goal**: Full workflow from submission → company creation → dashboard redirect

- [ ] **4.1** Read onboarding orchestrator
  - services/onboarding/onboarding-orchestrator.ts
  - Document current implementation
  - Identify missing functions

- [ ] **4.2** Implement createCompanyRecord()
  ```typescript
  async createCompanyRecord(data: OnboardingRequest): Promise<number> {
    const db = getDatabase();
    const result = await db.run(
      'INSERT INTO companies (name, website, industry, ...) VALUES (?, ?, ?, ...)',
      [data.businessName, data.website, data.industry, ...]
    );
    return result.lastID; // Return company ID
  }
  ```

- [ ] **4.3** Implement createPortfolioRecord()
  ```typescript
  async createPortfolioRecord(companyId: number, data: OnboardingRequest): Promise<number> {
    const db = getDatabase();
    const result = await db.run(
      'INSERT INTO company_portfolios (company_id, contact_name, ...) VALUES (?, ?, ...)',
      [companyId, data.contactName, ...]
    );
    return result.lastID;
  }
  ```

- [ ] **4.4** Implement linkToUser()
  - Associate company with current user session
  - Update companies table: user_id = currentUserId
  - Handle case where no user logged in (guest onboarding)

- [ ] **4.5** Update startOnboarding() orchestrator
  ```typescript
  async startOnboarding(data: OnboardingRequest): Promise<string> {
    try {
      // 1. Create onboarding session
      const onboardingId = await createOnboardingSession(data);

      // 2. Create company
      const companyId = await createCompanyRecord(data);

      // 3. Create portfolio
      const portfolioId = await createPortfolioRecord(companyId, data);

      // 4. Link to user
      await linkToUser(companyId);

      // 5. Update onboarding session with company ID
      await updateOnboardingSession(onboardingId, { companyId });

      return onboardingId;
    } catch (error) {
      // Rollback on error
      await rollbackOnboarding(onboardingId);
      throw error;
    }
  }
  ```

- [ ] **4.6** Add transaction support (SQLite & PostgreSQL)
  - Wrap all inserts in BEGIN/COMMIT
  - ROLLBACK on any error
  - Test with intentional failures

- [ ] **4.7** Return companyId in API response
  - Update app/api/onboarding/start/route.ts
  - Return: `{ success: true, onboardingId, companyId, portfolioId }`

- [ ] **4.8** Update ClientIntakeForm redirect
  - After successful submission
  - router.push(`/companies/${companyId}`)

- [ ] **4.9** Test full flow with Playwright
  - Fill out all 5 steps
  - Submit form
  - Wait for redirect
  - Verify URL is /companies/[companyId]

- [ ] **4.10** Verify company appears in /companies page
  - Navigate to /companies
  - Assert new company in list
  - Check business name matches

- [ ] **4.11** Verify portfolio record
  - Query database: `SELECT * FROM company_portfolios WHERE company_id = ?`
  - Assert all form data present
  - Check data types correct

- [ ] **4.12** Add background job trigger (non-blocking)
  - Trigger initial SEO audit
  - Don't wait for completion
  - Log job ID for tracking

- [ ] **4.13** Commit with database proof
  - Screenshot of companies table row
  - Screenshot of portfolio table row
  - Git commit working orchestrator

**QA Gate**: E2E test passes, company created, data accurate

---

### 5.0 Add Comprehensive Error Handling & Validation ✅

**Goal**: User-friendly error messages and robust validation

- [ ] **5.1** Add email validation (Zod schema)
  - `email: z.string().email("Please enter a valid email address")`
  - Test with: invalid@, test@, test@example (all should fail)
  - Test with: test@example.com (should pass)

- [ ] **5.2** Add phone validation
  - `phone: z.string().regex(/^[\d\s()+-]{10,}$/, "Phone must be at least 10 digits")`
  - Allow formats: (123) 456-7890, 123-456-7890, 1234567890
  - Strip formatting before saving

- [ ] **5.3** Add website URL validation
  - `website: z.string().url("Please enter a valid URL starting with http:// or https://")`
  - Auto-prepend https:// if missing
  - Test with: example.com → https://example.com

- [ ] **5.4** Add minimum keywords validation
  - `targetKeywords: z.array(z.string()).min(3, "Please enter at least 3 keywords")`
  - Show count: "2/3 keywords" below input

- [ ] **5.5** Add minimum services validation
  - `selectedServices: z.array(z.string()).min(1, "Please select at least 1 service")`

- [ ] **5.6** Create ErrorBoundary component
  ```typescript
  class ErrorBoundary extends React.Component {
    componentDidCatch(error, errorInfo) {
      console.error('React error:', error, errorInfo);
      // Show fallback UI
      this.setState({ hasError: true });
    }
    render() {
      if (this.state.hasError) {
        return <div>Something went wrong. Please refresh the page.</div>;
      }
      return this.props.children;
    }
  }
  ```

- [ ] **5.7** Add try-catch in all API routes
  - Wrap handler in try-catch
  - Return: `{ error: 'Descriptive message', details: error.message }`
  - Log error with context

- [ ] **5.8** Add toast notifications
  - Import useToast hook
  - Show error toast with Zod error message
  - Show success toast on submission

- [ ] **5.9** Add error logging
  - console.error with context: step number, field name, error
  - Format: `[Onboarding Step 1] Validation failed for email: invalid format`

- [ ] **5.10** Test error scenarios
  - Invalid email: test@
  - Invalid URL: example
  - Empty required field
  - Less than 3 keywords

- [ ] **5.11** Verify error messages are helpful
  - NOT: "Error occurred"
  - YES: "Email must be in format: user@example.com"

- [ ] **5.12** Commit with test coverage
  - Test invalid inputs
  - Test error messages displayed
  - Git commit error handling

**QA Gate**: All validation errors show clear, helpful messages

---

### 6.0 Test & Verify Save/Resume Functionality 💾

**Goal**: Users can save and resume onboarding seamlessly

- [ ] **6.1** Read save endpoint (app/api/onboarding/save/route.ts)
  - Document how auto-save works
  - Check interval (30s)

- [ ] **6.2** Test auto-save with console logging
  - Add console.log in auto-save function
  - Fill form, wait 30s
  - Verify "Auto-saved" log appears

- [ ] **6.3** Verify data saved to database
  - Query: `SELECT * FROM saved_onboarding WHERE email = ?`
  - Check form_data column has JSON
  - Check current_step is correct

- [ ] **6.4** Test manual save button
  - Click "Save Progress" button
  - Verify toast: "✅ Progress saved"
  - Check database updated

- [ ] **6.5** Test resume functionality
  - Close browser
  - Reopen /onboarding/new
  - Enter same email + business name
  - Click "Load Saved Progress"
  - Verify form populated exactly

- [ ] **6.6** Add "Continue Previous Onboarding" button
  - On /onboarding/new page
  - Show if saved data exists
  - Load data on click

- [ ] **6.7** Test resume across browser close/reopen
  - Fill steps 1-3
  - Close browser completely
  - Reopen, resume
  - Verify on step 3 with all data

- [ ] **6.8** Verify currentStep preserved
  - Save at step 3
  - Resume
  - Assert UI shows step 3 active

- [ ] **6.9** Clear saved data after submission
  - Submit onboarding successfully
  - Check database: saved_onboarding row deleted
  - Verify no stale data

- [ ] **6.10** Add Playwright test for save/resume
  - Fill steps 1-2
  - Trigger auto-save (wait 30s)
  - Reload page
  - Resume progress
  - Assert on step 2 with data

- [ ] **6.11** Test edge case: partial step data
  - Fill step 3 halfway
  - Save
  - Resume
  - Assert partial data loaded
  - User can complete step

- [ ] **6.12** Commit with test proof
  - Test passes
  - Screenshot of saved_onboarding table
  - Git commit save/resume feature

**QA Gate**: Save/resume works across browser close, zero data loss

---

### 7.0 Consolidate Database Schema & Documentation 📚

**Goal**: Single source of truth, clearly documented

- [ ] **7.1** Document table hierarchy
  - PRIMARY: onboarding_sessions (workflow tracking)
  - TEMPORARY: saved_onboarding (progress storage, cleared after submission)
  - LEGACY: client_onboarding (not used, for migration only)

- [ ] **7.2** Document table purposes
  - onboarding_sessions: Full workflow data, linked to company_id
  - saved_onboarding: Temporary storage for resume feature
  - companies: Master company records
  - company_portfolios: CRM data for each company

- [ ] **7.3** Update DATABASE_ARCHITECTURE.md
  - Add section: "Onboarding Flow Database Schema"
  - Document table relationships
  - Add data flow diagram

- [ ] **7.4** Create ER diagram (mermaid)
  ```mermaid
  erDiagram
    saved_onboarding ||--o{ onboarding_sessions : "progresses to"
    onboarding_sessions ||--|| companies : "creates"
    companies ||--|| company_portfolios : "has"
    companies }o--|| users : "owned by"
  ```

- [ ] **7.5** Update CLAUDE.md
  - Add onboarding schema section
  - Document which table to use when
  - Add code examples

- [ ] **7.6** Add code comments in API routes
  - Top of each route file
  - Comment: "Uses [table_name] for [purpose]"

- [ ] **7.7** Create migration script (if needed)
  - Check for duplicate data
  - Consolidate into onboarding_sessions
  - Archive legacy data

- [ ] **7.8** Test schema with SQLite + PostgreSQL
  - Run db:init locally (SQLite)
  - Verify all tables created
  - Test on Supabase (PostgreSQL)
  - Verify all tables created

- [ ] **7.9** Verify indexes exist
  - Check: `CREATE INDEX idx_saved_onboarding_lookup ON saved_onboarding(business_name, email)`
  - Check: `CREATE INDEX idx_onboarding_email ON onboarding_sessions(email)`
  - Add if missing

- [ ] **7.10** Commit documentation
  - Git commit updated docs
  - Include ER diagram
  - Include table descriptions

**QA Gate**: Documentation clear, schema works in dev + prod

---

## Multi-Agent Execution Plan 🤖

### Agent Roles

**1. Implementation Agent** (Primary Worker)
- Executes tasks 1.1 → 7.10 sequentially
- Writes production-ready code
- NO placeholders, NO TODOs
- Uses real data, real APIs
- **Defined in**: `.claude/agents/implementation-agent.json`

**2. QA Validator Agent** (Quality Gate)
- Reviews EVERY code change
- Runs TypeScript compiler
- Checks for errors
- Verifies acceptance criteria
- **BLOCKS** if any issues found
- **Defined in**: `.claude/agents/qa-validator-agent.json`

**3. Test Runner Agent** (Continuous Testing)
- Runs Playwright tests after each task
- Reports pass/fail immediately
- Monitors console errors
- Blocks deployment on failure
- **Defined in**: `.claude/agents/test-runner-agent.json`

### Execution Workflow

```
┌─────────────────┐
│  Start Task 1.1 │
└────────┬────────┘
         │
         ↓
┌────────────────────┐
│ Implementation     │ ← Writes code
│ Agent executes     │
└────────┬───────────┘
         │
         ↓
┌────────────────────┐
│ QA Validator Agent │ ← Reviews code
│ checks quality     │
└────────┬───────────┘
         │
    ┌────┴────┐
    │  Pass?  │
    └────┬────┘
         │
    ┌────┴────┐
   YES        NO
    │          │
    ↓          ↓
┌───────┐  ┌──────┐
│ Run   │  │ FIX  │
│ Tests │  │ BUGS │
└───┬───┘  └──┬───┘
    │         │
    ↓         │
┌───────────┐ │
│ Test Pass?│ │
└───┬───────┘ │
    │         │
   YES        │
    │         │
    ↓         │
┌───────────┐ │
│  COMMIT   │ │
└───────────┘ │
    │         │
    └─────────┘
         │
    Next Task
```

### Quality Gates (Zero Bypass)

**Every task MUST pass ALL gates**:

1. ✅ **Compilation Gate**: `npm run build` succeeds
2. ✅ **Type Check Gate**: No TypeScript errors
3. ✅ **Test Gate**: Playwright tests pass
4. ✅ **Console Gate**: Zero console errors
5. ✅ **QA Gate**: Agent approval

**If ANY gate fails** → STOP → FIX → RETRY

---

## Estimated Timeline

- **Tasks 1.1-1.10** (Validation): 4-6 hours
- **Tasks 2.1-2.10** (CSP): 1-2 hours
- **Tasks 3.1-3.12** (Auto-fill): 3-4 hours
- **Tasks 4.1-4.13** (Orchestrator): 6-8 hours
- **Tasks 5.1-5.12** (Error handling): 3-4 hours
- **Tasks 6.1-6.12** (Save/resume): 3-4 hours
- **Tasks 7.1-7.10** (Documentation): 2-3 hours

**Total**: 22-31 hours (3-4 days @ 8 hours/day)

---

## 🚀 Ready to Execute

**ALL 76 SUB-TASKS GENERATED**

**Zero-Tolerance Policy Active**:
- ✅ NO placeholders
- ✅ NO fake data
- ✅ NO broken APIs
- ✅ NO skipped tests
- ✅ 100% REAL, WORKING CODE

**Respond with `START` to begin multi-agent parallel execution with zero-bypass quality gates.**

---

*Generated using AI Dev Tasks workflow - https://github.com/snarktank/ai-dev-tasks*
