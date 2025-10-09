# E2E Audit - Phase 1 Execution Plan

**Branch:** E2E-Audit
**Start Date:** 2025-10-09
**Duration:** Week 1 (15 hours)
**Goal:** Quick Wins + Tool Setup

---

## Phase 1.1: Install Open-Source Audit Tools (2h)

### Security Scanning Tools
```bash
# Semgrep - Static analysis
npm install -D @semgrep/cli

# Snyk - Vulnerability scanning
npm install -g snyk

# ESLint security plugin
npm install -D eslint-plugin-security

# TruffleHog - Secret scanning (via Docker)
docker pull trufflesecurity/trufflehog:latest
```

### Code Quality Tools
```bash
# TypeScript strict checking
# (already installed, just need to enable)

# Playwright for E2E testing
npm install -D @playwright/test

# Artillery for load testing
npm install -D artillery
```

### Success Criteria
- [ ] Semgrep installed and runnable
- [ ] Snyk authenticated
- [ ] ESLint security plugin configured
- [ ] TruffleHog Docker image pulled
- [ ] Playwright installed

---

## Phase 1.2: Fix CI/CD Working Directory Paths (2h)

### Issue
`.github/workflows/ci.yml` references `./web-app` directory, but Next.js is at root.

### Fix
```yaml
# REMOVE from all jobs:
defaults:
  run:
    working-directory: ./web-app

# UPDATE cache paths:
cache-dependency-path: ./package-lock.json  # was: ./web-app/package-lock.json
```

### Files to Update
- `.github/workflows/ci.yml` (10 jobs)
- `.github/workflows/preflight.yml`
- `.github/workflows/docker-web.yml`

### Success Criteria
- [ ] All workflow files updated
- [ ] No references to `./web-app` remain
- [ ] CI pipeline runs successfully (test locally)

---

## Phase 1.3: Remove Disabled Agent Code (1h)

### Directories to Delete
```bash
rm -rf services/_agents_disabled/
rm -rf services/_tactical-agents_disabled/
rm -rf app/api/_agents_disabled/
rm -rf app/sandbox/_agents_disabled/
```

### Files Being Removed
- `services/_agents_disabled/base-agent.ts`
- `services/_agents_disabled/seo-audit-agent.ts`
- `services/_agents_disabled/content-generation-agent.ts`
- `services/_agents_disabled/client-onboarding-agent.ts`
- `services/_agents_disabled/autonomous-seo-agent.ts`
- `services/_tactical-agents_disabled/orchestration-agent.ts`
- `app/api/_agents_disabled/run/route.ts`
- `app/api/_agents_disabled/tasks/[taskId]/route.ts`
- `app/api/_agents_disabled/status/route.ts`
- `app/sandbox/_agents_disabled/page.tsx`

### Success Criteria
- [ ] All disabled directories removed
- [ ] No broken imports (verify with TypeScript check)
- [ ] Build succeeds
- [ ] ~11 files deleted

---

## Phase 1.4: Add Missing Database Indexes (2h)

### Create Migration File
`database/add-missing-indexes.sql`

### Indexes to Add
```sql
-- Core SEO tables
CREATE INDEX IF NOT EXISTS idx_individuals_company_id ON individuals(company_id);
CREATE INDEX IF NOT EXISTS idx_audits_company_id ON audits(company_id);
CREATE INDEX IF NOT EXISTS idx_keywords_company_id ON keywords(company_id);
CREATE INDEX IF NOT EXISTS idx_competitors_company_id ON competitors(company_id);
CREATE INDEX IF NOT EXISTS idx_citations_company_id ON citations(company_id);
CREATE INDEX IF NOT EXISTS idx_service_areas_company_id ON service_areas(company_id);

-- CRM tables
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline_stage_id ON deals(pipeline_stage_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_rankings_keyword_id ON rankings(keyword_id);
CREATE INDEX IF NOT EXISTS idx_rankings_created_at ON rankings(created_at);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at);
```

### Run Migration
```bash
npm run db:migrate
# or manual:
sqlite3 data/geo-seo.db < database/add-missing-indexes.sql
```

### Success Criteria
- [ ] Migration file created
- [ ] 15+ indexes added
- [ ] Database migration runs successfully
- [ ] Query performance improved (measure with EXPLAIN QUERY PLAN)

---

## Phase 1.5: Run Comprehensive Security Scans (4h)

### Semgrep Scan
```bash
npx semgrep --config=auto --sarif --output .audit/semgrep.sarif .
npx semgrep --config=auto --json --output .audit/semgrep.json .
```

