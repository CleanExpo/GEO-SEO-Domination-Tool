# Job Scheduler Setup Guide

This document describes the background job scheduler system for automated SEO tasks.

## Overview

The job scheduler uses `node-cron` to run automated tasks on a schedule. It includes:

- **Audit Runner**: Runs automated SEO audits for companies
- **Ranking Tracker**: Tracks keyword rankings daily (with optional hourly tracking)
- **Report Generator**: Generates and sends weekly performance reports

## Architecture

### Core Components

1. **Main Scheduler** (`src/services/scheduler/job-scheduler.ts`)
   - Central scheduler managing all cron jobs
   - Job registration and lifecycle management
   - Execution history tracking
   - Manual job triggering

2. **Job Implementations**
   - `src/services/scheduler/jobs/audit-runner.ts` - SEO audits
   - `src/services/scheduler/jobs/ranking-tracker.ts` - Keyword rankings
   - `src/services/scheduler/jobs/report-generator.ts` - Weekly reports

3. **API Endpoints** (Next.js)
   - `/api/cron/trigger` - Trigger jobs manually (Vercel Cron compatible)
   - `/api/jobs/status` - Check job execution status
   - `/api/jobs/schedule` - Manage job schedules

4. **Database Schema** (`database/job-scheduler-schema.sql`)
   - `job_executions` - Tracks all job runs
   - `job_schedules` - Custom job schedules
   - `rankings` - Keyword ranking history
   - `reports` - Generated reports
   - `job_alerts` - Job failure alerts

## Cron Patterns

### Default Schedules

| Job | Cron Pattern | Schedule | Description |
|-----|-------------|----------|-------------|
| `audit-runner` | `0 2 * * *` | Daily at 2:00 AM | Run SEO audits |
| `ranking-tracker` | `0 3 * * *` | Daily at 3:00 AM | Track all rankings |
| `ranking-tracker-hourly` | `0 * * * *` | Every hour | Track priority keywords |
| `report-generator` | `0 8 * * 1` | Monday at 8:00 AM | Generate weekly reports |

### Common Cron Patterns

```
* * * * *       - Every minute
*/5 * * * *     - Every 5 minutes
*/15 * * * *    - Every 15 minutes
*/30 * * * *    - Every 30 minutes
0 * * * *       - Every hour
0 */2 * * *     - Every 2 hours
0 0 * * *       - Daily at midnight
0 2 * * *       - Daily at 2:00 AM
0 12 * * *      - Daily at noon
0 0 * * 0       - Every Sunday at midnight
0 8 * * 1       - Every Monday at 8:00 AM
0 0 1 * *       - First day of month at midnight
```

### Cron Pattern Format

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
* * * * *
```

## Setup Instructions

### 1. Database Setup

Run the database migration to create required tables:

```bash
# Apply the job scheduler schema
psql -U postgres -d geo_seo_db -f database/job-scheduler-schema.sql
```

Or using the migration script:

```bash
npm run db:migrate
```

### 2. Environment Variables

Add to your `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=geo_seo_db
DB_USER=postgres
DB_PASSWORD=your_password

# Job Scheduler Security
CRON_SECRET=your_secure_cron_secret_here
API_KEY=your_api_key_here

# Timezone (optional)
TZ=America/New_York
```

### 3. Node.js Application

To use the scheduler in your Node.js application:

```typescript
import { getScheduler } from './src/services/scheduler/job-scheduler';

// Get scheduler instance
const scheduler = getScheduler();

// Start all enabled jobs
scheduler.startAll();

// Trigger a specific job manually
await scheduler.triggerJob('audit-runner');

// Get job status
const status = scheduler.getJobStatus('audit-runner');
console.log(status);

// Update job schedule
scheduler.updateJobSchedule('audit-runner', '0 4 * * *'); // Change to 4 AM

// Enable/disable jobs
scheduler.enableJob('ranking-tracker-hourly');
scheduler.disableJob('report-generator');
```

### 4. Vercel Deployment

For Vercel deployments, use Vercel Cron:

1. Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/trigger",
      "schedule": "0 2 * * *"
    }
  ]
}
```

