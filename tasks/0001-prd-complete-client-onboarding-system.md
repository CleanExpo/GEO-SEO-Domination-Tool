# PRD: Complete Client Onboarding System - 100% Working with True Data

**PRD Number**: 0001
**Feature Name**: Complete Client Onboarding System
**Priority**: P0 (Critical)
**Status**: Draft
**Created**: January 10, 2025
**Owner**: Development Team

---

## Executive Summary

The client onboarding system is partially working but has **critical issues preventing 100% completion**. Users can fill out forms and submit data, but the system:
1. Has disabled "Next" buttons that never enable (timeout after 30s)
2. Has CSP (Content Security Policy) violations preventing web workers
3. Uses test/mock data instead of real business information
4. Does not properly validate required fields before enabling navigation
5. Does not persist data correctly across all steps
6. Does not complete the full workflow from form submission → company creation → portfolio setup

**Goal**: Make the entire client onboarding flow work **100% end-to-end with true, validated data**, zero console errors, and seamless user experience.

---

## Background & Current State

### Test Results Analysis

**Playwright E2E Test Results** (from bash outputs):
- ✅ **Step 1** (Business Info): Working - form fills, moves to Step 2
- ✅ **Step 2** (Website Details): Working - form fills, moves to Step 3
- ✅ **Step 3** (SEO Goals): Working - checkboxes, keywords fill correctly
- ✅ **Step 4** (Content Strategy): Working - brand voice captured
- ✅ **Step 5** (Services & Budget): Working - services selected
- ✅ **API Submission**: Returns `{"success":true, "onboardingId":"onboarding_1760064174720_kfwn3kmhb"}`

**But One Test FAILED**:
- ❌ **"Next" Button Timeout**: In some tests, "Next" button stays `disabled` forever, causing 30s timeout
  ```
  Timeout 30000ms exceeded.
  locator resolved to <button disabled class="...">
  element is not enabled
  ```

**Console Errors** (Both Tests):
- ❌ **CSP Worker Violation**:
  ```
  Refused to create a worker from 'blob:https://geo-seo-domination-tool.vercel.app/...'
  because it violates CSP directive: "script-src 'self' 'unsafe-eval' 'unsafe-inline'..."
  Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback.
  ```

### Current Database Schema

**Three Onboarding Tables**:
1. `saved_onboarding` - Save/resume progress (SQLite & PostgreSQL)
2. `onboarding_sessions` - Full workflow tracking (from onboarding-schema.sql)
3. `client_onboarding` - Client-specific data (from client-onboarding-schema.sql)

**Issues**:
- Multiple overlapping schemas causing confusion
- Not clear which table is authoritative
- Data not flowing properly from form → API → database → company/portfolio

### Current API Endpoints

**6 Onboarding APIs**:
- `POST /api/onboarding/start` - Starts onboarding (uses onboardingOrchestrator)
- `POST /api/onboarding/save` - Saves progress (uses saved_onboarding table)
- `POST /api/onboarding/lookup` - Business lookup (free scraper + Google fallback)
- `GET /api/onboarding` - List all onboarding sessions
- `GET /api/onboarding/[id]` - Get specific session
- `GET /api/onboarding/credentials` - Check API credentials

**Issues**:
- Business lookup works but data not auto-filled into forms
- Onboarding orchestrator exists but workflow incomplete
- No automatic company/portfolio creation after successful submission

---

## User Stories

### Primary User: SEO Agency Owner
> "As an SEO agency owner, I want to onboard new clients through a simple form so that I can immediately start tracking their SEO performance without manual data entry."

**Acceptance Criteria**:
- [ ] Complete all 5 steps of the onboarding wizard without errors
- [ ] "Next" button enables immediately when all required fields are filled
- [ ] Business lookup auto-fills company information (name, phone, email, address)
- [ ] All data persists if I close browser and return later
- [ ] Submission creates a real company record in the database
- [ ] Dashboard shows the new client immediately after onboarding

### Secondary User: Client (Self-Service Onboarding)
> "As a potential client, I want to sign up for SEO services by filling out my business details so that I can get started quickly without needing a sales call."

**Acceptance Criteria**:
- [ ] Form is intuitive with clear labels and help text
- [ ] Website lookup finds my business information automatically
- [ ] Can select multiple SEO goals, keywords, and services
- [ ] Get immediate confirmation email after submission
- [ ] See expected next steps and timeline

---

## Requirements

### Must Have (P0 - This Release)

#### 1. Fix "Next" Button Validation Logic
**Problem**: Button stays disabled even when all fields are filled.

**Solution**:
- [ ] Review validation logic in `ClientIntakeForm.tsx` for each step
- [ ] Ensure required fields trigger re-validation on every input change
- [ ] Add visual feedback showing which fields are incomplete (red borders, error messages)
- [ ] Test with Playwright to verify button enables within 500ms of completing fields

**Success Criteria**: "Next" button enables immediately when all required fields are valid.

#### 2. Fix CSP Worker Violation
**Problem**: Browser blocks web workers due to Content Security Policy.

