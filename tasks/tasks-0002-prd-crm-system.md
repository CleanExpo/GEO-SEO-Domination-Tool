# Task List: CRM System (Contacts, Deals, Tasks, Portfolio)

**Generated from:** `0002-prd-crm-system.md`
**Date:** 2025-01-18
**Status:** In Progress

---

## Relevant Files

### API Routes (To be created/modified)
- `app/api/crm/contacts/route.ts` - Contacts list and create (EXISTS - needs UPDATE/DELETE)
- `app/api/crm/contacts/[id]/route.ts` - Contact by ID operations (NEEDS CREATION)
- `app/api/crm/deals/route.ts` - Deals list and create (EXISTS - needs UPDATE/DELETE)
- `app/api/crm/deals/[id]/route.ts` - Deal by ID operations (NEEDS CREATION)
- `app/api/crm/tasks/route.ts` - Tasks list and create (EXISTS - needs FULL IMPLEMENTATION)
- `app/api/crm/tasks/[id]/route.ts` - Task by ID operations (NEEDS CREATION)
- `app/api/crm/portfolio/route.ts` - Portfolio list and create (EXISTS - needs FULL IMPLEMENTATION)
- `app/api/crm/portfolio/[id]/route.ts` - Portfolio by ID operations (NEEDS CREATION)

### Database Schema
- `database/empire-crm-schema.sql` - CRM database schema (EXISTS but not in use)
- Need to verify if `crm_contacts`, `crm_deals`, `crm_tasks`, `crm_portfolio` tables exist

### Types
- `types/crm.ts` - TypeScript type definitions (EXISTS and matches PRD spec)

### Playwright Tests (To be created)
- `tests/api/crm-contacts.spec.ts` - Test all contact endpoints
- `tests/api/crm-deals.spec.ts` - Test all deal endpoints
- `tests/api/crm-tasks.spec.ts` - Test all task endpoints
- `tests/api/crm-portfolio.spec.ts` - Test all portfolio endpoints

### Notes
- All endpoints MUST use `createAdminClient()` from `@/lib/auth/supabase-admin`
- All input validation MUST use Zod schemas
- All tests MUST use Playwright MCP to verify actual API responses
- Database tables MUST exist before testing endpoints

---

## Tasks

- [ ] 1.0 Complete Contacts API Implementation
  - [ ] 1.1 Create `app/api/crm/contacts/[id]/route.ts` with GET, PUT, DELETE endpoints
  - [ ] 1.2 Add Zod validation schemas for update operations
  - [ ] 1.3 Implement proper error handling for 404 (contact not found) and 400 (validation errors)
  - [ ] 1.4 Write Playwright test `tests/api/crm-contacts.spec.ts` covering all CRUD operations
  - [ ] 1.5 Run Playwright test and verify all endpoints return correct status codes and data
  - [ ] 1.6 Fix any failing tests until all pass

- [ ] 2.0 Complete Deals API Implementation
  - [ ] 2.1 Create `app/api/crm/deals/[id]/route.ts` with GET, PUT, DELETE endpoints
  - [ ] 2.2 Add Zod validation schemas for deal updates (including stage transitions)
  - [ ] 2.3 Implement proper error handling and validation for contact_id foreign key
  - [ ] 2.4 Write Playwright test `tests/api/crm-deals.spec.ts` covering all CRUD operations
  - [ ] 2.5 Run Playwright test and verify pipeline stage updates work correctly
  - [ ] 2.6 Fix any failing tests until all pass

- [ ] 3.0 Complete Tasks API Implementation
  - [ ] 3.1 Verify `crm_tasks` table exists in database (run query or create from schema)
  - [ ] 3.2 Implement GET and POST endpoints in `app/api/crm/tasks/route.ts` with filtering
  - [ ] 3.3 Create `app/api/crm/tasks/[id]/route.ts` with GET, PUT, DELETE endpoints
  - [ ] 3.4 Add Zod validation schemas for task creation and updates
  - [ ] 3.5 Implement query parameter filtering (status, contact_id, deal_id, priority)
  - [ ] 3.6 Write Playwright test `tests/api/crm-tasks.spec.ts` covering all CRUD and filtering
  - [ ] 3.7 Run Playwright test and verify task status transitions work
  - [ ] 3.8 Fix any failing tests until all pass

- [ ] 4.0 Complete Portfolio API Implementation
  - [ ] 4.1 Verify `crm_portfolio` table exists in database (run query or create from schema)
  - [ ] 4.2 Implement GET and POST endpoints in `app/api/crm/portfolio/route.ts` with filtering
  - [ ] 4.3 Create `app/api/crm/portfolio/[id]/route.ts` with GET, PUT, DELETE endpoints
  - [ ] 4.4 Add Zod validation schemas for portfolio creation and updates (handle JSONB fields)
  - [ ] 4.5 Implement query parameter filtering (contact_id, featured)
  - [ ] 4.6 Write Playwright test `tests/api/crm-portfolio.spec.ts` covering all CRUD and filtering
  - [ ] 4.7 Run Playwright test and verify JSONB fields (metrics, images) work correctly
  - [ ] 4.8 Fix any failing tests until all pass

- [ ] 5.0 Verify Database Schema and Run Integration Tests
  - [ ] 5.1 Connect to production database and verify all 4 CRM tables exist
  - [ ] 5.2 If tables missing, run `database/empire-crm-schema.sql` to create them
  - [ ] 5.3 Create integration test `tests/integration/crm-user-journeys.spec.ts`
  - [ ] 5.4 Test Journey 1: Create contact → Create deal linked to contact → Verify relationship
  - [ ] 5.5 Test Journey 2: Create task linked to contact and deal → Mark complete → Verify status
  - [ ] 5.6 Test Journey 3: Create portfolio item → Link to contact → Verify featured flag
  - [ ] 5.7 Test Journey 4: Delete contact → Verify cascade delete of related deals/tasks
  - [ ] 5.8 Run all integration tests and fix any failures
  - [ ] 5.9 Verify zero RLS errors in all operations (admin client must bypass RLS)

---

## Verification Checklist

Before marking this PRD as complete, ALL of the following must be TRUE:

- [ ] All 16 API endpoints return proper status codes (200, 201, 400, 404, 500)
- [ ] All Playwright tests pass without failures
- [ ] All endpoints use `createAdminClient()` (no RLS errors)
- [ ] All input validated with Zod (no invalid data accepted)
- [ ] All CRUD operations work end-to-end
- [ ] Query filtering works for all filter parameters
- [ ] Foreign key relationships work (contact_id, deal_id)
- [ ] JSONB fields (metrics, images) serialize/deserialize correctly
- [ ] Integration tests cover all user journeys from PRD
- [ ] Production database has all 4 CRM tables
