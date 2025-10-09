# Production API Debug Status - 2025-10-09 UPDATE

## Critical Discovery

After 12 deployment attempts and local testing showing the fix works perfectly, production still fails with the same PostgreSQL syntax error.

## What We Know For Certain

✅ **Local database connection works:**
```bash
node scripts/test-db-direct.js
# Result: Query successful! (using $1, $2 format)
```

✅ **Placeholder conversion logic is correct:**
```typescript
let paramIndex = 1;
const pgSql = sql.replace(/\?/g, () => `${paramIndex++}`);
// Converts: "... WHERE x = ? AND y = ?" 
// To:       "... WHERE x = $1 AND y = $2"
```

✅ **DATABASE_URL is set correctly in Vercel:**
```
postgresql://postgres.qwoggbbavikzhypzodcr:NwtXEg6aVNs7ZstH@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
```

❌ **Production API fails consistently:**
```json
{
  "error": "Failed to save progress",
  "details": "syntax error at or near \"AND\"",
  "code": "42601"
}
```

## The Problem

PostgreSQL error "syntax error at or near 'AND'" means it's receiving:
```sql
SELECT ... WHERE business_name = ? AND email = ?
```

Instead of:
```sql
SELECT ... WHERE business_name = $1 AND email = $2
```

This can ONLY happen if:
1. `config.type !== 'postgres'` (SQLite branch is being taken)
2. OR the placeholder conversion code isn't running
3. OR there's a different code path being used

## Next Steps - Systematic Debugging

Since Vercel logs are difficult to access, I need to add error tracing that RETURNS debug info to the client:

### Option 1: Add Debug Response Headers
Modify `app/api/onboarding/save/route.ts` to return debug info in response headers:
```typescript
return NextResponse.json(
  { error: ... },
  { 
    status: 500,
    headers: {
      'X-Debug-DB-Type': db.getType(),
      'X-Debug-Has-DATABASE-URL': String(!!process.env.DATABASE_URL),
      'X-Debug-Has-POSTGRES-URL': String(!!process.env.POSTGRES_URL)
    }
  }
);
```

### Option 2: Return Debug Info in Error Response
```typescript
return NextResponse.json({
  error: 'Failed to save progress',
  details: error.message,
  code: error.code,
  debug: {
    dbType: db.getType(),
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    nodeEnv: process.env.NODE_ENV
  }
}, { status: 500 });
```

### Option 3: Test Different API Route
Create a simple test endpoint that just returns database configuration:
```typescript
// app/api/debug/db-config/route.ts
export async function GET() {
  const db = getDatabase();
  await db.initialize();
  
  return NextResponse.json({
    dbType: db.getType(),
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    nodeEnv: process.env.NODE_ENV,
    connectionString: process.env.DATABASE_URL ? 'SET' : 'NOTSET'
  });
}
```

## Recommendation

Implement **Option 3** - create a dedicated debug endpoint. This will definitively show:
- What database type is being detected
- Whether environment variables are available
- The execution environment

Once we know the database type being detected, we can fix the root cause.

---

**Status:** 🚫 Blocked - Need visibility into production runtime config
**Next Action:** Create debug endpoint to expose database configuration
**Priority:** 🔴 Critical - Blocks production onboarding
**Last Updated:** 2025-10-09 23:05 AEST