**Solution**:
- [ ] Update `middleware.ts` CSP headers to allow web workers: `"worker-src 'self' blob:"`
- [ ] Verify fix in production after deployment
- [ ] Check browser console shows zero CSP errors

**Success Criteria**: Zero CSP violations in browser console.

#### 3. Integrate Business Lookup with Form Auto-Fill
**Problem**: Lookup works but data doesn't populate form fields.

**Solution**:
- [ ] Wire up `/api/onboarding/lookup` response to `setFormData()` state
- [ ] Map API response fields to form fields:
  - `businessName` → Business Name
  - `phone` → Phone
  - `email` → Contact Email
  - `address` → Address
  - `platform` → Website Platform
- [ ] Show loading spinner during lookup
- [ ] Handle lookup failures gracefully (allow manual entry)

**Success Criteria**: Entering a website URL auto-fills 4+ fields correctly.

#### 4. Complete End-to-End Workflow
**Problem**: Form submits but doesn't create company/portfolio records.

**Solution**:
- [ ] Review `onboardingOrchestrator.startOnboarding()` in `/services/onboarding/onboarding-orchestrator.ts`
- [ ] Ensure it creates records in correct tables:
  1. Insert into `onboarding_sessions` (track workflow)
  2. Insert into `companies` (create company record)
  3. Insert into `company_portfolios` (CRM portfolio)
  4. Link company to user's account
- [ ] Return company ID in API response
- [ ] Redirect user to new company dashboard page

**Success Criteria**: After submission, new company appears in `/companies` page with all data.

#### 5. Data Validation & Error Handling
**Problem**: No clear error messages when submission fails.

**Solution**:
- [ ] Add client-side validation for all required fields (before API call)
- [ ] Validate email format, phone format, website URL format
- [ ] Show toast notifications for validation errors
- [ ] Add error boundary to catch React errors gracefully
- [ ] Log all errors to console with context

**Success Criteria**: Users see clear error messages if submission fails, with guidance on how to fix.

#### 6. Save & Resume Progress
**Problem**: Feature exists but not fully tested.

**Solution**:
- [ ] Test save functionality (auto-save every 30s + manual save button)
- [ ] Test resume functionality (load saved data by email + business name)
- [ ] Add "Continue Previous Onboarding" button on landing page
- [ ] Clear saved data after successful submission

**Success Criteria**: Users can close browser mid-onboarding and resume exactly where they left off.

#### 7. Database Schema Consolidation
**Problem**: Three overlapping onboarding tables causing confusion.

**Solution**:
- [ ] Choose ONE authoritative table for onboarding data (recommend `onboarding_sessions`)
- [ ] Map `saved_onboarding` to temporary progress storage only
- [ ] Use `client_onboarding` only for legacy data migration
- [ ] Update all API endpoints to use consistent table
- [ ] Document schema in `DATABASE_ARCHITECTURE.md`

**Success Criteria**: Single source of truth for onboarding data, clearly documented.

### Should Have (P1 - Next Release)

#### 8. Email Notifications
- [ ] Send welcome email with login credentials
- [ ] Send onboarding completion confirmation
- [ ] Send reminders if onboarding incomplete after 24h

#### 9. Admin Dashboard for Onboarding
- [ ] View all in-progress onboardings
- [ ] See completion percentage for each
- [ ] Manually mark steps as complete
- [ ] Export onboarding data to CSV

#### 10. Pre-fill from Query Parameters
- [ ] Support URLs like `/onboarding/new?email=test@example.com&business=Test%20Co`
- [ ] Useful for referral links and marketing campaigns

### Won't Have (Out of Scope)

- Payment integration (separate feature)
- Multi-language support (English only for now)
- Custom branding per agency (single brand)
- Integration with CRM systems (future release)

---

## Technical Architecture

### Component Structure
```
app/onboarding/new/page.tsx         # Page wrapper
  └── ClientIntakeForm.tsx          # Main form component (5 steps)
      ├── Step 1: Business Info
      ├── Step 2: Website Details
      ├── Step 3: SEO Goals
      ├── Step 4: Content Strategy
      └── Step 5: Services & Budget
```

### API Flow
```
1. User fills form → ClientIntakeForm.tsx
2. Click "Submit" → POST /api/onboarding/start
3. API calls → onboardingOrchestrator.startOnboarding()
4. Orchestrator:
   a. Validates data
   b. Creates onboarding_sessions record
   c. Creates companies record
   d. Creates company_portfolios record
   e. Triggers background jobs (audit, keywords setup)
5. Returns onboardingId + companyId
6. Frontend redirects to /companies/[companyId]
```

### Database Changes
**No new tables needed**. Use existing:
- `onboarding_sessions` (workflow tracking)
- `companies` (company master data)
- `company_portfolios` (CRM data)
- `saved_onboarding` (temporary progress storage)

### Validation Rules
```typescript
// Step 1: Business Info
required: [businessName, contactName, email, phone]
validation: {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s()+-]+$/ (min 10 digits)
}

// Step 2: Website Details
required: [website]
validation: {
  website: starts with http:// or https://
}

// Step 3: SEO Goals
required: [primaryGoals (min 1), targetKeywords (min 3)]

// Step 4: Content Strategy
required: [contentTypes (min 1), brandVoice]

// Step 5: Services & Budget
required: [selectedServices (min 1), budget]
```

