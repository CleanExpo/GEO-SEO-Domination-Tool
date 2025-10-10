# Tom Enhanced - Complete Validation System

> "Stop whack-a-mole debugging. Catch ALL issues before production."

## Overview

Tom is a comprehensive pre-deployment validation system that prevents production bugs by systematically checking your entire codebase using **Parallel-R1 multi-path analysis**.

### The Problem Tom Solves

Traditional development workflow:
1. Write code
2. Push to production
3. User reports bug
4. Debug and fix
5. Push fix
6. Repeat for next bug (**whack-a-mole debugging**)

Tom's approach:
1. Write code
2. Run Tom validation
3. Fix ALL issues before pushing
4. Deploy with confidence ✅

## Quick Start

```bash
# Basic validation (2 minutes)
npm run tom

# Comprehensive validation with blind spot detection (5 minutes)
npm run tom:genie

# Auto-fix common issues (30 seconds)
npm run tom:fix

# Fast incremental validation (30 seconds)
npm run tom:diff

# 🚀 ULTIMATE: Autonomous engine - runs for hours, fixes everything
npm run tom:all
```

## Available Commands

### `npm run tom` - Basic 5-Path Validation

**Use when:** Quick pre-commit check

**What it does:**
- Scans 120 API routes
- Analyzes 138 components
- Checks 157 database tables
- Finds: RLS issues, placeholders, TODOs, mock data
- **Speed:** ~2 minutes
- **Output:** Categorized issue list (CRITICAL, HIGH, MEDIUM, LOW)

**Example Output:**
```
🤖 TOM VALIDATION REPORT

Issues Found:
  • 0 CRITICAL ✓
  • 65 HIGH (RLS issues, mock data, placeholders)
  • 46 MEDIUM (TODOs, missing handlers)
  • 18 LOW (console.log statements)
```

---

### `npm run tom:genie` - Comprehensive Validation

**Use when:** Before major deployments, weekly health checks

