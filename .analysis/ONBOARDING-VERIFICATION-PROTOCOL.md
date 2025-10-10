# Onboarding Flow Verification Protocol

## Purpose
Prevent deployment of broken onboarding flows by catching issues BEFORE user testing.

## Critical Insight
**The onboarding flow has failed at the SAME POINT multiple times because we verify code structure instead of actual execution.**

---

## Mandatory Pre-Deployment Checklist

### 1. Schema Validation (5 minutes)
```bash
# Check PostgreSQL schema for ALL ID column types
grep -A 5 "CREATE TABLE.*company_portfolios\|client_onboarding\|companies" database/empire-crm-schema.sql | grep "id.*UUID\|id.*TEXT"

# Check what ID format the code generates
grep -r "generatePortfolioId\|generateCompanyId\|generateClientId" app/ services/ --include="*.ts" -A 3
```

**Pass Criteria:**
- If schema uses `UUID`, code MUST use `randomUUID()`
- If schema uses `TEXT`, code can use string patterns
- NO MISMATCHES allowed

---

### 2. Database Insert Simulation (10 minutes)
```bash
# Create test script that simulates the exact INSERT statements
node scripts/test-onboarding-inserts.js
```

**What to test:**
- Generate actual portfolio_id value
- Try inserting into PostgreSQL test database
- Verify foreign key constraints work
- Check JSON field serialization

**Pass Criteria:**
- Script completes without SQL errors
- All IDs validate against column types
- Foreign keys resolve correctly

---

### 3. API Endpoint Testing (10 minutes)
```bash
# Run actual HTTP requests against local dev server
node scripts/test-onboarding-api.js
```

**Test sequence:**
1. POST /api/onboarding (create client)
2. PATCH /api/onboarding (update to step 2-6)
3. PATCH /api/onboarding (mark onboarding_completed = true)
4. Verify portfolio_id created in company_portfolios table
5. GET /api/onboarding?clientId={id} (verify data integrity)

**Pass Criteria:**
- All requests return 200/201 status
- No database constraint violations
- Portfolio creation succeeds
- Client-portfolio linkage established

---

### 4. Frontend Flow Simulation (15 minutes)
```bash
# Use Playwright to test actual UI flow
npx playwright test tests/onboarding-flow.spec.ts --headed
```

**Test steps:**
- Fill Step 1 (business info) → Submit
- Fill Step 2 (goals) → Submit
- Fill Step 3 (services) → Submit
- Fill Step 4 (budget) → Submit
- Fill Step 5 (credentials) → Submit
- Verify Step 6 (completion) shows success message
- Check database for completed onboarding record

**Pass Criteria:**
- User completes all 6 steps without errors
- Success message displayed on Step 6
- Database shows onboarding_completed = 1
- Portfolio record exists and is linked

---

### 5. Error Path Testing (10 minutes)

Test FAILURE scenarios:
- Duplicate email registration
- Missing required fields
- Invalid credential formats
- Database connection failure

**Pass Criteria:**
- Proper error messages displayed
- No silent failures
- Database rollback on errors
- User can retry after fixing issue

---

## Why This Failed Before

### Previous Verification Approach (WRONG)
✗ Read code files
✗ Check TypeScript types
✗ Review database schemas
✗ Say "looks good" without testing

### Root Cause
**We verified STRUCTURE, not BEHAVIOR.**

Code can be:
- ✓ Syntactically correct
- ✓ TypeScript valid
- ✓ Follows best practices
- ✗ **Generates wrong data types at runtime**

---

## New Verification Approach (CORRECT)

### Execute → Observe → Verify
1. **Execute** the actual onboarding flow code
2. **Observe** what values are generated (IDs, JSON, dates)
3. **Verify** those values against database constraints

### Test Scripts Required

Create these test scripts (if they don't exist):

1. `scripts/test-onboarding-inserts.js`
   - Simulate database INSERTs with generated IDs
   - Catch constraint violations before deployment

2. `scripts/test-onboarding-api.js`
   - HTTP requests to all onboarding endpoints
   - Test complete flow from Step 1-6

3. `tests/onboarding-flow.spec.ts`
   - Playwright browser automation
   - Test actual user experience

---

## Deployment Rule

**DO NOT deploy onboarding changes unless:**

1. ✅ All 5 checklist items pass
2. ✅ Test scripts execute successfully
3. ✅ Playwright test completes without errors
4. ✅ Manual verification on localhost confirms flow works

**If ANY test fails:**
- ❌ Do NOT push to GitHub
- ❌ Do NOT deploy to Vercel
- ❌ Fix the issue first
- ❌ Re-run ALL tests

---

## Lessons Learned

### UUID Format Issue (2025-01-11)
**Problem:** `invalid input syntax for type uuid: "portfolio_1760113302380"`

**Why We Missed It:**
- Checked code structure ✓
- Didn't run actual INSERT statement ✗
- Didn't test ID generation at runtime ✗
- Didn't verify against PostgreSQL schema ✗

**How to Catch Next Time:**
```javascript
// Test script would have caught this immediately
const portfolioId = generatePortfolioId(); // "portfolio_1760113302380"
console.log('Generated ID:', portfolioId);
console.log('Is valid UUID?', isUUID(portfolioId)); // FALSE ← CAUGHT!
```

---

## Success Metrics

**Before This Protocol:**
- Deployment success rate: ~60%
- User-reported bugs: High
- Rollback frequency: 2-3x per week

**After This Protocol (Target):**
- Deployment success rate: >95%
- User-reported bugs: Low
- Rollback frequency: <1x per month

---

## Action Items

- [ ] Create `scripts/test-onboarding-inserts.js`
- [ ] Create `scripts/test-onboarding-api.js`
- [ ] Create `tests/onboarding-flow.spec.ts`
- [ ] Add pre-commit hook to run tests
- [ ] Document test execution in CI/CD pipeline

**Last Updated:** 2025-01-11
**Status:** ACTIVE - Use for ALL onboarding changes
