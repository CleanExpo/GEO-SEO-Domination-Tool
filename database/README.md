# Database Infrastructure

This directory contains the database schema files and migrations for the GEO-SEO Domination Tool.

## Overview

The database infrastructure supports both **SQLite** (for local development) and **PostgreSQL** (for production), with automatic detection based on environment variables.

## Database Schemas

### Core Schemas

1. **schema.sql** - Main GEO-SEO tool schema
   - Companies, individuals, audits
   - Keywords, competitors, citations
   - Service areas, local pack tracking
   - Backlinks, content gaps
   - Scheduled audits

2. **ai-search-schema.sql** - AI Search SEO strategies
   - SEO strategies and case studies
   - AI search campaigns
   - AI visibility tracking (Perplexity, ChatGPT, etc.)
   - Perplexity optimization
   - AI content strategy

3. **project-hub-schema.sql** - Project Hub dashboard
   - Projects/tools registry
   - API keys & secrets management
   - Project configurations
   - Sandbox sessions
   - Activity logs

4. **integrations-schema.sql** - Third-party integrations
   - Integration registry
   - OAuth connections
   - Webhooks
   - Data sync jobs
   - Usage metrics

5. **project-generation-schema.sql** - Project scaffolding
   - Project templates
   - Generated projects tracking
   - Template features
   - IDE configurations

6. **crm_schema.sql** - CRM system
   - Contacts, deals, tasks
   - Calendar events
   - Projects and team members
   - GitHub projects
   - Prompts library
   - Support tickets

## Setup

### Prerequisites

Install dependencies:
```bash
cd geo-seo-domination-tool
npm install
```

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# For SQLite (local development) - Default
SQLITE_PATH=./data/geo-seo.db

# For PostgreSQL (production)
# DATABASE_URL=postgresql://user:password@host:port/database
```

### Database Detection Logic

The database client (`web-app/lib/db.ts`) automatically detects which database to use:

1. **PostgreSQL**: If `DATABASE_URL` or `POSTGRES_URL` environment variable is set
2. **SQLite**: Default for local development (no configuration needed)

## Initialization

### Initialize Database

Run all schema files to create tables:

```bash
npm run db:init
```

With verification:
```bash
npm run db:init:verify
```

This will:
- Create all tables from schema files
- Set up indexes
- Verify table creation (with --verify flag)

## Migration System

### Create a Migration

```bash
npm run db:migrate:create "add_user_preferences_table"
```

This creates a new migration file in `database/migrations/` with the format:
```
YYYYMMDD_HHMMSS_migration_name.sql
```

### Migration File Structure

```sql
-- Migration: add_user_preferences_table
-- Created: 2025-10-02T12:00:00.000Z

-- ========================================
-- UP Migration
-- ========================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  preference_key TEXT NOT NULL,
  preference_value TEXT
);

-- ========================================
-- DOWN Migration (Rollback)
-- ========================================
-- ROLLBACK:
DROP TABLE IF EXISTS user_preferences;
```

### Run Migrations

Apply all pending migrations:
```bash
npm run db:migrate
```

### Rollback Migration

Rollback the last migration:
```bash
npm run db:migrate:down
```

### Migration Status

Check migration status:
```bash
npm run db:migrate:status
```

## Database Client Usage

### In TypeScript/JavaScript Code

```typescript
import { getDatabase } from './web-app/lib/db';

// Get database instance (auto-detects type from environment)
const db = getDatabase();

// Initialize connection
await db.initialize();

// Query
const result = await db.query('SELECT * FROM companies WHERE id = ?', [1]);
console.log(result.rows);

// Query one
const company = await db.queryOne('SELECT * FROM companies WHERE id = ?', [1]);

// Execute SQL file
const sqlContent = fs.readFileSync('schema.sql', 'utf-8');
await db.executeSqlFile(sqlContent);

// Transactions
await db.beginTransaction();
try {
  await db.query('INSERT INTO companies (name) VALUES (?)', ['Test Company']);
  await db.commit();
} catch (error) {
  await db.rollback();
}

// Check table exists
const exists = await db.tableExists('companies');

// Get database type
const type = db.getType(); // 'sqlite' or 'postgres'

// Close connection
await db.close();
```

## Schema Compatibility

All schemas are written to be compatible with both SQLite and PostgreSQL:

- **Data Types**: Use `INTEGER`, `TEXT`, `REAL`, `DATE`, `DATETIME`
- **Primary Keys**: `INTEGER PRIMARY KEY AUTOINCREMENT` (SQLite) / `SERIAL PRIMARY KEY` (PostgreSQL)
- **Foreign Keys**: Standard `FOREIGN KEY` syntax
- **JSON Fields**: Stored as `TEXT` with JSON serialization
- **Booleans**: `BOOLEAN` or `INTEGER` (0/1)
- **Timestamps**: `DATETIME DEFAULT CURRENT_TIMESTAMP`

## Directory Structure

```
database/
├── README.md                       # This file
├── schema.sql                      # Main schema
├── ai-search-schema.sql           # AI search features
├── project-hub-schema.sql         # Project hub
├── integrations-schema.sql        # Integrations
├── project-generation-schema.sql  # Project scaffolding
├── crm_schema.sql                 # CRM system
└── migrations/                    # Migration files
    └── YYYYMMDD_HHMMSS_*.sql
```

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run db:init` | Initialize database with all schemas |
| `npm run db:init:verify` | Initialize and verify tables |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:migrate:down` | Rollback last migration |
| `npm run db:migrate:status` | Show migration status |
| `npm run db:migrate:create <name>` | Create new migration |

## Production Deployment

### PostgreSQL Setup

1. Set environment variable:
```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

2. Run initialization:
```bash
npm run db:init
```

3. Run migrations:
```bash
npm run db:migrate
```

### Vercel/Netlify

These platforms typically provide PostgreSQL add-ons:
- Vercel: Use Vercel Postgres
- Netlify: Use Neon or Supabase

The `DATABASE_URL` environment variable will be automatically set.

## Troubleshooting

### SQLite Issues

- **Permission denied**: Ensure the `data/` directory exists and is writable
- **Database locked**: Close all other connections to the database
- **Foreign keys not working**: The client automatically enables foreign keys

### PostgreSQL Issues

- **Connection refused**: Check DATABASE_URL format and network access
- **SSL errors**: Set `ssl: { rejectUnauthorized: false }` for development
- **Syntax errors**: Ensure schemas use compatible syntax

## Best Practices

1. **Always use migrations** for schema changes in production
2. **Test migrations** in development before production
3. **Backup database** before running migrations
4. **Use transactions** for multi-step operations
5. **Parameterize queries** to prevent SQL injection
6. **Close connections** when done

## Support

For issues or questions, refer to:
- Database client: `web-app/lib/db.ts`
- Init script: `scripts/init-database.js`
- Migration script: `scripts/migrate.js`
