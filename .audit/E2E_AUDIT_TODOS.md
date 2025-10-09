# E2E Audit - Todo List

**Branch:** E2E-Audit
**Health Score Target:** 62 → 88/100
**Total Effort:** 212 hours (5-6 weeks)

---

## Phase 0: Integration Setup ⏳

- [x] Create E2E-Audit branch
- [ ] Integrate new GitHub repos for audit assistance
- [ ] Set up audit working environment
- [ ] Configure additional tooling

---

## Phase 1: Week 1 Quick Wins (15 hours)

### 1. Fix CI/CD Working Directories (2h)
- [ ] Update `.github/workflows/ci.yml` - remove `working-directory: ./web-app`
- [ ] Test CI pipeline locally
- [ ] Verify all jobs run correctly

### 2. Remove Duplicate ErrorBoundary (1h)
- [ ] Keep `components/ErrorBoundary.tsx` (has Sentry)
- [ ] Remove `app/error.tsx` (Next.js built-in)
- [ ] Update imports across codebase

### 3. Add Missing Database Indexes (2h)
- [ ] Create `database/add-missing-indexes.sql`
- [ ] Add 15+ indexes on foreign keys
- [ ] Run migration script
- [ ] Verify query performance improvement

### 4. Remove Disabled Agent Code (1h)
- [ ] Delete `services/_agents_disabled/` (6 files)
- [ ] Delete `services/_tactical-agents_disabled/` (1 file)
- [ ] Delete `app/api/_agents_disabled/` (3 routes)
- [ ] Delete `app/sandbox/_agents_disabled/` (1 file)
- [ ] Verify no broken imports

### 5. Consolidate Rate Limiting (3h)
- [ ] Review `lib/rate-limit.ts` vs `lib/rateLimit.ts`
- [ ] Keep newer implementation
- [ ] Update all imports
- [ ] Remove duplicate file
- [ ] Test rate limiting functionality

### 6. Add Environment Validation (2h)
- [ ] Create `lib/env-validation.ts`
- [ ] Add validation for 54 environment variables
- [ ] Add clear error messages
- [ ] Integrate into startup process

### 7. Remove console.log Statements (4h)
- [ ] Search for all 221 console.log instances
- [ ] Replace with proper logging service
- [ ] Configure Sentry/Winston/custom logger
- [ ] Test logging in dev and prod

---

## Phase 2: Performance Optimization (32 hours)

### Database Performance
- [ ] Implement database connection pooling
- [ ] Optimize N+1 queries
- [ ] Add query result caching
- [ ] Set up slow query monitoring

### Response Caching
- [ ] Implement Redis for caching
- [ ] Add cache headers
- [ ] Configure CDN caching
- [ ] Test cache invalidation

### Bundle Optimization
- [ ] Analyze bundle size (current: 119 deps)
- [ ] Remove unused dependencies
- [ ] Implement code splitting
- [ ] Optimize import statements
- [ ] Configure tree shaking

### Rate Limiting Migration
- [ ] Set up Upstash Redis
- [ ] Migrate from in-memory to Redis
- [ ] Test serverless compatibility
- [ ] Configure rate limit policies

---

## Phase 3: Code Quality (87 hours)

### TypeScript Strict Mode
- [ ] Enable `strictNullChecks`
- [ ] Enable `noImplicitAny`
- [ ] Enable full `strict: true`
- [ ] Remove `ignoreBuildErrors` from next.config.js
- [ ] Fix ~500 files with type errors

### Testing
- [ ] Set up Jest/Vitest
- [ ] Add unit tests for services
- [ ] Add integration tests for APIs
- [ ] Set up Playwright E2E tests
- [ ] Target 60% code coverage

### Dead Code Removal
- [ ] Find unused exports
- [ ] Remove unreferenced files
- [ ] Clean up unused imports
- [ ] Remove orphan database tables

### Documentation Cleanup
- [ ] Consolidate 281 markdown files
- [ ] Remove redundant docs
- [ ] Update outdated documentation
- [ ] Create single source of truth

---

## Phase 4: Security Hardening (45 hours)

### Critical Security Fixes
- [ ] Remove eval() from `services/browser-automation.ts`
- [ ] Audit 54 files for hardcoded secrets
- [ ] Move all secrets to environment variables
- [ ] Add secret scanning to CI/CD

### CORS & Security Headers
- [ ] Implement proper CORS middleware
- [ ] Add CSP headers (already started)
- [ ] Configure cookie security flags
- [ ] Add rate limiting on hot endpoints

### Authentication & Authorization
- [ ] Verify JWT configuration
- [ ] Test OAuth flow thoroughly
- [ ] Add session management
- [ ] Implement RBAC if needed

### SSRF & XSS Prevention
- [ ] Audit external API calls
- [ ] Sanitize all user inputs
- [ ] Implement request validation
- [ ] Add output encoding

---

## Phase 5: CI/CD & Observability (33 hours)

### CI/CD Pipeline
- [ ] Fix GitHub Actions workflows
- [ ] Add required status checks
- [ ] Implement test gating
- [ ] Document rollback procedures
- [ ] Set up artifact retention

### Structured Logging
- [ ] Implement Winston/Pino
- [ ] Add trace IDs to all logs
- [ ] Categorize error types
- [ ] Set up log aggregation

### Monitoring & Alerts
- [ ] Set up Sentry for error tracking
- [ ] Configure performance monitoring
- [ ] Add uptime probes
- [ ] Define SLIs/SLOs
- [ ] Create monitoring dashboards

### E2E Testing
- [ ] Set up Playwright tests
- [ ] Add auth flow tests
- [ ] Add critical path tests
- [ ] Integrate with CI/CD

---

## Health Score Tracking

### Current: 62/100
- Security: 45/100
- Performance: 60/100
- Code Quality: 55/100
- CI/CD: 0/100
- Observability: 40/100

### After Phase 1 (Week 1): 71/100
- Security: 50/100 (+5)
- Performance: 68/100 (+8)
- Code Quality: 62/100 (+7)
- CI/CD: 100/100 (+100)
- Observability: 40/100

### Target After All Phases: 88/100
- Security: 95/100 (+50)
- Performance: 85/100 (+25)
- Code Quality: 90/100 (+35)
- CI/CD: 100/100 (+100)
- Observability: 85/100 (+45)

---

## Resources

- **Full Audit Report:** `.audit/AUDIT_REPORT.md`
- **Summary:** `AUDIT_SUMMARY.md`
- **Synapse_CoR Guide:** `SYNAPSE_COR.md`
- **Audit Job Spec:** `prompts/full_audit.json`
- **Performance Budgets:** `lighthouserc.json`
