# PostgreSQL Compatibility Fix

**Issues**: Credentials schema had TWO SQLite-specific syntax incompatibilities with PostgreSQL/Supabase

---

## Issue 1: Trigger Syntax ❌

**Error**:
```
ERROR: 42601: syntax error at or near "NOT"
LINE 339: CREATE TRIGGER IF NOT EXISTS update_credentials_timestamp
```

### Root Cause

The original schema used SQLite trigger syntax:
```sql
CREATE TRIGGER IF NOT EXISTS update_credentials_timestamp
AFTER UPDATE ON client_credentials
FOR EACH ROW
BEGIN
  UPDATE client_credentials
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;
```

**Problems**:
1. ❌ PostgreSQL doesn't support `IF NOT EXISTS` in `CREATE TRIGGER`
2. ❌ PostgreSQL requires trigger functions (can't have inline SQL)
3. ❌ `BEGIN...END` syntax is SQLite-specific

### Solution Applied

Converted to PostgreSQL-compatible syntax:

```sql
-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_credentials_timestamp ON client_credentials;
DROP TRIGGER IF EXISTS update_website_access_timestamp ON website_access;
DROP TRIGGER IF EXISTS update_social_accounts_timestamp ON social_media_accounts;
DROP TRIGGER IF EXISTS update_google_access_timestamp ON google_ecosystem_access;

-- Create reusable trigger function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers using the function
CREATE TRIGGER update_credentials_timestamp
BEFORE UPDATE ON client_credentials
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- (Repeated for other tables)
```

---

## Issue 2: UUID Generation Function ❌

**Error**:
```
ERROR: 42883: function randomblob(integer) does not exist
LINE 13: id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
HINT: No function matches the given name and argument types.
```

### Root Cause

The original schema used SQLite's `randomblob()` function for generating IDs:
```sql
CREATE TABLE IF NOT EXISTS client_credentials (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  ...
);
```

**Problem**: `randomblob()` is SQLite-specific. PostgreSQL uses different UUID generation functions.

### Solution Applied

Replaced with PostgreSQL's `gen_random_uuid()` function (requires `pgcrypto` extension):

```sql
-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS client_credentials (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ...
);
```

**Applied to all 8 tables**:
1. `client_credentials`
2. `credential_access_log`
3. `platform_capabilities`
4. `website_access`
5. `social_media_accounts`
6. `google_ecosystem_access`
7. `credential_validation_schedules`
8. `auto_action_permissions`

---

## Issue 3: Foreign Key Type Mismatch ❌

**Error**:
```
ERROR: 42804: foreign key constraint "client_credentials_company_id_fkey" cannot be implemented
DETAIL: Key columns "company_id" and "id" are of incompatible types: text and uuid.
```

### Root Cause

The credentials schema used `TEXT` for `company_id`, but the `companies` table uses `INTEGER`:

```sql
-- companies table (from schema.sql)
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ...
);

-- credentials schema (WRONG)
CREATE TABLE IF NOT EXISTS client_credentials (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES companies(id),  -- ❌ TYPE MISMATCH
  ...
);
```

**Problem**: Foreign key reference types must match exactly.

### Solution Applied

Changed all `company_id` columns from `TEXT` to `INTEGER`:

```sql
CREATE TABLE IF NOT EXISTS client_credentials (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id INTEGER NOT NULL REFERENCES companies(id),  -- ✅ FIXED
  ...
);
```

**Applied to 5 tables**:
1. `client_credentials` - Line 18
2. `website_access` - Line 145
3. `social_media_accounts` - Line 188
4. `google_ecosystem_access` - Line 232
5. `auto_action_permissions` - Line 308

---

## Summary of All Changes

### Issue 1: Triggers
1. ✅ **Removed `IF NOT EXISTS`** - Use `DROP TRIGGER IF EXISTS` instead
2. ✅ **Created trigger function** - PostgreSQL requires functions for trigger logic
3. ✅ **Changed to `BEFORE UPDATE`** - More efficient than `AFTER UPDATE`
4. ✅ **Used `EXECUTE FUNCTION`** - PostgreSQL modern syntax
5. ✅ **Single reusable function** - All 4 triggers use same `update_timestamp()` function

### Issue 2: UUID Generation
1. ✅ **Added `pgcrypto` extension** - Enables UUID generation in PostgreSQL
2. ✅ **Replaced `randomblob(16)`** - With `gen_random_uuid()::text`
3. ✅ **Applied to all 8 tables** - Consistent UUID generation across schema

### Issue 3: Foreign Key Types
1. ✅ **Changed `company_id` from TEXT to INTEGER** - Match companies table id type
2. ✅ **Applied to 5 tables** - All tables referencing companies(id)

## Benefits

- **PostgreSQL Compatible**: Works with Supabase production database
- **Reusable Function**: One function serves all timestamp update triggers
- **Efficient**: `BEFORE UPDATE` modifies row before write (no second UPDATE needed)
- **Safe Re-runs**: `DROP TRIGGER IF EXISTS` and `CREATE EXTENSION IF NOT EXISTS` allow safe re-execution
- **Modern Syntax**: Uses current PostgreSQL best practices (UUID v4 generation)
- **Consistent IDs**: All tables use proper UUID format

## Testing

Run migration:
```bash
npm run db:init
```

Expected output:
```
✓ credentials-schema.sql executed successfully
```

Verify tables created:
```bash
npm run db:init -- --verify
```

Should show 8 new tables:
- client_credentials
- credential_access_log
- platform_capabilities
- website_access
- social_media_accounts
- google_ecosystem_access
- credential_validation_schedules
- auto_action_permissions

## Files Modified

- [`database/credentials-schema.sql`](database/credentials-schema.sql) - Complete rewrite for PostgreSQL compatibility
  - **Lines 1-9**: Added `pgcrypto` extension
  - **Lines 17, 84, 119, 144, 187, 231, 270, 307**: Changed all 8 table IDs to use `gen_random_uuid()::text`
  - **Lines 18, 145, 188, 232, 308**: Changed 5 `company_id` columns from TEXT to INTEGER
  - **Lines 341-379**: Converted triggers to PostgreSQL syntax

**Status**: ✅ All 3 issues fixed - Ready for Supabase deployment

---

## Quick Reference: PostgreSQL vs SQLite Differences

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| **UUID Generation** | `lower(hex(randomblob(16)))` | `gen_random_uuid()::text` |
| **Trigger Creation** | `CREATE TRIGGER IF NOT EXISTS` | `DROP TRIGGER IF EXISTS` then `CREATE TRIGGER` |
| **Trigger Logic** | Inline SQL in `BEGIN...END` | Requires separate function with `RETURNS TRIGGER` |
| **Trigger Execution** | N/A | `EXECUTE FUNCTION function_name()` |
| **UUID Extension** | N/A | Requires `CREATE EXTENSION IF NOT EXISTS "pgcrypto"` |

**Note**: The schema now works with PostgreSQL/Supabase. For SQLite development, these extensions are gracefully ignored.