**What it does:**
- Everything in basic Tom, PLUS:
- **User journey tracing** (Create Company → Run Audit → View Results)
- **API connection mapping** (UI → API → DB validation)
- **Blind spot detection** (finds issues you didn't know about!)
- **State flow analysis**
- **Workflow validation**

**Speed:** ~5 minutes

**Example Output:**
```
🧞 TOM GENIE: Comprehensive System Validation

💡 BLIND SPOTS (Issues You Didn't Know About):

1. 9 API routes using createClient() (same pattern as Run Audit bug)
   Impact: Future bugs with same root cause
   Fix: Batch update all to createAdminClient()

2. 12 components make API calls but have no loading state
   Impact: Users think app is frozen
   Fix: Add loading spinners/skeletons

3. 2 components have no error state
   Impact: Errors fail silently
   Fix: Add error state and display
```

**Why use this:** Tom Genie finds **systematic issues** that cause the same bug pattern across multiple features.

---

### `npm run tom:fix` - Auto-Fix Common Issues

**Use when:** Tom found issues you want to fix automatically

**What it does:**
- Replaces `createClient()` → `createAdminClient()` in API routes (100% confidence)
- Removes `console.log` statements (95% confidence)
- Adds missing environment variables to `.env.example` (100% confidence)

**Speed:** ~30 seconds

**Safety:** Only applies fixes with 90%+ confidence. Asks for confirmation on <90%.

**Example Output:**
```
🔧 TOM AUTO-FIX: Applying automated fixes...

✅ Fixes Applied: 9
   - app/api/keywords/route.ts: RLS bypass (100% confidence)
   - app/api/rankings/route.ts: RLS bypass (100% confidence)
   - .env.example: Added 3 missing variables (100% confidence)

⏭️  Fixes Skipped: 15
   - Already fixed or not applicable

🔄 Next Steps:
   1. Review changes: git diff
   2. Test changes: npm run dev
   3. Validate fixes: npm run tom:genie
   4. Commit: git add . && git commit -m "fix: apply Tom auto-fixes"
```

---

### `npm run tom:diff` - Fast Incremental Validation

**Use when:** After making changes, before committing

**What it does:**
- Validates ONLY files changed since last commit
- Intelligent validation based on file type:
  - API route changed → Test endpoint + all callers
  - Component changed → Test component + all user flows
  - Schema changed → Verify types updated, migration exists
  - package.json changed → Check for breaking changes

**Speed:** ~30 seconds (vs 2-5 min for full scan)

**Example Output:**
```
⚡ TOM DIFF MODE: Validating changed files...

📁 Found 3 changed files:
   - app/api/companies/[id]/route.ts
   - components/AuditForm.tsx
   - database/migrations/010_make_seo_audits_user_id_nullable.sql

🔍 Validating API route: app/api/companies/[id]/route.ts
   ✅ Using createAdminClient() ✓
   ✅ Error handling present ✓
   ✅ Validation complete

🔍 Validating component: components/AuditForm.tsx
   ✅ Loading state present ✓
   ✅ Error handling present ✓
   ✅ Validation complete

🔍 Validating schema: database/migrations/010_make_seo_audits_user_id_nullable.sql
   ✅ Has migration number ✓
   ✅ Has ROLLBACK section ✓
   ✅ Validation complete

✅ ALL CHECKS PASSED
Deployment Recommendation: ✅ SAFE TO DEPLOY
```

---

## Advanced Features

### Blind Spot Detection

Tom Genie finds issues you **didn't explicitly mention** but are just as critical:

**Example:**
- You report: "Run Audit button not working"
- Tom finds: "9 other API routes have the SAME bug (using createClient)"
- **Impact:** Prevents 9 future bug reports

**Categories of Blind Spots:**
1. **Systematic issues** (same bug pattern in multiple files)
2. **Missing UX patterns** (loading states, error handling)
3. **Incomplete implementations** (TODO comments in production)
4. **Security risks** (exposed secrets, SQL injection)
5. **Performance issues** (slow queries, large bundles)

### User Journey Validation

Tom traces complete user flows end-to-end:

**Example Journey: "Create Company → Run Audit"**
```
Step 1: Create Company
  ✓ Onboarding form → POST /api/onboarding/start ✓
  ✓ Company created in database ✓

Step 2: Navigate to Audit Page
  ✓ Route exists: /companies/[id]/seo-audit ✓

Step 3: Load Company Data
  ✓ GET /api/companies/[id] ✓
  ✓ Using admin client (no RLS errors) ✓
  ✓ URL auto-populates in form ✓

Step 4: Run Audit (POST)
  ✓ POST /api/seo-audits ✓
  ✓ Lighthouse API call succeeds ✓
  ✓ Audit saved to database ✓

Step 5: Fetch Audits (GET)
  ✓ GET /api/seo-audits?company_id=... ✓
  ✓ Using admin client ✓
  ✓ Returns audit data ✓

Step 6: Display Results
  ✓ Audit card renders ✓
  ✓ Score displayed correctly ✓

✅ JOURNEY COMPLETE (all steps working)
```

If ANY step fails, Tom reports:
- Which step broke
- Root cause
- Exact fix with code example

### Confidence Scoring

Tom assigns confidence scores to all fixes:

- **100%:** Proven fix (we've fixed this exact issue before)
- **95%:** Standard pattern (common best practice)
- **90%:** Strong evidence (multiple paths confirm)
- **70%:** Inferred from context (likely correct)
- **50%:** Suggested improvement (best guess)

**Auto-fix only applies fixes with 90%+ confidence.**

### Integration Health Checks

Tom tests external APIs to ensure they're working:

**APIs Tested:**
- ✅ Anthropic Claude (content generation)
- ✅ DeepSeek (local SEO analysis)
- ✅ Firecrawl (web scraping)
- ✅ Lighthouse (page speed)
- ✅ SEMrush (competitor data)
- ✅ Supabase (database)

**What's Checked:**
1. Environment variables exist
2. API responds to test request
3. Response format matches TypeScript types
4. Error handling works
5. Response time < 10 seconds

---

## Development Workflow

### Daily Development

```bash
# Start development
npm run dev

# Make changes to code...

# Before committing:
npm run tom:diff       # Fast validation of changed files
npm run tom:fix        # Auto-fix any issues
git add .
git commit -m "feat: add feature"
```

### Before Major Deployment

```bash
# Full validation
npm run tom:genie

# Fix critical issues found
npm run tom:fix

# Verify all fixes worked
npm run tom:genie

# Deploy when clean
git push
```

### Weekly Health Check

```bash
# Run comprehensive validation
npm run tom:genie

# Review blind spots
# Fix systematic issues in batch
npm run tom:fix

# Verify
npm run tom:genie
```

---

## Understanding the Output

### Issue Severity Levels

**CRITICAL** (blocks core functionality):
- API endpoint returns 500 error
- Button onClick does nothing
- Database connection fails
- Required environment variable missing
- **Action:** DO NOT DEPLOY until fixed

**HIGH** (impacts UX significantly):
- Component missing loading state (app appears frozen)
- No error handling (errors fail silently)
- Using createClient() (potential RLS issues)
- Mock/placeholder data in production
- **Action:** Fix before deploying

**MEDIUM** (should fix soon):
- TODO comments in production code
- Type mismatches (any types masking issues)
- Missing migrations for schema changes
- **Action:** Fix in next sprint

**LOW** (non-urgent):
- console.log statements
- Outdated dependencies
- Code style issues
- **Action:** Fix when convenient

### Reading Tom Reports

**Executive Summary:**
```
Overall Status: ❌ CRITICAL ISSUES
Deployment Recommendation: DO NOT DEPLOY

Issues Found:
  • 3 CRITICAL
  • 12 HIGH
  • 8 MEDIUM
  • 5 LOW
```

**Issue Details:**
```
1. API /api/companies/[id] returns 404
   Location: app/api/companies/[id]/route.ts:18
   Error: "infinite recursion detected in policy"
   Impact: CRITICAL (blocks company audit flow)
   Fix: Replace createClient() with createAdminClient()
   Confidence: 100% (proven fix)
```

**Fix Recommendations:**
```
File: app/api/companies/[id]/route.ts
Line: 18

Current Code:
const supabase = await createClient();

Recommended Fix:
import { createAdminClient } from '@/lib/auth/supabase-admin';
const supabase = createAdminClient();

Reason: Bypasses Supabase RLS infinite recursion
Confidence: 100%
```

---

## Parallel-R1 Framework

Tom uses **Parallel-R1 multi-path analysis** - testing issues from 5 different perspectives simultaneously:

### Path A: API Connectivity
- Scans all API routes
- Tests endpoints
- Checks for RLS errors, placeholders, mock data

### Path B: UI Components
- Scans all components
- Traces buttons → handlers → API calls
- Checks for loading states, error handling

### Path C: Data Flow Integrity
- Reads database schemas
- Extracts TypeScript types
- Cross-verifies DB ↔ Types ↔ API ↔ Frontend

### Path D: Dependency Verification
- Checks package.json
- Scans all imports
- Verifies environment variables

### Path E: Integration Testing
- Defines critical user flows
- Executes end-to-end tests
- Verifies each step succeeds

**Cross-Verification:** If multiple paths find the same issue, confidence increases to 100%.

---

## Custom Validation Rules

Create `.tom/custom-rules.json` to define project-specific rules:

```json
{
  "rules": [
    {
      "name": "no-admin-client-in-frontend",
      "severity": "CRITICAL",
      "pattern": "createAdminClient",
      "files": ["app/**/page.tsx", "components/**/*.tsx"],
      "message": "Never use admin client in frontend - security risk"
    },
    {
      "name": "require-loading-state",
      "severity": "HIGH",
      "pattern": "fetch\\(",
      "requires": "useState.*loading|isLoading",
      "message": "Components making API calls must have loading state",
      "autofix": true,
      "autofixTemplate": "const [isLoading, setIsLoading] = useState(false);"
    }
  ]
}
```

---

## Performance Benchmarks

### Validation Speed

| Command | Speed | Files Scanned | Use Case |
|---------|-------|---------------|----------|
| `tom:diff` | 30s | Changed only | Pre-commit check |
| `tom` | 2 min | All (basic scan) | Daily validation |
| `tom:genie` | 5 min | All (deep analysis) | Pre-deployment |
| `tom:fix` | 30s | Issues found | Apply fixes |

### Metrics

**System Map:**
- 120 API routes
- 138 React components
- 157 database tables
- 99 dependencies
- ~150,000 lines of code

**Execution:**
- Worker threads: 5 (parallel paths)
- Memory usage: ~200MB
- CPU usage: 80% (multi-core)

---

## Troubleshooting

### "Tom found false positives"

Tom is conservative - it flags potential issues even if uncertain. This is intentional.

**Solution:** Review the issue, if it's safe, ignore it. Tom will learn over time.

### "Tom is too slow"

Use incremental mode:
```bash
npm run tom:diff    # Only changed files (30s)
```

### "Auto-fix broke my code"

Auto-fix only applies 90%+ confidence fixes. If it broke something:
```bash
git diff            # Review changes
git restore .       # Revert if needed
```

Report the issue so we can improve auto-fix logic.

### "Tom didn't find an issue"

Tom focuses on systematic issues and common patterns. Edge cases may slip through.

**Solution:** Add a custom rule to catch that pattern in future.

---

## What's Next?

### Planned Features

1. **Watch Mode** (`npm run tom:watch`)
   - Continuous validation on file changes
   - Real-time feedback during development

2. **Focus Mode** (`npm run tom:focus api`)
   - Deep dive on specific areas
   - Options: api, ui, db, deps, e2e, security

3. **Regression Detection**
   - Track validation history
   - Flag NEW issues introduced since last run

4. **Performance Benchmarking**
   - Track validation metrics over time
   - Identify trends (improving vs. degrading)

5. **Security Scanning**
   - SQL injection detection
   - XSS vulnerability checks
   - Exposed secrets detection

---

## Summary

Tom is your **pre-deployment safety net**:

✅ **Comprehensive:** Checks API, UI, DB, dependencies, user flows
✅ **Intelligent:** Finds blind spots you didn't know about
✅ **Fast:** Incremental mode validates in 30 seconds
✅ **Automated:** Auto-fixes common issues with high confidence
✅ **Trustworthy:** Cross-verifies with Parallel-R1 framework

**Before Tom:**
- Whack-a-mole debugging
- Production bugs discovered by users
- Hours spent on reactive fixes

**After Tom:**
- Proactive issue detection
- Deploy with confidence
- Focus on building features, not firefighting

---

**Quick Reference:**

```bash
npm run tom          # Basic validation (2 min)
npm run tom:genie    # Full validation with blind spots (5 min)
npm run tom:fix      # Auto-fix common issues (30s)
npm run tom:diff     # Validate changed files only (30s)
```

**When to use what:**
- Daily: `tom:diff` (before commits)
- Weekly: `tom:genie` (health check)
- Pre-deployment: `tom:genie` then `tom:fix`
- Emergency: `tom` (quick scan)
