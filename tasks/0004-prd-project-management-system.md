# PRD #0004: Project Management System (Projects, GitHub, Jobs, Analytics)

**Date:** 2025-01-11
**Status:** Draft
**Priority:** High
**Identified By:** Tom All Autonomous Engine

## Problem Statement

Tom All identified **8 critical missing API endpoints** for Project Management:
- `/api/projects` (2 instances)
- `/api/projects/github`
- `/api/jobs` (2 instances)
- `/api/analytics`
- `/api/deploy`
- `/api/release/monitor`

UI components are calling these endpoints but they don't exist, causing **broken Project Management features**.

## Background

The GEO-SEO Domination Tool needs project management capabilities to:
- Track client projects and deliverables
- Integrate with GitHub for code deployments
- Schedule and monitor background jobs
- View analytics and performance metrics
- Manage deployments and releases

**Database Schema:** Already exists in `database/project-hub-schema.sql` and `database/job-scheduler-schema.sql`

**UI Components:** Already built in `app/projects/*` pages

**Missing:** API routes to connect UI to database

## Goals

### Primary Goals
1. Create fully functional Project Management API endpoints
2. Enable project CRUD operations
3. Enable GitHub repository integration
4. Enable job scheduling and monitoring
5. Enable analytics dashboards
6. Enable deployment management

### Success Metrics
- All Project API endpoints return 200/201 (not 404)
- GitHub integration working (view repos, trigger deployments)
- Background jobs running and monitored
- Analytics data displaying correctly
- No RLS errors (use admin client)

## User Stories

### Project Management
- **As a user**, I want to view all projects so I can see what I'm working on
- **As a user**, I want to create new projects with deliverables and timelines
- **As a user**, I want to link projects to CRM contacts
- **As a user**, I want to track project status (planning, in progress, completed)
- **As a user**, I want to see project notes and attachments

### GitHub Integration
- **As a user**, I want to view my GitHub repositories
- **As a user**, I want to see recent commits and branches
- **As a user**, I want to trigger deployments from the dashboard
- **As a user**, I want to see deployment status and logs

### Job Scheduling
- **As a user**, I want to view all scheduled jobs (audits, reports, rankings)
- **As a user**, I want to create new scheduled jobs
- **As a user**, I want to pause/resume jobs
- **As a user**, I want to see job execution history and logs
- **As a user**, I want to receive notifications when jobs fail

### Analytics
- **As a user**, I want to see aggregate metrics across all clients
- **As a user**, I want to track SEO performance over time
- **As a user**, I want to export analytics reports
- **As a user**, I want to filter analytics by date range

### Deployments
- **As a user**, I want to deploy changes to production
- **As a user**, I want to see deployment history
- **As a user**, I want to roll back failed deployments
- **As a user**, I want to monitor release health

## Technical Specification

### API Endpoints Required

#### 1. Projects API (`/api/projects`)

**GET /api/projects**
- Returns: List of all projects
- Query params: `?status=`, `?contact_id=`, `?limit=`
- Response: `{ projects: Project[], total: number }`

**POST /api/projects**
- Creates: New project
- Body: `{ name, description, status, contact_id, start_date, end_date, deliverables }`
- Response: `{ project: Project }`

**GET /api/projects/[id]**
- Returns: Single project by ID
- Response: `{ project: Project }`

**PUT /api/projects/[id]**
- Updates: Project details
- Body: Partial project object
- Response: `{ project: Project }`

**DELETE /api/projects/[id]**
- Deletes: Project
- Response: `{ success: boolean }`

#### 2. GitHub Integration API (`/api/projects/github`)

**GET /api/projects/github**
- Returns: List of user's GitHub repositories
- Query params: `?org=`, `?limit=`
- Response: `{ repos: Repository[], total: number }`
- **Requires:** GitHub OAuth token or PAT

