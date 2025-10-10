# Task List: Complete Client Onboarding System

**Generated from**: [0001-prd-complete-client-onboarding-system.md](0001-prd-complete-client-onboarding-system.md)
**Created**: January 10, 2025
**Status**: Ready for Implementation

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

### Notes
- Current test results show 1 success, 1 failure (Next button timeout)
- CSP worker violation present in all tests
- Business lookup works but doesn't auto-fill form
- Onboarding orchestrator partially implemented but missing company/portfolio creation

---

## Tasks

### Phase 1: High-Level Tasks

Based on the PRD analysis and current codebase assessment, here are the main high-level tasks:

- [ ] **1.0 Fix Form Validation & Next Button Logic**
  - Current Issue: Next button stays disabled causing 30s timeout
  - Goal: Enable Next button immediately when all required fields are valid
  - Files: `components/onboarding/ClientIntakeForm.tsx`

- [ ] **2.0 Fix Content Security Policy (CSP) Violations**
  - Current Issue: Web workers blocked by CSP directive
  - Goal: Zero CSP errors in browser console
  - Files: `middleware.ts`

- [ ] **3.0 Integrate Business Lookup with Form Auto-Fill**
  - Current Issue: Lookup works but doesn't populate form fields
  - Goal: Auto-fill 4+ fields when website URL entered
  - Files: `components/onboarding/ClientIntakeForm.tsx`, `app/api/onboarding/lookup/route.ts`

- [ ] **4.0 Complete End-to-End Onboarding Workflow**
  - Current Issue: Form submits but doesn't create company/portfolio
  - Goal: Full workflow from submission → company creation → dashboard redirect
  - Files: `services/onboarding/onboarding-orchestrator.ts`, `app/api/onboarding/start/route.ts`

- [ ] **5.0 Add Comprehensive Error Handling & Validation**
  - Current Issue: No clear error messages for validation failures
  - Goal: User-friendly error messages and robust validation
  - Files: `components/onboarding/ClientIntakeForm.tsx`, all API routes

- [ ] **6.0 Test & Verify Save/Resume Functionality**
  - Current Issue: Feature exists but not fully tested
  - Goal: Users can save and resume onboarding seamlessly
  - Files: `app/api/onboarding/save/route.ts`, `components/onboarding/ClientIntakeForm.tsx`

- [ ] **7.0 Consolidate Database Schema & Documentation**
  - Current Issue: Three overlapping onboarding tables causing confusion
  - Goal: Single source of truth, clearly documented
  - Files: All database schemas, `DATABASE_ARCHITECTURE.md`, `CLAUDE.md`

---

**I have generated the high-level tasks based on the PRD. Ready to generate the sub-tasks? Respond with 'Go' to proceed.**