### Snyk Scan
```bash
snyk auth
snyk test --json > .audit/snyk.json
snyk code test --sarif > .audit/snyk-code.sarif
```

### Secret Scanning (TruffleHog)
```bash
docker run --rm -v "$(pwd):/pwd" trufflesecurity/trufflehog:latest filesystem /pwd --json > .audit/secrets.json
```

### ESLint Security
```bash
npx eslint . --ext .ts,.tsx,.js,.jsx --format json > .audit/eslint-security.json
```

### npm Audit
```bash
npm audit --json > .audit/npm-audit.json
```

### TypeScript Strict Check
```bash
npx tsc --noEmit --strict > .audit/typescript-strict-errors.txt 2>&1
```

### Success Criteria
- [ ] Semgrep scan complete (SARIF + JSON)
- [ ] Snyk scan complete (vulnerabilities + code analysis)
- [ ] Secret scanning complete
- [ ] ESLint security check complete
- [ ] npm audit complete
- [ ] TypeScript strict mode errors documented

---

## Phase 1.6: Generate Audit Findings Report (2h)

### Aggregate Results
Use Claude Code general-purpose agent to analyze all scan results:

```bash
# Create consolidated findings
claude-code analyze \
  --input .audit/semgrep.json,.audit/snyk.json,.audit/eslint-security.json \
  --prompt "Analyze all security and code quality findings. Categorize by severity (Critical/High/Medium/Low). Deduplicate findings. Generate prioritized remediation plan." \
  --output .audit/CONSOLIDATED_FINDINGS.md
```

### Report Sections
1. **Executive Summary** (severity distribution, top 10 issues)
2. **Critical Findings** (security vulnerabilities, data loss risks)
3. **High Priority** (performance issues, N+1 queries)
4. **Medium Priority** (code quality, type safety)
5. **Low Priority** (linting, formatting)
6. **Remediation Roadmap** (phased approach with effort estimates)

### Success Criteria
- [ ] All scan results aggregated
- [ ] Findings categorized and prioritized
- [ ] Duplicates removed
- [ ] Remediation plan created
- [ ] Report generated at `.audit/CONSOLIDATED_FINDINGS.md`

---

## Phase 1.7: Quick Wins Implementation (4h)

### Quick Win 1: Consolidate Rate Limiting
**Effort:** 1h
**Files:**
- Keep: `lib/rate-limit.ts`
- Remove: `lib/rateLimit.ts`
- Update all imports

### Quick Win 2: Remove console.log
**Effort:** 2h
**Command:**
```bash
# Find all console.log
grep -r "console\.log" --include="*.ts" --include="*.tsx" app/ services/ components/ > .audit/console-log-list.txt

# Replace with proper logging (Sentry/Winston)
# Manual review + fix
```

### Quick Win 3: Environment Validation
**Effort:** 1h
**Create:** `lib/env-validation.ts`
```typescript
const requiredEnvVars = [
  'NEXTAUTH_SECRET',
  'GOOGLE_OAUTH_CLIENT_ID',
  // ... all 54 env vars
];

export function validateEnv() {
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
}
```

### Success Criteria
- [ ] Rate limiting consolidated
- [ ] console.log replaced with proper logging
- [ ] Environment validation implemented
- [ ] All tests pass
- [ ] Build succeeds

---

## Success Metrics

### Before Phase 1
- Health Score: 62/100
- CI/CD: 0% functional
- Security: 45/100
- Performance: 60/100

### After Phase 1 (Target)
- Health Score: 71/100 (+9)
- CI/CD: 100% functional (+100)
- Security: 50/100 (+5)
- Performance: 68/100 (+8)

---

## Timeline

| Task | Duration | Status |
|------|----------|--------|
| 1.1 Install Tools | 2h | 🔄 In Progress |
| 1.2 Fix CI/CD | 2h | ⏳ Pending |
| 1.3 Remove Disabled Code | 1h | ⏳ Pending |
| 1.4 Add DB Indexes | 2h | ⏳ Pending |
| 1.5 Security Scans | 4h | ⏳ Pending |
| 1.6 Findings Report | 2h | ⏳ Pending |
| 1.7 Quick Wins | 4h | ⏳ Pending |
| **TOTAL** | **17h** | **6% Complete** |

---

## Next Steps

1. ✅ Complete tool installation
2. ⏳ Fix CI/CD paths
3. ⏳ Run security scans
4. ⏳ Generate findings report
5. ⏳ Implement quick wins
6. ⏳ Create PR for Phase 1