**GET /api/projects/github/[repo]**
- Returns: Repository details (commits, branches, deployments)
- Response: `{ repo: Repository, commits: Commit[], branches: Branch[] }`

**POST /api/projects/github/deploy**
- Triggers: Deployment via GitHub Actions
- Body: `{ repo, branch, environment }`
- Response: `{ deployment: Deployment }`

#### 3. Jobs API (`/api/jobs`)

**GET /api/jobs**
- Returns: List of scheduled jobs
- Query params: `?type=`, `?status=`, `?limit=`
- Response: `{ jobs: Job[], total: number }`

**POST /api/jobs**
- Creates: New scheduled job
- Body: `{ type, schedule, config, enabled }`
- Response: `{ job: Job }`

**GET /api/jobs/[id]**
- Returns: Job details with execution history
- Response: `{ job: Job, executions: Execution[] }`

**PUT /api/jobs/[id]**
- Updates: Job (enable/disable, change schedule)
- Body: Partial job object
- Response: `{ job: Job }`

**DELETE /api/jobs/[id]**
- Deletes: Scheduled job
- Response: `{ success: boolean }`

**POST /api/jobs/[id]/run**
- Triggers: Immediate job execution (bypass schedule)
- Response: `{ execution: Execution }`

#### 4. Analytics API (`/api/analytics`)

**GET /api/analytics**
- Returns: Aggregate analytics across all clients
- Query params: `?start_date=`, `?end_date=`, `?metric=`
- Response: `{ metrics: Metric[], summary: Summary }`

**GET /api/analytics/companies/[id]**
- Returns: Analytics for specific company
- Response: `{ company: Company, metrics: Metric[] }`

**GET /api/analytics/export**
- Exports: Analytics data as CSV/JSON
- Query params: `?format=csv|json`, `?start_date=`, `?end_date=`
- Response: File download

#### 5. Deploy API (`/api/deploy`)

**POST /api/deploy**
- Triggers: Production deployment
- Body: `{ branch, environment, skip_tests }`
- Response: `{ deployment: Deployment }`

**GET /api/deploy/status**
- Returns: Current deployment status
- Response: `{ status: string, progress: number, logs: string[] }`

**POST /api/deploy/rollback**
- Rolls back: To previous deployment
- Body: `{ deployment_id }`
- Response: `{ success: boolean }`

#### 6. Release Monitor API (`/api/release/monitor`)

**GET /api/release/monitor**
- Returns: Release health metrics
- Query params: `?environment=`, `?limit=`
- Response: `{ releases: Release[], health: HealthMetrics }`

**GET /api/release/monitor/[id]**
- Returns: Specific release details
- Response: `{ release: Release, errors: Error[], performance: Metrics }`

### Database Schema

**From `database/project-hub-schema.sql`:**

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50), -- 'planning', 'in_progress', 'completed', 'on_hold'
  contact_id UUID, -- Link to CRM
  start_date DATE,
  end_date DATE,
  deliverables JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**From `database/job-scheduler-schema.sql`:**

```sql
CREATE TABLE scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(100) NOT NULL, -- 'audit', 'ranking', 'report'
  schedule VARCHAR(100), -- Cron expression
  config JSONB,
  enabled BOOLEAN DEFAULT TRUE,
  last_run TIMESTAMP,
  next_run TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE job_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES scheduled_jobs(id),
  status VARCHAR(50), -- 'running', 'completed', 'failed'
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  logs TEXT,
  error TEXT
);
```

### TypeScript Types

```typescript
// types/projects.ts
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  contact_id?: string;
  start_date?: string;
  end_date?: string;
  deliverables?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  type: 'audit' | 'ranking' | 'report';
  schedule: string; // Cron expression
  config?: any;
  enabled: boolean;
  last_run?: string;
  next_run?: string;
  created_at: string;
}

export interface JobExecution {
  id: string;
  job_id: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  logs?: string;
  error?: string;
}

export interface Repository {
  id: string;
  name: string;
  full_name: string;
  html_url: string;
  default_branch: string;
  updated_at: string;
}

export interface Deployment {
  id: string;
  repo: string;
  branch: string;
  environment: string;
  status: string;
  created_at: string;
}
```