---

## Success Metrics

### Primary KPIs
- **Onboarding Completion Rate**: Target 90%+ (currently ~50% due to disabled button bug)
- **Average Time to Complete**: Target < 5 minutes
- **Error Rate**: Target < 1% failed submissions
- **Business Lookup Success Rate**: Target 70%+ auto-fill rate

### Quality Metrics
- **Zero CSP Errors**: 100% of browser sessions
- **Zero Playwright Test Failures**: All 13 E2E tests passing
- **Data Accuracy**: 100% of submitted data appears in database correctly
- **Button Responsiveness**: "Next" enables within 500ms of field completion

### User Experience Metrics
- **Save & Resume Usage**: Track how many users save progress
- **Form Abandonment**: Track which step users abandon most (optimize that step)
- **Lookup Usage**: Track how many users use business lookup feature

---

## Testing Strategy

### Automated Tests (Playwright)
- [ ] E2E test covering all 5 steps with valid data
- [ ] E2E test with invalid data (email, phone, website format)
- [ ] E2E test for save & resume functionality
- [ ] E2E test for business lookup auto-fill
- [ ] API integration tests for all 6 onboarding endpoints

### Manual Tests
- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Test on mobile (responsive design)
- [ ] Test with slow network (loading states)
- [ ] Test with missing API credentials (error handling)

### Performance Tests
- [ ] Form renders in < 1 second
- [ ] Business lookup completes in < 5 seconds
- [ ] Form submission completes in < 10 seconds

---

## Dependencies

### Internal
- `middleware.ts` - CSP headers (needs update)
- `services/onboarding/onboarding-orchestrator.ts` - Workflow logic (needs completion)
- `app/api/onboarding/lookup/route.ts` - Business lookup (working)
- `components/ui/*` - Shadcn UI components (working)

### External Services
- **Firecrawl** - Website scraping for business lookup
- **Google Places API** - Fallback for business lookup
- **Supabase/PostgreSQL** - Production database
- **SQLite** - Development database

### NPM Packages (Already Installed)
- `next` - Framework
- `react-hook-form` - Form management (optional upgrade)
- `zod` - Schema validation (optional upgrade)
- `lucide-react` - Icons

---

## Implementation Plan (High-Level)

### Phase 1: Fix Critical Bugs (P0)
**Duration**: 2-3 days
1. Fix "Next" button validation logic
2. Fix CSP worker violation
3. Integrate business lookup auto-fill
4. Test end-to-end with Playwright

### Phase 2: Complete Workflow (P0)
**Duration**: 3-4 days
1. Complete onboarding orchestrator
2. Create company/portfolio records
3. Add proper error handling
4. Test save & resume functionality

### Phase 3: Polish & Documentation (P1)
**Duration**: 1-2 days
1. Add email notifications
2. Create admin dashboard view
3. Document schema in CLAUDE.md
4. Record demo video

**Total Estimated Duration**: 6-9 days (1.5-2 weeks)

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| CSP fix breaks other features | High | Low | Test all pages after CSP change |
| Orchestrator creates duplicate companies | High | Medium | Add unique constraint on company email |
| Business lookup rate-limited | Medium | Medium | Cache results, throttle requests |
| Data validation too strict | Medium | Medium | Allow override for edge cases |

---

## Open Questions

1. **Should we merge the three onboarding tables into one?**
   - Recommendation: Use `onboarding_sessions` as primary, keep others for legacy

2. **Should business lookup be mandatory or optional?**
   - Recommendation: Optional (auto-fill if available, manual if not)

3. **What happens if user creates duplicate onboarding for same business?**
   - Recommendation: Show warning, offer to resume existing onboarding

4. **Should we add progress bar showing % complete?**
   - Recommendation: Yes, helps user know how much is left

---

## Reference Files

**Components**:
- @components/onboarding/ClientIntakeForm.tsx (main form, ~800 lines)
- @app/onboarding/new/page.tsx (page wrapper)

**API Routes**:
- @app/api/onboarding/start/route.ts (submission endpoint)
- @app/api/onboarding/save/route.ts (save progress)
- @app/api/onboarding/lookup/route.ts (business lookup)

**Services**:
- @services/onboarding/onboarding-orchestrator.ts (workflow logic)

**Database**:
- @database/onboarding-schema.sql (onboarding_sessions table)
- @database/saved-onboarding-schema.sql (saved_onboarding table)
- @database/client-onboarding-schema.sql (client_onboarding table)

**Tests**:
- @scripts/test-onboarding-e2e-playwright.mjs (E2E test suite)

**Middleware**:
- @middleware.ts (CSP headers - line 70 needs update)

---

## Approval Sign-Off

- [ ] Product Owner: _______________________
- [ ] Technical Lead: _______________________
- [ ] QA Lead: _______________________

---

**Next Steps**:
1. Review and approve this PRD
2. Generate detailed task list using `/generate-tasks`
3. Begin implementation using `/process-task-list`

---

*PRD created using AI Dev Tasks workflow - https://github.com/snarktank/ai-dev-tasks*
