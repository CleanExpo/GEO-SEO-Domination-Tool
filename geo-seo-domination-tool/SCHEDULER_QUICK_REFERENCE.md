# Job Scheduler Quick Reference

Quick reference for the background job scheduler system.

## Quick Start

### 1. Database Setup
```bash
# Apply the schema
psql -U postgres -d geo_seo_db -f database/job-scheduler-schema.sql
```

### 2. Environment Variables
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=geo_seo_db
DB_USER=postgres
DB_PASSWORD=your_password
CRON_SECRET=your_secure_secret
API_KEY=your_api_key
```

### 3. Start Scheduler (Node.js)
```typescript
import { getScheduler } from './src/services/scheduler/job-scheduler';

const scheduler = getScheduler();
scheduler.startAll();
```

## Job Schedules

| Job | Pattern | Schedule | Status |
|-----|---------|----------|--------|
| audit-runner | `0 2 * * *` | Daily at 2 AM | Enabled |
| ranking-tracker | `0 3 * * *` | Daily at 3 AM | Enabled |
| ranking-tracker-hourly | `0 * * * *` | Every hour | Disabled |
| report-generator | `0 8 * * 1` | Monday at 8 AM | Enabled |

## Cron Pattern Cheatsheet

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-6, Sun-Sat)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

**Common Patterns:**
- `* * * * *` - Every minute
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour
- `0 2 * * *` - Daily at 2 AM
- `0 8 * * 1` - Every Monday at 8 AM

## API Commands

### Trigger Job
```bash
curl -X POST https://your-domain.com/api/cron/trigger \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"job": "audit-runner"}'
```

### Check Status
```bash
curl -X GET "https://your-domain.com/api/jobs/status?job=audit-runner&limit=10" \
  -H "X-API-Key: YOUR_API_KEY"
```

### Update Schedule
```bash
curl -X POST https://your-domain.com/api/jobs/schedule \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jobName": "audit-runner",
    "schedule": "0 4 * * *",
    "enabled": true
  }'
```

### Enable/Disable Job
```bash
curl -X PUT https://your-domain.com/api/jobs/schedule \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jobName": "ranking-tracker-hourly", "enabled": true}'
```

## Database Queries

### View Recent Executions
```sql
SELECT job_name, start_time, status, duration_ms
FROM job_executions
ORDER BY start_time DESC
LIMIT 20;
```

### Job Statistics
```sql
SELECT * FROM get_job_statistics('audit-runner');
```

### Failed Jobs
```sql
SELECT job_name, start_time, details
FROM job_executions
WHERE status = 'failed'
ORDER BY start_time DESC;
```

### Enable Scheduled Audits for Company
```sql
UPDATE companies
SET metadata = jsonb_set(COALESCE(metadata, '{}'), '{scheduled_audits}', 'true')
WHERE id = 1;
```

### Mark Keyword as Priority
```sql
UPDATE keywords
SET metadata = jsonb_set(COALESCE(metadata, '{}'), '{is_priority}', 'true')
WHERE id = 1;
```

### Enable Weekly Reports
```sql
UPDATE companies
SET metadata = jsonb_set(COALESCE(metadata, '{}'), '{weekly_reports}', 'true')
WHERE id = 1;
```

## Code Examples

### Trigger Job Programmatically
```typescript
const scheduler = getScheduler();
const result = await scheduler.triggerJob('audit-runner');
console.log(result);
```

### Get Job Status
```typescript
const status = scheduler.getJobStatus('audit-runner');
console.log(status);
```

### Update Schedule
```typescript
scheduler.updateJobSchedule('audit-runner', '0 4 * * *');
```

### Enable/Disable Job
```typescript
scheduler.enableJob('ranking-tracker-hourly');
scheduler.disableJob('report-generator');
```

### Get Execution History
```typescript
const history = scheduler.getExecutionHistory(20);
console.log(history);
```

## Vercel Cron Setup

### 1. Create vercel.json
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

### 2. Set Environment Variables
In Vercel dashboard, add:
- `CRON_SECRET`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

### 3. Deploy
```bash
vercel deploy --prod
```

## Monitoring

### View Job Dashboard
```typescript
// Get all jobs status
const allJobs = scheduler.getJobStatus();
console.log(allJobs);
```

### Check Specific Job
```typescript
const auditStatus = scheduler.getJobStatus('audit-runner');
console.log(auditStatus);
```

### Recent Executions
```typescript
const history = scheduler.getExecutionHistory(50);
console.log(history);
```

## Troubleshooting

### Job Not Running?
1. Check if enabled: `SELECT * FROM job_schedules WHERE job_name = 'audit-runner';`
2. Verify cron pattern is valid
3. Check logs in `job_executions` table

### No Data Processed?
1. Verify companies have `scheduled_audits` enabled
2. Check keywords have data
3. Review job execution details

### Job Failing?
1. Check error in `job_executions.details`
2. Verify database connection
3. Check API credentials

## File Structure

```
src/services/scheduler/
├── job-scheduler.ts           # Main scheduler
├── types.ts                   # TypeScript types
└── jobs/
    ├── audit-runner.ts        # Audit job
    ├── ranking-tracker.ts     # Ranking job
    └── report-generator.ts    # Report job

web-app/app/api/
├── cron/trigger/route.ts      # Cron trigger endpoint
├── jobs/status/route.ts       # Status endpoint
└── jobs/schedule/route.ts     # Schedule management

database/
└── job-scheduler-schema.sql   # Database schema
```

## Support

For detailed documentation, see:
- `JOB_SCHEDULER_SETUP.md` - Complete setup guide
- `src/services/scheduler/types.ts` - Type definitions
- Database schema comments in `job-scheduler-schema.sql`

## Common Tasks

### Change Audit Time
```sql
UPDATE job_schedules
SET schedule = '0 4 * * *'  -- 4 AM
WHERE job_name = 'audit-runner';
```

### Enable Hourly Rankings
```sql
UPDATE job_schedules
SET enabled = true
WHERE job_name = 'ranking-tracker-hourly';
```

### View Last 24 Hours
```sql
SELECT * FROM job_executions
WHERE start_time > NOW() - INTERVAL '24 hours'
ORDER BY start_time DESC;
```

### Cleanup Old Data
```sql
SELECT cleanup_old_job_executions();
```
