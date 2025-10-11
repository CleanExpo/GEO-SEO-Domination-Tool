# PRD Summary - Missing API Endpoints

**Generated:** 2025-01-11
**Identified By:** Tom All Autonomous Engine
**Total PRDs Created:** 5
**Total Missing Endpoints:** 27

---

## Overview

Tom All discovered **27 critical missing API endpoints** where UI components are calling non-existent routes. These have been organized into **5 comprehensive PRDs** ready for implementation.

---

## PRD #0001: Complete Client Onboarding System
**Status:** Already Exists
**File:** `tasks/0001-prd-complete-client-onboarding-system.md`
**Endpoints:** Onboarding flow (5 steps)

---

## PRD #0002: CRM System
**Status:** ✅ Created
**File:** `tasks/0002-prd-crm-system.md`
**Priority:** Critical
**Estimated Time:** 5-7 hours

### Missing Endpoints (9 total):
1. `/api/crm/contacts` - GET, POST, PUT, DELETE
2. `/api/crm/contacts/[id]` - GET, PUT, DELETE
3. `/api/crm/deals` - GET, POST, PUT, DELETE
4. `/api/crm/tasks` - GET, POST, PUT, DELETE
5. `/api/crm/portfolio` - GET, POST, PUT, DELETE

### Features:
- Contact management (clients, emails, phones, companies)
- Deal tracking (sales pipeline, stages, values)
- Task management (deliverables, due dates, priorities)
- Portfolio showcase (client results, metrics, before/after)

### Database Schema:
✅ Already exists in `database/crm_schema.sql`

### UI Components:
✅ Already exist in `app/crm/*` pages

---

## PRD #0003: Resources Library
**Status:** ✅ Created
**File:** `tasks/0003-prd-resources-library.md`
**Priority:** High
**Estimated Time:** 4-5 hours

### Missing Endpoints (5 total):
1. `/api/resources/ai-tools` - GET, POST
2. `/api/resources/components` - GET, POST
3. `/api/resources/prompts` - GET, POST, PUT, DELETE
4. `/api/resources/prompts/[id]` - GET, PUT, DELETE

### Features:
- AI Tools catalog (Claude, DeepSeek, Perplexity, Firecrawl, etc.)
- Component library (reusable UI components with code)
- Prompt library (SEO prompts, categorized, searchable)
- User-owned prompts (create, edit, delete own prompts)

### Database Schema:
✅ Already exists in `database/resources-schema.sql`

### UI Components:
✅ Already exist in `app/resources/*` pages

---

## PRD #0004: Project Management System
**Status:** ✅ Created
**File:** `tasks/0004-prd-project-management-system.md`
**Priority:** High
**Estimated Time:** 9-11 hours

### Missing Endpoints (8 total):
1. `/api/projects` - GET, POST, PUT, DELETE
2. `/api/projects/github` - GET, POST (deploy)
3. `/api/jobs` - GET, POST, PUT, DELETE, run
4. `/api/analytics` - GET, export
5. `/api/deploy` - POST, status, rollback
6. `/api/release/monitor` - GET

### Features:
- Project tracking (deliverables, timelines, status)
- GitHub integration (repos, commits, deployments)
- Job scheduling (audits, reports, rankings)
- Analytics (aggregate metrics, exports)
- Deployment management (trigger, monitor, rollback)

### Database Schema:
✅ Already exists in `database/project-hub-schema.sql` and `database/job-scheduler-schema.sql`

### UI Components:
✅ Already exist in `app/projects/*` pages

### External Integrations:
- GitHub API (requires `GITHUB_TOKEN`)
- Vercel API (requires `VERCEL_TOKEN`)

---

## PRD #0005: Autonomous SEO Agent Dashboard
**Status:** ✅ Created
**File:** `tasks/0005-prd-autonomous-seo-agent.md`
**Priority:** Critical
**Estimated Time:** 15-17 hours

### Missing Endpoints (7+ total):
1. `/api/agents/autonomous-seo?action=status` - GET, pause, resume
2. `/api/agents/autonomous-seo?action=schedules` - GET, POST, PUT, DELETE
3. `/api/agents/autonomous-seo?action=alerts` - GET, acknowledge, configure
4. `/api/agents/autonomous-seo?action=recent-audits` - GET
5. `/api/clients/[companyId]/autopilot/[action]` - status, enable, disable, run-now

