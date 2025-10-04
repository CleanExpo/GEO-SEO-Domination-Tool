# Database Quick Start Guide

## TL;DR

```bash
# 1. Install dependencies
npm install

# 2. Initialize database (creates all tables)
npm run db:init

# 3. Verify everything works
npm run db:init:verify

# Done! Database is ready to use.
```

## Environment Setup

### Local Development (Default)
No configuration needed! Uses SQLite by default.

### Production (PostgreSQL)
Add to `.env`:
```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

## Common Commands

| Command | What it does |
|---------|--------------|
| `npm run db:init` | Create all tables from schema files |
| `npm run db:init:verify` | Create tables + verify they exist |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:migrate:down` | Rollback last migration |
| `npm run db:migrate:status` | Show migration status |
| `npm run db:migrate:create "name"` | Create new migration |

## Using in Code

### TypeScript/ESM
```typescript
import { getDatabase } from './web-app/lib/db';

const db = getDatabase();
await db.initialize();

// Query
const companies = await db.query('SELECT * FROM companies');
console.log(companies.rows);

// Query one
const company = await db.queryOne('SELECT * FROM companies WHERE id = ?', [1]);

// Insert
await db.query('INSERT INTO companies (name, address) VALUES (?, ?)', ['Acme', '123 Main St']);

// Transaction
await db.beginTransaction();
try {
  await db.query('INSERT INTO companies ...');
  await db.commit();
} catch (error) {
  await db.rollback();
}

// Close
await db.close();
```

### JavaScript/CommonJS
```javascript
const { getDatabase } = require('./web-app/lib/db');

const db = getDatabase();
await db.initialize();

// Same API as TypeScript version
```

## Database Detection

The system automatically uses:
- **PostgreSQL** if `DATABASE_URL` or `POSTGRES_URL` is set
- **SQLite** otherwise (default for local dev)

Check which database is active:
```javascript
const type = db.getType(); // 'sqlite' or 'postgres'
```

## Migrations

### Create Migration
```bash
npm run db:migrate:create "add_user_roles"
```

Creates: `database/migrations/YYYYMMDD_HHMMSS_add_user_roles.sql`

### Migration Template
```sql
-- Migration: add_user_roles

-- ========================================
-- UP Migration
-- ========================================

CREATE TABLE IF NOT EXISTS user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

-- ========================================
-- DOWN Migration (Rollback)
-- ========================================
-- ROLLBACK:
DROP TABLE IF EXISTS user_roles;
```

### Run Migration
```bash
npm run db:migrate
```

### Rollback
```bash
npm run db:migrate:down
```

## Troubleshooting

### "better-sqlite3" not found
```bash
npm install better-sqlite3
```

### "pg" not found (for PostgreSQL)
```bash
npm install pg
```

### Permission denied (SQLite)
The script will create the `data/` directory automatically. If you still have issues:
```bash
mkdir -p data
chmod 755 data
```

### Database locked (SQLite)
Close all other connections to the database:
```javascript
await db.close();
```

### PostgreSQL connection refused
Check your `DATABASE_URL`:
```bash
# Format:
DATABASE_URL=postgresql://username:password@host:port/database

# Example:
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/geoseo
```

## Schema Files

Located in `database/`:
- `schema.sql` - Main SEO tool schema (companies, audits, etc.)
- `ai-search-schema.sql` - AI search features
- `project-hub-schema.sql` - Project hub dashboard
- `integrations-schema.sql` - Third-party integrations
- `project-generation-schema.sql` - Project scaffolding
- `crm_schema.sql` - CRM system

All schemas are compatible with both SQLite and PostgreSQL.

## Key Features

✓ Auto-detects database type from environment
✓ Works with SQLite (dev) and PostgreSQL (prod)
✓ Transaction support
✓ Migration system with rollbacks
✓ Table verification
✓ Connection pooling (PostgreSQL)
✓ Foreign key support
✓ Parameterized queries (SQL injection safe)

## File Locations

- Database client: `web-app/lib/db.ts` (TypeScript) and `web-app/lib/db.js` (JavaScript)
- Init script: `scripts/init-database.js`
- Migration script: `scripts/migrate.js`
- Schema files: `database/*.sql`
- Migrations: `database/migrations/*.sql`
- Documentation: `database/README.md`

## Production Deployment

1. Set environment variable:
   ```bash
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

2. Initialize database:
   ```bash
   npm run db:init
   ```

3. Run migrations:
   ```bash
   npm run db:migrate
   ```

## Next Steps

1. Read full documentation: `database/README.md`
2. Read setup summary: `DATABASE_SETUP_SUMMARY.md`
3. Check example usage in TypeScript/JavaScript above
4. Create your first migration if needed

---

Need more help? Check:
- Full documentation: `database/README.md`
- Detailed summary: `DATABASE_SETUP_SUMMARY.md`
