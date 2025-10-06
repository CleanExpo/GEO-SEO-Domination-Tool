# Vercel Preview Deployment - October 6, 2025

## Deployment Successful

**Preview URL**: https://web-2ljs7f7be-unite-group.vercel.app

**Branch**: `qwen-omni`

**Latest Commit**: 1e58b96 - "fix: Force dynamic rendering globally to prevent Supabase build errors"

**Deployment Time**: ~23 seconds (build phase)

---

## Pre-Deployment Changes

### 1. Vercel Coding-Agent Integration
- Integrated Vercel coding-agent-template with MetaCoder sandbox
- Added database migration for sandbox_tasks table (011_add_sandbox_tasks.sql)
- Fixed view recreation error in migration 011

### 2. Build Configuration Fixes

#### Issue: Static Generation Errors
The Next.js 15 build was attempting to statically generate pages that require database access, causing Supabase client initialization errors during the build phase.

**Error Message**:
```
Error: @supabase/ssr: Your project's URL and API key are required to create a Supabase client!
```

**Pages Affected**:
- `/crm/calendar`
- `/companies`
- All client component pages making API calls (36 total)

#### Solution: Global Dynamic Rendering
Added dynamic rendering configuration to the root layout to force runtime rendering for all pages:

**File**: `web-app/app/layout.tsx`
```typescript
// Force dynamic rendering globally to prevent build-time database access
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
```

**File**: `web-app/app/crm/calendar/page.tsx`
```typescript
// Force dynamic rendering to avoid build-time API calls
export const dynamic = 'force-dynamic';
```

---

## Deployment Details

### Vercel Configuration
- **Project ID**: prj_SDTE5n1B9zlVHcGjRZiDo4KhhBMc
- **Organization ID**: team_KMZACI5rIltoCRhAtGCXlxUf
- **Project Name**: web-app
- **Region**: Washington, D.C., USA (East) - iad1
- **Build Machine**: 4 cores, 8 GB RAM

### Build Summary
- **Next.js Version**: 15.5.4
- **Node.js Version**: v20.19.4
- **npm Version**: 10.8.3
- **Vercel CLI Version**: 48.1.0
- **Total Packages**: 744
- **Build Status**: SUCCESS

### Build Configuration
- **Output**: standalone
- **TypeScript**: Build errors ignored (ignoreBuildErrors: true)
- **ESLint**: Ignored during builds (ignoreDuringBuilds: true)
- **Image Optimization**: AVIF and WebP formats enabled
- **Package Optimization**: Supabase, Lucide React, date-fns
- **Externals**: pg, pg-native, ioredis (server-side only)

---

## Important Notes

### Database Migration Required
The database migration `011_add_sandbox_tasks.sql` needs to be run manually on Supabase after deployment:

```sql
-- Create sandbox_tasks table for MetaCoder integration
CREATE TABLE IF NOT EXISTS sandbox_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  task_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sandbox_tasks_session_id ON sandbox_tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_tasks_status ON sandbox_tasks(status);
```

### Environment Variables
Ensure the following environment variables are configured in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL` or `POSTGRES_URL` (for server-side database access)

### Deprecation Warnings
The following packages are deprecated and should be migrated:
- `@supabase/auth-helpers-nextjs@0.10.0` → Use `@supabase/ssr` instead
- `@supabase/auth-helpers-shared@0.7.0` → Use `@supabase/ssr` instead

### Peer Dependency Warnings
- Zod version conflict: Project uses v4.1.11, but `zod-to-json-schema` expects v3.24.1
- This is non-critical and doesn't affect functionality

---

## Next Steps

1. **Run Database Migration**:
   - Access Supabase dashboard
   - Navigate to SQL Editor
   - Execute migration 011_add_sandbox_tasks.sql

2. **Verify Deployment**:
   - Visit preview URL: https://web-2ljs7f7be-unite-group.vercel.app
   - Test key pages:
     - Dashboard
     - Companies listing
     - CRM Calendar
     - SEO Audit pages

3. **Monitor Logs**:
   ```bash
   vercel inspect web-2ljs7f7be-unite-group.vercel.app --logs
   ```

4. **Production Deployment** (when ready):
   ```bash
   vercel --prod
   ```

---

## Deployment Commands Reference

### View Deployment Details
```bash
vercel inspect web-2ljs7f7be-unite-group.vercel.app
```

### View Logs
```bash
vercel inspect web-2ljs7f7be-unite-group.vercel.app --logs
```

### Redeploy Same Build
```bash
vercel redeploy web-2ljs7f7be-unite-group.vercel.app
```

### Deploy to Production
```bash
cd web-app && vercel --prod
```

---

## Files Modified

1. `web-app/app/layout.tsx` - Added global dynamic rendering config
2. `web-app/app/crm/calendar/page.tsx` - Added page-level dynamic rendering
3. `database/migrations/011_add_sandbox_tasks.sql` - New migration (pending Supabase execution)
4. `.vercel/project.json` - Updated by Vercel CLI

## Git Commits

1. **eeeb552** - "fix: Force dynamic rendering for CRM calendar page to prevent build errors"
2. **1e58b96** - "fix: Force dynamic rendering globally to prevent Supabase build errors"

---

Generated by Claude Code on October 6, 2025
