# System Cleanup - Action Plan
## Based on Audit Report Findings

**Goal**: Remove 40-50% of unused features to optimize for SEO-focused workflow

---

## 📊 Quick Stats

### Current State
- **Total Pages**: 45+
- **Total API Routes**: 120+
- **Database Schemas**: 58 files
- **Navigation Items**: 30+

### Target State
- **Total Pages**: 15-20 (✂️ -55%)
- **Total API Routes**: 70-80 (✂️ -35%)
- **Database Schemas**: 10-12 files (✂️ -80%)
- **Navigation Items**: 12-15 (✂️ -50%)

---

## 🎯 Removal Categories

### 1️⃣ ZERO RISK - Remove Immediately

**Disabled/Dead Code** (NO user impact)
```bash
# These files are already disabled and can be safely deleted
app/_tactical_disabled/
app/sandbox/_agents_disabled/
app/api/_tactical_disabled/
app/api/_agents_disabled/
app/api/_examples/

# Database fix files (already applied or obsolete)
database/fix-*.sql (15 files)
database/*FIX*.sql (8 files)
database/TEST_*.sql (2 files)
```

**Impact**: ✅ Safe, ⚡ Faster builds, 📦 Smaller bundle
**Time**: 30 minutes

---

### 2️⃣ HIGH CONFIDENCE - Traditional CRM (Non-SEO)

**Pages to Remove**
```
❌ app/crm/contacts/page.tsx
❌ app/crm/deals/page.tsx
❌ app/crm/tasks/page.tsx
❌ app/crm/calendar/page.tsx
```

**API Routes to Remove**
```
❌ app/api/crm/contacts/*
❌ app/api/crm/deals/*
❌ app/api/crm/tasks/*
❌ app/api/crm/calendar/*
```

**Database Tables to Remove**
```sql
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS deals;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS calendar_events;
```

**Sidebar Items to Remove**
```typescript
// Remove from crmNavigation array
- Contacts
- Deals
- Tasks
- Calendar
```

**Impact**: 🎯 Focus on SEO, 📉 -30% unused features
**Time**: 2 hours

---

### 3️⃣ DEVELOPER TOOLS - Move to External Services

**Pages to Remove**
```
❌ app/health/page.tsx → Use Vercel Analytics
❌ app/guardian/page.tsx → Use Sentry/DataDog
❌ app/release/monitor/page.tsx → Use GitHub Actions
❌ app/deploy/bluegreen/page.tsx → Use Vercel CLI
❌ app/jobs/page.tsx → Backend management only
❌ app/docs/api/page.tsx → Move to external docs site
```

**API Routes to Remove**
```
❌ app/api/health/* (4 routes)
❌ app/api/guardian/* (2 routes)
❌ app/api/deploy/route.ts
❌ app/api/rollback/route.ts
❌ app/api/bluegreen/route.ts
❌ app/api/builds/route.ts
```

**Impact**: 🧹 Cleaner production app, 🔒 Better security
**Time**: 1.5 hours

---

### 4️⃣ GENERIC PROJECTS - Not SEO-Specific

**Pages to Evaluate/Remove**
```
⚠️ app/projects/page.tsx → Keep for SEO campaigns
❌ app/projects/autolink/page.tsx → What is this?
❌ app/projects/blueprints/page.tsx → Code templates
❌ app/projects/builds/page.tsx → DevOps tool
❌ app/projects/catalog/page.tsx → Unclear purpose
⚠️ app/projects/github/page.tsx → Keep if auditing code
⚠️ app/projects/notes/page.tsx → Keep for client notes
```

**Recommendation**: Keep Projects as "SEO Campaigns" only

**Impact**: 🎯 Repurpose for SEO workflows
**Time**: 1 hour

---

### 5️⃣ RESOURCE LIBRARIES - Nice-to-Have

**Pages to Remove**
```
❌ app/resources/ai-tools/page.tsx → Link to docs
❌ app/resources/components/page.tsx → Dev resource
❌ app/resources/tutorials/page.tsx → External content
✅ app/resources/prompts/page.tsx → KEEP (used for AI)
```

**Impact**: 📚 Simpler, focused resource section
**Time**: 30 minutes

---

### 6️⃣ DATABASE CLEANUP - Consolidate Schemas

**Files to Remove** (40+ files)
```bash
# Remove all duplicate/fix files
database/FULL_SCHEMA.sql
database/CLEAN_SCHEMA.sql
database/MINIMAL_SCHEMA.sql
database/POSTGRES_SCHEMA.sql
database/SUPABASE_SCHEMA.sql

# Remove all fix files
database/fix-*.sql (15 files)
database/*FIX*.sql (8 files)

# Remove all Supabase step files (use one consolidated)
database/SUPABASE-*.sql (20 files)
database/STEP-*.sql (3 files)

# Remove test files
database/TEST_*.sql
```

**Keep Only**:
```
✅ database/schema.sql (master SQLite)
✅ database/ai-search-schema.sql
✅ database/onboarding-schema.sql
✅ database/seo-monitor-schema.sql
✅ database/agent-system-schema.sql
✅ database/integrations-schema.sql
✅ database/job-scheduler-schema.sql
✅ database/notifications-schema.sql
✅ database/migrations/ (versioned migrations)
```

**Impact**: 🗂️ Clean database structure, 📖 Clear schema docs
**Time**: 2-3 hours

---

## 🚀 Execution Plan