2. Set environment variables in Vercel:
   - `CRON_SECRET` - Secret for authenticating cron requests
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

## API Usage

### 1. Trigger Jobs

**Endpoint**: `POST /api/cron/trigger`

**Headers**:
```
Authorization: Bearer YOUR_CRON_SECRET
Content-Type: application/json
```

**Body**:
```json
{
  "job": "audit-runner"
}
```

Options for `job`:
- `"audit"` - Run audit job
- `"ranking"` - Run ranking tracker
- `"report"` - Run report generator
- `"all"` - Run all jobs sequentially

**Response**:
```json
{
  "success": true,
  "message": "Job(s) executed successfully",
  "timestamp": "2025-10-02T10:30:00.000Z",
  "result": {
    "success": true,
    "companiesProcessed": 15,
    "duration": 45000
  }
}
```

### 2. Check Job Status

**Endpoint**: `GET /api/jobs/status?job=audit-runner&limit=20`

**Headers**:
```
X-API-Key: YOUR_API_KEY
```

**Response**:
```json
{
  "success": true,
  "data": {
    "executions": [
      {
        "job_name": "audit-runner",
        "start_time": "2025-10-02T02:00:00.000Z",
        "end_time": "2025-10-02T02:05:30.000Z",
        "duration_ms": 330000,
        "status": "success",
        "details": {
          "companiesProcessed": 25,
          "successful": 23,
          "failed": 2
        }
      }
    ],
    "summary": [
      {
        "job_name": "audit-runner",
        "total_executions": 30,
        "successful": 28,
        "failed": 2,
        "avg_duration_ms": 325000,
        "last_execution": "2025-10-02T02:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 30,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### 3. Manage Job Schedules

**Get Schedules**: `GET /api/jobs/schedule?job=audit-runner`

**Headers**:
```
X-API-Key: YOUR_API_KEY
```

**Response**:
```json
{
  "success": true,
  "data": {
    "schedules": [
      {
        "job_name": "audit-runner",
        "schedule": "0 2 * * *",
        "enabled": true,
        "description": "Run automated SEO audits",
        "cronDescription": "Daily at 2:00 AM"
      }
    ]
  }
}
```

**Update Schedule**: `POST /api/jobs/schedule`

**Body**:
```json
{
  "jobName": "audit-runner",
  "schedule": "0 4 * * *",
  "enabled": true,
  "description": "Run audits at 4 AM"
}
```

**Modify Specific Fields**: `PUT /api/jobs/schedule`

**Body**:
```json
{
  "jobName": "ranking-tracker-hourly",
  "enabled": true
}
```

## Job Configuration

### Enable/Disable Jobs

Jobs can be enabled or disabled through:

1. **API**:
```bash
curl -X PUT https://your-domain.com/api/jobs/schedule \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jobName": "ranking-tracker-hourly", "enabled": true}'
```

2. **Database**:
```sql
UPDATE job_schedules
SET enabled = true
WHERE job_name = 'ranking-tracker-hourly';
```

3. **Code**:
```typescript
scheduler.enableJob('ranking-tracker-hourly');
```

### Company Settings

Enable scheduled features for specific companies:

```sql
-- Enable scheduled audits for a company
UPDATE companies
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{scheduled_audits}',
  'true'
)
WHERE id = 1;