### External Integrations

**GitHub API:**
- Requires: `GITHUB_TOKEN` environment variable
- Endpoints: List repos, get commits, trigger deployments
- Rate limiting: Respect GitHub API limits

**Vercel API (for deployments):**
- Requires: `VERCEL_TOKEN` environment variable
- Endpoints: Create deployment, get status, rollback
- Webhook: Receive deployment status updates

### Error Handling

All endpoints must:
- Use `createAdminClient()` (avoid RLS issues)
- Validate input with Zod schemas
- Handle GitHub API errors gracefully
- Retry failed job executions
- Log errors with context

## User Journeys

### Journey 1: Create and Track Project
1. User navigates to `/projects`
2. Clicks "New Project"
3. Fills form (name, description, status, contact, dates, deliverables)
4. Submits → `POST /api/projects`
5. Project appears in list
6. User updates status to "in progress" → `PUT /api/projects/[id]`
7. Status updates display

### Journey 2: GitHub Integration
1. User navigates to `/projects/github`
2. Page loads repositories → `GET /api/projects/github`
3. User clicks repo to see details
4. Views commits, branches → `GET /api/projects/github/[repo]`
5. Clicks "Deploy to Production"
6. Confirms → `POST /api/projects/github/deploy`
7. Deployment starts, user sees status

### Journey 3: Schedule Recurring Job
1. User navigates to `/jobs` (or settings)
2. Clicks "Schedule Job"
3. Selects type (e.g., "Weekly Audit")
4. Sets schedule (cron: `0 9 * * 1`)
5. Configures (select companies, notification emails)
6. Submits → `POST /api/jobs`
7. Job appears in list with next run time
8. Job executes automatically per schedule

### Journey 4: View Analytics
1. User navigates to `/analytics`
2. Page loads → `GET /api/analytics`
3. User sees aggregate metrics (total audits, avg scores, etc.)
4. Filters by date range
5. Results update → `GET /api/analytics?start_date=...&end_date=...`
6. User exports data → `GET /api/analytics/export?format=csv`
7. CSV downloads

## Acceptance Criteria

- [ ] All 6 API route files created
- [ ] All endpoints return proper status codes (not 404)
- [ ] All endpoints use `createAdminClient()` (no RLS errors)
- [ ] GitHub integration working (requires valid token)
- [ ] Job scheduling working (cron integration)
- [ ] Analytics aggregations correct
- [ ] Deployment triggers working (Vercel integration)
- [ ] All user journeys working end-to-end
- [ ] Tom Genie validation passes (zero critical issues)

## Out of Scope

- Multi-repo monorepo support (future)
- Advanced CI/CD pipelines (future)
- Detailed resource usage tracking (future)
- Custom analytics dashboards (future)

## Dependencies

- Database schemas exist
- UI components exist
- GitHub OAuth/token required
- Vercel API token required
- node-cron for job scheduling

## Risks & Mitigations

**Risk:** GitHub API rate limits
**Mitigation:** Cache repository data, respect rate limits

**Risk:** Job executions overlapping
**Mitigation:** Lock mechanism, queue system

**Risk:** Failed deployments breaking production
**Mitigation:** Health checks, automatic rollback

## Timeline

- **Implementation:** 6-8 hours
- **Testing:** 2 hours
- **Integration testing:** 1 hour

**Total:** 9-11 hours

## Success Criteria

1. ✅ All Project Management endpoints functional
2. ✅ GitHub integration working
3. ✅ Jobs running on schedule
4. ✅ Analytics displaying correctly
5. ✅ Deployments working end-to-end
6. ✅ Tom Genie validation passes
