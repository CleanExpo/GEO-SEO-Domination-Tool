# 🔧 Quick Fix Guide - Onboarding & Client Autopilot

## ❌ Current Issues

1. **"Failed to start onboarding"** - Database not initialized
2. **Vercel deployment** - Missing environment variables
3. **Local dev** - Using Supabase connection instead of SQLite

---

## ✅ Quick Fix #1: Use SQLite for Local Development

The system is trying to connect to Supabase but should use SQLite locally.

### Fix `.env.local`:

```bash
# Comment out or remove Supabase variables for local dev
# NEXT_PUBLIC_SUPABASE_URL=...
# SUPABASE_SERVICE_ROLE_KEY=...

# Add this to force SQLite:
DATABASE_URL=
```

Or create `.env.local` with:
```bash
# Force SQLite for local development
NODE_ENV=development
```

---

## ✅ Quick Fix #2: Initialize Database

Run this command to create all tables:

```bash
# Method 1: Using npm script
npm run db:init

# Method 2: Direct SQL execution
# (If init script fails, manually create tables)
```

**Expected tables**:
- `companies`
- `saved_onboarding`
- `subscription_tiers` (with 4 pre-populated tiers)
- `client_subscriptions`
- `task_execution_calendar`
- `autonomous_tasks`
- And 20+ other SEO/CRM tables

---

## ✅ Quick Fix #3: Vercel Deployment

The Vercel deployment succeeded but needs these environment variables:

### Required for Production:

```bash
# Supabase (Production Database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Or PostgreSQL Direct
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Add in Vercel Dashboard:
1. Go to project settings
2. Navigate to "Environment Variables"
3. Add the variables above
4. Redeploy

---

## ✅ Quick Fix #4: Test Client Autopilot

Once database is initialized:

### Step 1: Create a Test Company

```bash
# Option A: Via UI
http://localhost:3001/companies

# Option B: Via SQL (if UI doesn't work)
# Insert directly into companies table
```

### Step 2: Navigate to Setup Page

```bash
http://localhost:3001/clients
```

### Step 3: Create Subscription

1. Select the test company
2. Choose tier (Starter/Growth/Scale/Empire)
3. Click "Create Subscription"
4. You'll be redirected to the circular visualization dashboard

---

##  Quick Fix #5: Manual Database Creation

If `npm run db:init` fails, manually create key tables:

```sql
-- Create saved_onboarding table
CREATE TABLE IF NOT EXISTS saved_onboarding (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_name TEXT NOT NULL,
  email TEXT NOT NULL,
  form_data TEXT NOT NULL,
  current_step INTEGER DEFAULT 1,
  last_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(business_name, email)
);

-- Create subscription_tiers table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  monthly_price_usd DECIMAL(10, 2) NOT NULL,
  seo_audits_per_month INTEGER DEFAULT 0,
  blog_posts_per_month INTEGER DEFAULT 0,
  social_posts_per_month INTEGER DEFAULT 0,
  research_papers_per_month INTEGER DEFAULT 0,
  gmb_posts_per_month INTEGER DEFAULT 0,
  white_papers_per_month INTEGER DEFAULT 0,
  competitor_monitoring_frequency TEXT DEFAULT 'weekly',
  autopilot_enabled BOOLEAN DEFAULT 1,
  auto_publish_enabled BOOLEAN DEFAULT 0,
  ruler_quality_threshold INTEGER DEFAULT 85,
  priority_level INTEGER DEFAULT 1,
  max_concurrent_tasks INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert tiers
INSERT INTO subscription_tiers (name, display_name, description, monthly_price_usd,
  seo_audits_per_month, blog_posts_per_month, social_posts_per_month, research_papers_per_month,
  gmb_posts_per_month, white_papers_per_month, competitor_monitoring_frequency,
  autopilot_enabled, auto_publish_enabled, ruler_quality_threshold, priority_level, max_concurrent_tasks, display_order)
VALUES
  ('starter', 'Starter', 'Perfect for small businesses', 500.00, 2, 4, 20, 0, 8, 0, 'weekly', 1, 0, 85, 1, 2, 1),
  ('growth', 'Growth', 'Ideal for growing businesses', 1000.00, 4, 8, 40, 1, 16, 0, '3x_week', 1, 1, 80, 2, 3, 2),
  ('scale', 'Scale', 'For established businesses', 2500.00, 8, 16, 80, 2, 32, 1, 'daily', 1, 1, 75, 3, 5, 3),
  ('empire', 'Empire', 'Industry leaders', 5000.00, 16, 32, 160, 4, 64, 2, 'realtime', 1, 1, 70, 4, 10, 4);
```

---

## 🎯 Priority Fixes

### For Local Development:
1. ✅ Fix `.env.local` (remove Supabase vars)
2. ✅ Run `npm run db:init`
3. ✅ Restart dev server: `npm run dev`
4. ✅ Test onboarding: http://localhost:3001/onboarding
5. ✅ Test autopilot: http://localhost:3001/clients

### For Vercel Production:
1. ✅ Add Supabase environment variables
2. ✅ Run database migrations on Supabase
3. ✅ Redeploy from Vercel dashboard
4. ✅ Test production onboarding

---

## 📊 Expected Results After Fix

### Onboarding:
- ✅ Form loads without errors
- ✅ "Save Progress" button works
- ✅ "Load Progress" button retrieves saved data
- ✅ Progress persists across sessions

### Client Autopilot:
- ✅ `/clients` page shows tier selection
- ✅ Creating subscription generates 30-day schedule
- ✅ Dashboard shows circular visualization
- ✅ Tasks displayed in colored cogs
- ✅ Center cog rotates (when tasks execute)
- ✅ Quota progress bars work
- ✅ Pause/Resume buttons functional

---

## 🚨 If Still Broken

### Check Server Logs:
```bash
# Look for errors in terminal
tail -f .next/*.log

# Or check browser console (F12)
```

### Common Errors:

**"Cannot find module '@/database/init'"**
- Solution: Database file path issue, use `database/init.ts`

**"subscription_tiers table not found"**
- Solution: Run manual SQL above or `npm run db:init`

**"Failed to save onboarding"**
- Solution: `saved_onboarding` table missing, create manually

**"No companies found"**
- Solution: Create a test company first at `/companies`

---

## ✅ Verification Checklist

Run these to verify everything works:

```bash
# 1. Check database exists
ls -la data/geo-seo.db

# 2. Check dev server running
curl http://localhost:3001

# 3. Check API endpoints
curl http://localhost:3001/api/clients/subscribe

# 4. Check onboarding API
curl "http://localhost:3001/api/onboarding/save" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Test","email":"test@example.com","formData":{},"currentStep":1}'
```

Expected: All should return 200 or valid JSON responses.

---

## 🎉 Success State

When everything works:

1. **Onboarding**: Saves/loads progress without errors
2. **Clients Page**: Shows 4 tier cards with pricing
3. **Subscription Creation**: Generates 34-276 tasks (depending on tier)
4. **Dashboard**: Shows beautiful circular visualization
5. **Tasks**: Displayed as colored cogs in circle
6. **Autopilot**: Center cog rotates when tasks execute

---

**Next Step**: Follow Quick Fix #1-3 above, then test at http://localhost:3001/clients