-- Enable weekly reports
UPDATE companies
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{weekly_reports}',
  'true'
)
WHERE id = 1;
```

### Keyword Priority Settings

Mark keywords as high-priority for hourly tracking:

```sql
UPDATE keywords
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{is_priority}',
  'true'
)
WHERE id IN (1, 2, 3);
```

## Job Details

### 1. Audit Runner

**Purpose**: Runs automated SEO audits for companies with `scheduled_audits` enabled.

**What it does**:
- Fetches companies with scheduled audits enabled
- Runs Lighthouse audits (performance, accessibility, SEO)
- Analyzes E-E-A-T signals
- Generates recommendations
- Saves results to `audits` table
- Logs execution to `job_executions`

**Configuration**:
- Processes up to 50 companies per run
- 2-second delay between audits
- Priority levels: critical, high, medium, low

### 2. Ranking Tracker

**Purpose**: Tracks keyword rankings for SEO monitoring.

**What it does**:
- Fetches keywords to track (all or priority only)
- Checks current rankings
- Calculates rank changes
- Identifies significant changes (±5 positions)
- Creates alerts for major changes (±10 positions)
- Saves to `rankings` table

**Modes**:
- **Daily** (`ranking-tracker`): Tracks all keywords
- **Hourly** (`ranking-tracker-hourly`): Tracks priority keywords only

**Configuration**:
- Processes up to 100 keywords per run
- 1.5-second delay between checks
- Alert threshold: 10 position change

### 3. Report Generator

**Purpose**: Generates weekly performance reports.

**What it does**:
- Calculates metrics for the previous week
- Aggregates audit results
- Summarizes ranking changes
- Generates recommendations
- Saves to `reports` table
- Optionally sends email reports

**Schedule**: Every Monday at 8:00 AM

**Configuration**:
- Processes up to 50 companies per run
- Date range: Monday to Sunday of previous week

## Monitoring

### View Execution History

```sql
-- Recent executions
SELECT job_name, start_time, end_time, status, details
FROM job_executions
ORDER BY start_time DESC
LIMIT 20;

-- Job statistics
SELECT * FROM get_job_statistics('audit-runner', NOW() - INTERVAL '30 days', NOW());

-- Failed jobs
SELECT job_name, start_time, details
FROM job_executions
WHERE status = 'failed'
ORDER BY start_time DESC;
```

### Cleanup Old Data

```sql
-- Clean up old executions (keeps last 1000)
SELECT cleanup_old_job_executions();

-- Or manually
DELETE FROM job_executions
WHERE start_time < NOW() - INTERVAL '90 days';
```

## Troubleshooting

### Job Not Running

1. Check if job is enabled:
```sql
SELECT * FROM job_schedules WHERE job_name = 'audit-runner';
```

2. Check recent executions:
```sql
SELECT * FROM job_executions
WHERE job_name = 'audit-runner'
ORDER BY start_time DESC
LIMIT 5;
```

3. Verify cron pattern:
```typescript
import cron from 'node-cron';
console.log(cron.validate('0 2 * * *')); // Should be true
```

### Job Failures

Check the error details:
```sql
SELECT job_name, start_time, details, error_message
FROM job_executions
WHERE status = 'failed'
ORDER BY start_time DESC;
```

### No Companies/Keywords Processed

Verify database configuration:
```sql
-- Check companies with scheduled audits
SELECT id, name, metadata->>'scheduled_audits'
FROM companies
WHERE (metadata->>'scheduled_audits')::boolean = true;

-- Check priority keywords
SELECT id, keyword, metadata->>'is_priority'
FROM keywords
WHERE (metadata->>'is_priority')::boolean = true;
```

## Security

1. **Cron Secret**: Use a strong secret for `CRON_SECRET`
2. **API Key**: Use a strong key for `API_KEY`
3. **Database**: Use strong passwords and restrict access
4. **Rate Limiting**: Consider adding rate limiting to API endpoints
5. **HTTPS**: Always use HTTPS in production

## Performance Optimization

1. **Batch Processing**: Jobs process items in batches to avoid memory issues
2. **Rate Limiting**: Built-in delays prevent API rate limiting
3. **Database Indexing**: Indexes on frequently queried columns
4. **Connection Pooling**: PostgreSQL connection pool for efficiency
5. **Cleanup**: Automatic cleanup of old execution records

## Next Steps

1. Implement actual API integrations (Lighthouse, SEMrush, etc.)
2. Add email notification service
3. Create dashboard for monitoring jobs
4. Add Slack/Discord webhooks for alerts
5. Implement job retry logic
6. Add job dependencies (run B after A completes)
7. Create admin UI for job management

## Resources

- [node-cron documentation](https://www.npmjs.com/package/node-cron)
- [Cron expression generator](https://crontab.guru/)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