### Phase 1: Dead Code Removal (30 min)
```bash
# Safe to delete immediately - ZERO risk
rm -rf app/_tactical_disabled
rm -rf app/sandbox/_agents_disabled
rm -rf app/api/_tactical_disabled
rm -rf app/api/_agents_disabled
rm -rf app/api/_examples
rm -f database/fix-*.sql
rm -f database/*FIX*.sql
rm -f database/TEST_*.sql
```

**Commit**: "chore: remove disabled features and test files"

---

### Phase 2: CRM Removal (2 hours)
```bash
# Remove CRM pages
rm -rf app/crm

# Remove CRM API routes
rm -rf app/api/crm

# Remove from sidebar
# Edit components/Sidebar.tsx - delete crmNavigation array

# Database migration
# Create migration to drop CRM tables
```

**Commit**: "feat: remove traditional CRM features, focus on SEO"

---

### Phase 3: DevOps Tools Removal (1.5 hours)
```bash
# Remove pages
rm -f app/health/page.tsx
rm -f app/guardian/page.tsx
rm -f app/release/monitor/page.tsx
rm -f app/deploy/bluegreen/page.tsx
rm -f app/jobs/page.tsx
rm -f app/docs/api/page.tsx

# Remove API routes
rm -rf app/api/health
rm -rf app/api/guardian
rm -f app/api/deploy/route.ts
rm -f app/api/rollback/route.ts
rm -f app/api/bluegreen/route.ts
rm -f app/api/builds/route.ts

# Remove from sidebar
# Edit components/Sidebar.tsx - delete systemNavigation array
```

**Commit**: "chore: remove DevOps tools from production app"

---

### Phase 4: Streamline Projects (1 hour)
```bash
# Remove unnecessary project pages
rm -f app/projects/autolink/page.tsx
rm -f app/projects/blueprints/page.tsx
rm -f app/projects/builds/page.tsx
rm -f app/projects/catalog/page.tsx

# Rename remaining to focus on SEO
# app/projects/page.tsx → SEO Campaigns
# app/projects/notes/page.tsx → Client Notes
```

**Commit**: "refactor: streamline projects to SEO campaigns"

---

### Phase 5: Simplify Resources (30 min)
```bash
# Remove non-essential resources
rm -f app/resources/ai-tools/page.tsx
rm -f app/resources/components/page.tsx
rm -f app/resources/tutorials/page.tsx
rm -rf app/api/resources/ai-tools
rm -rf app/api/resources/components
rm -rf app/api/resources/tutorials

# Keep prompts only
# Rename section to "AI Prompts"
```

**Commit**: "refactor: keep only AI prompts in resources"

---

### Phase 6: Database Consolidation (3 hours)
```bash
# Create consolidated schemas
mkdir -p database/archive
mv database/SUPABASE-*.sql database/archive/
mv database/STEP-*.sql database/archive/
mv database/fix-*.sql database/archive/
mv database/*FIX*.sql database/archive/
mv database/FULL_SCHEMA.sql database/archive/
mv database/CLEAN_SCHEMA.sql database/archive/
mv database/MINIMAL_SCHEMA.sql database/archive/

# Create migrations directory
mkdir -p database/migrations
# Move active schemas to migrations with version numbers
```

**Commit**: "refactor: consolidate database schemas and create migration system"

---

## 📋 Updated Navigation Structure

### Before (30+ items across 5 sections)
```
SEO (8 items)
CRM (4 items)
Projects (8 items)
Resources (4 items)
System (4 items)
Members (2 items)
```

### After (12-15 items across 3 sections)
```
📊 SEO Management
  - Dashboard
  - New Client (AUTO) ⭐
  - Companies
  - Audits
  - Keywords
  - Rankings
  - Content Gaps
  - Backlinks
  - Reports

🤖 AI Automation
  - SEO Monitor
  - Terminal Pro
  - AI Prompts

⚙️ Settings
  - Integrations
  - Support
```

---

## ✅ Verification Checklist

Before removal, verify:

- [ ] CRM features are truly unused (check analytics)
- [ ] No production dependencies on DevOps pages
- [ ] External monitoring services are configured
- [ ] Database backups are current
- [ ] Test suite passes after each phase
- [ ] Vercel deployment succeeds

---

## 🎯 Success Metrics

### Code Quality
- [ ] Bundle size reduced by 30%+
- [ ] Build time reduced by 25%+
- [ ] TypeScript compile time reduced by 20%+
- [ ] Lighthouse performance score improved

### User Experience
- [ ] Navigation has ≤15 items
- [ ] All links work (no 404s)
- [ ] Page load times improved
- [ ] Clear SEO-focused workflow

### Maintainability
- [ ] Single source of truth for database schema
- [ ] No disabled/commented code
- [ ] Clear separation of concerns
- [ ] Documentation matches reality

---

## 🔄 Rollback Plan

If issues arise:

1. **Git Reset**: Each phase is a separate commit
   ```bash
   git revert HEAD~1  # Undo last phase
   ```

2. **Database**: Keep backups before migrations
   ```bash
   cp data/geo-seo.db data/geo-seo.db.backup
   ```

3. **Vercel**: Previous deployment always available
   ```bash
   vercel rollback
   ```

---

## 📞 Support

If you encounter issues during cleanup:

1. Check git history for what was removed
2. Review SYSTEM_AUDIT_REPORT.md for reasoning
3. Test suite should catch breaking changes
4. Vercel preview deployments for each phase

---

**Ready to Execute**: Yes ✅
**Estimated Total Time**: 8-10 hours
**Recommended Approach**: One phase per day for 6 days
**Risk Level**: Low (with proper testing)

---

Would you like me to start with **Phase 1** (Dead Code Removal - 30 min, ZERO risk)?
