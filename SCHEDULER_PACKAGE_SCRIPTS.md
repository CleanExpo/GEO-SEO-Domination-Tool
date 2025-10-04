# Scheduler Package Scripts

Add these scripts to your `package.json` for easy scheduler management.

## Suggested Scripts

Add to the `scripts` section of `package.json`:

```json
{
  "scripts": {
    // ... existing scripts ...

    // Database - Job Scheduler
    "db:scheduler:init": "psql -U $DB_USER -d $DB_NAME -f database/job-scheduler-schema.sql",
    "db:scheduler:status": "psql -U $DB_USER -d $DB_NAME -c 'SELECT * FROM get_job_statistics()'",
    "db:scheduler:cleanup": "psql -U $DB_USER -d $DB_NAME -c 'SELECT cleanup_old_job_executions()'",

    // Scheduler Management (requires implementation)
    "scheduler:start": "node -e \"require('./dist/services/scheduler').getScheduler().startAll()\"",
    "scheduler:status": "curl -s localhost:3000/api/jobs/status -H 'X-API-Key: $API_KEY' | json_pp",
    "scheduler:trigger": "curl -X POST localhost:3000/api/cron/trigger -H 'Authorization: Bearer $CRON_SECRET' -H 'Content-Type: application/json' -d '{\"job\":\"audit-runner\"}'",

    // Development helpers
    "dev:scheduler": "npm run db:scheduler:init && npm run dev"
  }
}
```

## Usage Examples

### Initialize Scheduler Database
```bash
npm run db:scheduler:init
```

### Check Job Statistics
```bash
npm run db:scheduler:status
```

### Clean Up Old Executions
```bash
npm run db:scheduler:cleanup
```

### View Job Status (requires API running)
```bash
npm run scheduler:status
```

### Trigger Job Manually (requires API running)
```bash
npm run scheduler:trigger
```

## Environment Variables for Scripts

Create a `.env` file or export these variables:

```bash
export DB_USER=postgres
export DB_NAME=geo_seo_db
export API_KEY=your_api_key
export CRON_SECRET=your_cron_secret
```

## Windows PowerShell Versions

If using Windows PowerShell, use these instead:

```json
{
  "scripts": {
    "db:scheduler:init": "psql -U %DB_USER% -d %DB_NAME% -f database/job-scheduler-schema.sql",
    "scheduler:status": "curl -s http://localhost:3000/api/jobs/status -H \"X-API-Key: %API_KEY%\"",
    "scheduler:trigger": "curl -X POST http://localhost:3000/api/cron/trigger -H \"Authorization: Bearer %CRON_SECRET%\" -H \"Content-Type: application/json\" -d \"{\\\"job\\\":\\\"audit-runner\\\"}\""
  }
}
```

## Cross-Platform Alternative

For better cross-platform support, create Node.js scripts:

### scripts/scheduler-init.js
```javascript
const { execSync } = require('child_process');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'database', 'job-scheduler-schema.sql');
const command = `psql -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -f ${schemaPath}`;

try {
  execSync(command, { stdio: 'inherit' });
  console.log('Scheduler database initialized successfully');
} catch (error) {
  console.error('Failed to initialize scheduler database:', error.message);
  process.exit(1);
}
```

### scripts/scheduler-trigger.js
```javascript
const https = require('https');

const options = {
  hostname: process.env.API_HOST || 'localhost',
  port: process.env.API_PORT || 3000,
  path: '/api/cron/trigger',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.CRON_SECRET}`,
    'Content-Type': 'application/json',
  },
};

const jobName = process.argv[2] || 'all';
const data = JSON.stringify({ job: jobName });

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Response:', JSON.parse(body));
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(data);
req.end();
```

Then use:
```json
{
  "scripts": {
    "scheduler:init": "node scripts/scheduler-init.js",
    "scheduler:trigger": "node scripts/scheduler-trigger.js",
    "scheduler:trigger:audit": "node scripts/scheduler-trigger.js audit",
    "scheduler:trigger:ranking": "node scripts/scheduler-trigger.js ranking",
    "scheduler:trigger:report": "node scripts/scheduler-trigger.js report"
  }
}
```

## Docker Compose Integration

If using Docker, add to your `docker-compose.yml`:

```yaml
services:
  scheduler:
    build: .
    command: node dist/services/scheduler/index.js
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=geo_seo_db
      - DB_USER=postgres
      - DB_PASSWORD=${DB_PASSWORD}
      - TZ=America/New_York
    depends_on:
      - postgres
    restart: unless-stopped
```

And add script:
```json
{
  "scripts": {
    "docker:scheduler": "docker-compose up scheduler"
  }
}
```

## GitHub Actions Workflow

Create `.github/workflows/scheduler-test.yml`:

```yaml
name: Test Scheduler

on:
  push:
    paths:
      - 'src/services/scheduler/**'
      - 'database/job-scheduler-schema.sql'

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: geo_seo_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Initialize scheduler database
        run: npm run db:scheduler:init
        env:
          DB_USER: postgres
          DB_NAME: geo_seo_db

      - name: Run scheduler tests
        run: npm test -- scheduler
```

## Makefile Alternative

Create a `Makefile`:

```makefile
.PHONY: scheduler-init scheduler-status scheduler-trigger scheduler-cleanup

scheduler-init:
	psql -U $(DB_USER) -d $(DB_NAME) -f database/job-scheduler-schema.sql

scheduler-status:
	psql -U $(DB_USER) -d $(DB_NAME) -c "SELECT * FROM get_job_statistics()"

scheduler-cleanup:
	psql -U $(DB_USER) -d $(DB_NAME) -c "SELECT cleanup_old_job_executions()"

scheduler-trigger:
	curl -X POST http://localhost:3000/api/cron/trigger \
		-H "Authorization: Bearer $(CRON_SECRET)" \
		-H "Content-Type: application/json" \
		-d '{"job":"$(JOB)"}'
```

Usage:
```bash
make scheduler-init
make scheduler-status
make scheduler-trigger JOB=audit-runner
```

## Recommended Addition to package.json

Minimal, cross-platform compatible scripts:

```json
{
  "scripts": {
    "db:scheduler": "node scripts/init-scheduler-db.js",
    "scheduler:dev": "node -r dotenv/config src/services/scheduler/index.ts",
    "scheduler:test": "node scripts/test-scheduler.js"
  }
}
```

Create `scripts/init-scheduler-db.js`:
```javascript
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'geo_seo_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function initScheduler() {
  try {
    const schemaPath = path.join(__dirname, '..', 'database', 'job-scheduler-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schema);
    console.log('✓ Scheduler database initialized successfully');

    const result = await pool.query('SELECT * FROM job_schedules');
    console.log(`✓ Found ${result.rows.length} job schedules`);

    await pool.end();
  } catch (error) {
    console.error('✗ Failed to initialize scheduler database:', error.message);
    process.exit(1);
  }
}

initScheduler();
```