### Features:
- Agent status monitoring (running/paused/error)
- Schedule management (daily/weekly/custom audits)
- Alert configuration (ranking drops, errors, opportunities)
- Recent activity (audits, content, fixes)
- Per-company autopilot (enable/disable, configure)
- Background runner (node-cron integration)

### Database Schema:
⚠️ **New schema required:**
- `agent_schedules` table
- `agent_alerts` table
- `agent_alert_config` table
- `company_autopilot` table

### UI Components:
✅ Already exist in `app/agents/*` or dashboard

### Special Requirements:
- Background service (agent runner)
- node-cron for scheduling
- Email/notification integration

---

## Implementation Priority

### Phase 1: Critical (Must Have)
1. **PRD #0002: CRM System** (5-7 hours)
   - Core business functionality
   - Already has UI and database schema
   - High user impact

2. **PRD #0005: Autonomous SEO Agent** (15-17 hours)
   - Flagship feature
   - Differentiator from competitors
   - Requires new database schema

### Phase 2: High Priority (Should Have)
3. **PRD #0003: Resources Library** (4-5 hours)
   - Improves user experience
   - Quick win (simple CRUD)

4. **PRD #0004: Project Management** (9-11 hours)
   - Professional features
   - GitHub/Vercel integration

---

## Total Effort Estimate

| PRD | Hours | Priority |
|-----|-------|----------|
| #0002 CRM | 5-7 | Critical |
| #0003 Resources | 4-5 | High |
| #0004 Projects | 9-11 | High |
| #0005 Agent | 15-17 | Critical |
| **TOTAL** | **33-40 hours** | |

---

## Recommended Approach

### Option 1: Sequential Implementation
Implement PRDs one at a time, test thoroughly, deploy incrementally.
- **Timeline:** 4-5 weeks (1 PRD per week)
- **Risk:** Low (thorough testing)
- **User Impact:** Gradual feature rollout

### Option 2: Parallel Implementation (with Tom All)
Use Tom All autonomous engine to implement multiple PRDs in parallel.
- **Timeline:** 1-2 weeks (Tom works 24/7)
- **Risk:** Medium (requires comprehensive testing after)
- **User Impact:** Major feature release

### Option 3: Hybrid Approach (Recommended)
Implement critical PRDs first (CRM, Agent), then high-priority (Resources, Projects).
- **Timeline:** 2-3 weeks
- **Risk:** Low-Medium (phased rollout)
- **User Impact:** Core features fast, nice-to-haves follow

---

## Next Steps

### Immediate Actions:
1. ✅ PRDs created and documented
2. ⏳ Review and approve PRDs
3. ⏳ Choose implementation approach
4. ⏳ Generate task lists from PRDs (use `/generate-tasks`)
5. ⏳ Begin implementation (use `/process-task-list` or Tom All)

### Commands Available:
```bash
# Generate tasks for a specific PRD
/generate-tasks tasks/0002-prd-crm-system.md

# Process tasks one by one
/process-task-list tasks/tasks-0002-prd-crm-system.md

# Or let Tom All handle everything autonomously
npm run tom:all
```

---

## Success Criteria

**All PRDs implemented when:**
- ✅ All 27 API endpoints return 200/201 (not 404)
- ✅ All user journeys working end-to-end
- ✅ Zero RLS errors (all using admin client)
- ✅ Tom Genie validation passes (zero critical issues)
- ✅ TypeScript build passes
- ✅ Production ready for deployment

---

## Additional Blind Spots (from Tom All)

Beyond the 27 missing endpoints, Tom also found:

**Blind Spot #1:** 3 API routes using `createClient()` (RLS risk)
- `/api/seo-audits/[id]`
- `/api/settings/api-keys`
- `/api/settings`
- **Fix:** Replace with `createAdminClient()`

**Blind Spot #2:** 12 components missing loading states
- **Fix:** Add `isLoading` state and loading UI

**Blind Spot #3:** 2 components missing error handling
- **Fix:** Add error state and display

**Blind Spot #4:** 4 API routes with TODO comments
- `/api/crm/audit/full`
- `/api/onboarding/process`
- `/api/sandbox/tasks`
- `/api/webhooks/github`
- **Fix:** Complete implementations or remove TODOs

---

## Resources

- **Tom Validation:** `npm run tom:genie`
- **Auto-Fix:** `npm run tom:fix`
- **Autonomous Engine:** `npm run tom:all`
- **PRD Workflow:** `/create-prd`, `/generate-tasks`, `/process-task-list`

---

**Ready to build!** 🚀
