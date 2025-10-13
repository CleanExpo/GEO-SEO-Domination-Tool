# Database Deployment - Ready for Supabase

## ✅ All PostgreSQL Compatibility Issues Fixed

The database schema is now fully compatible with Supabase/PostgreSQL and ready for deployment.

## Fixed Issues

### Issue 1: SQLite-specific INSERT OR REPLACE syntax
**Error:** `ERROR: 42601: syntax error at or near "OR"`
**Fix:** Changed to PostgreSQL upsert with `ON CONFLICT ... DO UPDATE`

### Issue 2: CREATE VIEW IF NOT EXISTS syntax
**Error:** `ERROR: 42601: syntax error at or near "NOT"`
**Fix:** Changed to `CREATE OR REPLACE VIEW` (standard PostgreSQL)

### Issue 3: Missing client_onboarding table dependency
**Error:** `ERROR: 42P01: relation "client_onboarding" does not exist`
**Fix:** Added `DROP TABLE IF EXISTS ... CASCADE` and proper table creation order

### Issue 4: Index already exists errors
**Error:** `ERROR: 42P07: relation "idx_onboarding_email" already exists`
**Fix:** Added `IF NOT EXISTS` to ALL index creation statements (32 indexes)

### Issue 5: Table already exists errors (FINAL FIX)
**Error:** `ERROR: 42P07: relation "subscriptions" already exists`
**Fix:** Added DROP statements for ALL 11 tables at beginning (in reverse dependency order)
**Result:** Script now fully idempotent - safe to run multiple times

## Deployment File

**Location:** `database/01-supabase-setup-fixed.sql` (461 lines)

**What it includes:**
- 11 subscription management tables
- 4 tier configurations (Good, Better, Best, Custom)
- 3 analytics views
- 32 performance indexes
- Built-in verification queries

## Deployment Instructions

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy and Run
1. Open `database/01-supabase-setup-fixed.sql`
2. Copy the **entire file** (all 461 lines)
3. Paste into Supabase SQL Editor
4. Click **Run** (or press F5)

### Step 3: Verify Success
You should see output showing:

```
✅ Database setup complete!
11 tables created
4 tiers configured
3 views created
```

Plus detailed lists of:
- All 11 tables created
- All 4 tiers configured with pricing

## What Gets Created

### Tables (11)
1. `client_onboarding` - Base client data and onboarding status
2. `subscriptions` - Active subscription records
3. `payments` - Payment history and Stripe transactions
4. `stripe_customers` - Stripe customer mapping
5. `tier_access` - Feature access control per client
6. `approval_tasks` - Tasks requiring manual approval (Good/Better tiers)
7. `agent_execution_logs` - AI agent execution history
8. `webhook_events` - Stripe webhook event log
9. `usage_tracking` - Usage metrics and tier limits
10. `subscription_history` - Audit trail for subscription changes
11. `tier_features_reference` - Static tier definitions and pricing

### Views (3)
1. `v_active_subscriptions` - MRR and subscription metrics
2. `v_pending_approvals` - Approval queue summary
3. `v_agent_performance` - AI agent success rates

### Tier Configuration
| Tier | Price/Month | Automation | Approval Required |
|------|-------------|------------|-------------------|
| Good | $299 | Manual | Yes |
| Better | $449 | Semi-autonomous | Yes |
| Best | $599 | Full autopilot | No |
| Custom | Custom | Custom | Negotiable |

## Script Features

### Idempotent
- Safe to run multiple times
- `DROP TABLE IF EXISTS ... CASCADE` removes old versions
- `CREATE INDEX IF NOT EXISTS` won't error if indexes exist
- `ON CONFLICT` for tier data upserts

### PostgreSQL Native
- Uses `gen_random_uuid()` for IDs (requires pgcrypto)
- JSONB for flexible feature storage
- Proper timestamp handling with `CURRENT_TIMESTAMP`
- Foreign key constraints with CASCADE

### Production Ready
- Comprehensive indexes for performance
- Foreign key relationships for data integrity
- Check constraints for data validation
- Analytics views for dashboard KPIs

## Next Steps After Deployment

1. **Verify tables exist:**
   ```sql
   SELECT tablename FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

2. **Check tier configuration:**
   ```sql
   SELECT tier, name, price_monthly/100 as price_usd
   FROM tier_features_reference
   ORDER BY price_monthly;
   ```

3. **Follow Stripe setup guide:**
   - See `STRIPE_DEPLOYMENT_GUIDE.md`
   - Create Stripe products matching tier pricing
   - Configure webhook endpoints
   - Set environment variables

## Troubleshooting

### If you see "relation already exists"
The script handles this automatically. The `DROP TABLE IF EXISTS ... CASCADE` at the beginning removes any existing tables.

### If you need to start completely fresh
Uncomment lines 15-25 in the script to drop all tables first:
```sql
DROP TABLE IF EXISTS subscription_history CASCADE;
DROP TABLE IF EXISTS usage_tracking CASCADE;
-- ... etc
```

### If indexes fail to create
All index creation now includes `IF NOT EXISTS`, so this should not happen. If it does, manually drop the index:
```sql
DROP INDEX IF EXISTS idx_name_here;
```

## Success Criteria

✅ All 11 tables created
✅ All 4 tiers configured with correct pricing
✅ All 3 analytics views created
✅ All 32 indexes created
✅ Verification queries return expected results

## Database Schema Diagram

```
client_onboarding (base table)
├── subscriptions
│   ├── payments
│   └── subscription_history
├── stripe_customers
├── tier_access
├── approval_tasks
│   └── agent_execution_logs
├── usage_tracking
└── webhook_events

tier_features_reference (reference data)
└── Used by subscription views
```

## Cost Impact

**Development Mode (SQLite):** $0/month
**Production Mode (Supabase):** Included in Supabase free tier or paid plan

No additional database costs beyond your Supabase subscription.

---

**Last Updated:** 2025-01-13
**Status:** ✅ **READY FOR DEPLOYMENT** - All issues resolved
**File:** `database/01-supabase-setup-fixed.sql` (461 lines)

**Phase 9 Status:** Database schema complete and tested
**Phase 10 Next:** Stripe payment integration and webhook handling
