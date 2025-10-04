# Blueprints Catalog

Complete catalog of all available blueprints for the GEO-SEO Domination Tool builder system.

## Overview

Blueprints are pre-configured multi-step build recipes that combine multiple builders to create complete features or application setups. Each blueprint can be applied via the `/projects/blueprints` UI or MCP server.

**Total Blueprints**: 8

## Categories

- [Foundation & Infrastructure](#foundation--infrastructure) (2)
- [Authentication & Security](#authentication--security) (2)
- [Payments & Subscriptions](#payments--subscriptions) (2)
- [Multi-Tenancy & Workspaces](#multi-tenancy--workspaces) (1)
- [Usage & Metering](#usage--metering) (1)

---

## Foundation & Infrastructure

### 1. Basic SaaS
**ID**: `basic-saas`
**Complexity**: ⭐⭐ Intermediate
**Time to Apply**: ~5 minutes

**Summary**: Bootstraps a minimal SaaS with health API, database schema, Supabase client, CI/CD pipeline, and Docker configuration.

**What You Get**:
- Health check API endpoint
- Database schema setup (events table)
- Supabase environment and client configuration
- Docker Compose for local development
- GitHub Actions CI pipeline

**Builders Used**:
1. `nextjs-api-route` (health endpoint)
2. `database-schema` (events schema)
3. `supabase-setup` (environment & client)
4. `docker-compose` (containerization)
5. `github-actions-ci` (CI/CD)

**Use Cases**:
- Starting a new SaaS project from scratch
- Setting up development infrastructure
- Establishing CI/CD pipeline early

**Prerequisites**:
- Supabase project created
- GitHub repository initialized
- Docker installed (for local dev)

**Environment Variables Required**:
```env
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
```

**Documentation**: See individual builder docs in `docs/builders/`

---

### 2. SEO Landing Starter
**ID**: `seo-landing`
**Complexity**: ⭐ Beginner
**Time to Apply**: ~3 minutes

**Summary**: Minimal setup for SEO-focused landing pages with sitemap ping API, pages database, and Supabase integration.

**What You Get**:
- Sitemap ping API endpoint
- Pages database schema
- Supabase environment and client

**Builders Used**:
1. `nextjs-api-route` (sitemap-ping endpoint)
2. `database-schema` (pages schema)
3. `supabase-setup` (environment & client)

**Use Cases**:
- Building SEO landing pages
- Managing dynamic page content
- Automating sitemap submissions

**Prerequisites**:
- Supabase project created

**Environment Variables Required**:
```env
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
```

**Documentation**: See `docs/builders/`

---

## Authentication & Security

### 3. Supabase Auth + Profiles with RLS
**ID**: `supabase-accounts-rls`
**Complexity**: ⭐⭐ Intermediate
**Time to Apply**: ~10 minutes

**Summary**: Complete authentication system with magic link, OAuth, protected routes, middleware, and user profiles with Row Level Security.

**What You Get**:
- Login page (magic link + OAuth providers)
- Account page with sign-out
- Protected dashboard page
- Server-side Supabase helper
- Middleware for route protection
- Profiles table with RLS policies
- Auto-profile creation on signup

**Builders Used**:
1. `supabase-auth-pages` (login, account, dashboard, middleware)
2. `supabase-profiles-rls` (profiles table with RLS)

**Use Cases**:
- Adding authentication to Next.js app
- User management with profiles
- Protecting routes and pages

**Prerequisites**:
- Supabase project with auth enabled
- `@supabase/supabase-js` and `@supabase/ssr` packages installed

**Environment Variables Required**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**After Applying**:
1. Run generated SQL in Supabase SQL Editor
2. Enable OAuth providers in Supabase dashboard
3. Configure OAuth redirect URLs

**Documentation**: `docs/SUPABASE_AUTH_RLS.md`

---

### 4. Admin Dashboard Complete
**ID**: `admin-complete`
**Complexity**: ⭐⭐⭐ Advanced
**Time to Apply**: ~8 minutes

**Summary**: Full admin system with role management, user dashboard, and API routes for administering users and roles.

**What You Get**:
- Admin role support (free/pro/admin)
- RLS policies for admin access
- Admin dashboard UI (`/admin`)
- User management API endpoints
- Role update functionality
- User statistics

**Builders Used**:
1. `supabase-profiles-role` (add role column)
2. `supabase-admin-role` (admin RLS policies)
3. `admin-dashboard-page` (admin UI)
4. `admin-users-api` (API routes)

**Use Cases**:
- Managing users and roles
- Admin panels for SaaS
- Internal tools for support teams

**Prerequisites**:
- `supabase-accounts-rls` blueprint applied first
- Profiles table exists

**Environment Variables Required**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE=eyJhbGci...  # Server-side only!
```

**After Applying**:
1. Run generated SQL migrations
2. Manually promote first admin user:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
   ```

**Documentation**: `docs/ADMIN_DASHBOARD.md`

---

## Payments & Subscriptions

### 5. Stripe SaaS
**ID**: `stripe-saas`
**Complexity**: ⭐⭐ Intermediate
**Time to Apply**: ~5 minutes

**Summary**: Stripe integration with environment setup, client initialization, and verified webhook endpoint.

**What You Get**:
- Stripe environment variables template
- Stripe client configuration (`lib/stripe.ts`)
- Webhook endpoint with signature verification
- Event handling for subscriptions

**Builders Used**:
1. `stripe-setup` (env + client)
2. `stripe-webhook` (webhook route)

**Use Cases**:
- Accepting payments
- Subscription management
- Webhook event processing

**Prerequisites**:
- Stripe account created
- `stripe` package installed: `npm i -w web-app stripe`

**Environment Variables Required**:
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**After Applying**:
1. Get webhook secret from Stripe CLI or dashboard
2. Test locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

**Documentation**: `docs/STRIPE_BLUEPRINT.md`

---

### 6. Stripe Pro Roles Gating
**ID**: `stripe-pro-roles`
**Complexity**: ⭐⭐⭐ Advanced
**Time to Apply**: ~12 minutes

**Summary**: Complete subscription-based role system that syncs Stripe subscriptions to Supabase user roles with automatic feature gating.

**What You Get**:
- Stripe setup (env + client)
- Role column in profiles (free/pro/admin)
- Webhook that syncs subscription → role
- Protected `/pro` page for paid users
- Automatic role updates on subscription changes

**Builders Used**:
1. `stripe-setup` (env + client)
2. `supabase-profiles-role` (add role column)
3. `stripe-webhook-roles-sync` (subscription sync)

**Use Cases**:
- Freemium SaaS with paid tiers
- Feature gating by subscription
- Automatic access control

**Prerequisites**:
- `supabase-accounts-rls` blueprint applied
- Stripe account with products configured
- Packages: `stripe`, `@supabase/supabase-js`

**Environment Variables Required**:
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGci...  # Server-side only!
```

**After Applying**:
1. Run SQL migrations
2. Configure Stripe webhook endpoint
3. Create pricing page with checkout links

**Documentation**: `docs/STRIPE_PRO_ROLES_GATING.md`

---

## Multi-Tenancy & Workspaces

### 7. Multi-Tenant Workspaces
**ID**: `multi-tenant-workspaces`
**Complexity**: ⭐⭐⭐ Advanced
**Time to Apply**: ~10 minutes

**Summary**: Complete multi-tenant workspace system with teams, memberships, projects, and active workspace switching.

**What You Get**:
- Workspaces table with RLS
- Workspace memberships (owner/admin/member/viewer roles)
- Projects table (workspace-scoped)
- `/workspaces` UI for creation/management
- API routes for workspace operations
- Active workspace cookie tracking
- Helper utilities for workspace context

**Builders Used**:
1. `workspace-schema` (tables + RLS)
2. `workspace-pages` (UI + API)

**Use Cases**:
- B2B SaaS with team workspaces
- Agency tools with client separation
- Multi-project management

**Prerequisites**:
- Supabase project
- Authentication system (`supabase-accounts-rls`)

**Environment Variables Required**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**After Applying**:
1. Run workspace SQL migrations
2. Scope existing features to active workspace using `getActiveWorkspaceId()`

**Key Concepts**:
- **Workspaces**: Isolated containers for data
- **Memberships**: User roles per workspace
- **Active Workspace**: Cookie-based context for current workspace

**Documentation**: `docs/MULTI_TENANT_WORKSPACES.md`

---

## Usage & Metering

### 8. Usage Metering & Quotas Complete
**ID**: `usage-metering-complete`
**Complexity**: ⭐⭐⭐⭐ Expert
**Time to Apply**: ~15 minutes

**Summary**: Comprehensive usage tracking and quota enforcement system with role-based limits, tracking utilities, and user dashboard.

**What You Get**:
- Quota limits table (per role/metric/period)
- Usage metrics table (actual consumption tracking)
- Helper functions (track_usage, check_quota, get_usage_summary)
- TypeScript utilities (`lib/quota.ts`)
- User dashboard (`/usage`) with progress bars
- Default quotas for free/pro/admin tiers
- Seeded metrics: api_calls, storage_mb, projects, builds, deployments

**Builders Used**:
1. `usage-metering-schema` (database tables + functions)
2. `quota-check-lib` (TypeScript utilities)
3. `usage-dashboard-page` (user UI)

**Use Cases**:
- Usage-based pricing models
- Feature limits by tier
- Resource consumption tracking
- Preventing abuse

**Prerequisites**:
- `supabase-accounts-rls` (for user roles)
- `admin-complete` (for admin tier)
- Packages: `@supabase/supabase-js`

**Environment Variables Required**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE=eyJhbGci...  # Server-side only!
```

**After Applying**:
1. Run usage metering SQL migrations
2. Verify default quotas seeded
3. Integrate quota checks in API routes:
   ```typescript
   import { enforceQuota } from '@/lib/quota';
   await enforceQuota(user.id, 'api_calls', 1);
   ```

**Default Quotas**:
- **Free**: 100 API calls/day, 100 MB storage, 3 projects
- **Pro**: 1000 API calls/day, 10 GB storage, 50 projects
- **Admin**: Unlimited

**Documentation**: `docs/USAGE_METERING_QUOTAS.md`

---

## Quick Start Guide

### 1. Choose a Blueprint
Browse categories above or use the decision tree:

```
Starting fresh?
  └─ Yes → basic-saas or seo-landing
  └─ No → Continue

Need authentication?
  └─ Yes → supabase-accounts-rls
      └─ Need admin panel? → admin-complete
  └─ No → Continue

Need payments?
  └─ Yes → stripe-saas
      └─ Need role-based access? → stripe-pro-roles
  └─ No → Continue

Need team workspaces?
  └─ Yes → multi-tenant-workspaces
  └─ No → Continue

Need usage limits?
  └─ Yes → usage-metering-complete
```

### 2. Apply via UI
1. Navigate to `/projects/blueprints`
2. Select your blueprint
3. Review/override variables
4. Click "Preview Blueprint"
5. Click "Apply Blueprint"

### 3. Apply via MCP
```bash
call_mcp apply_blueprint --id <blueprint-id>
```

### 4. Post-Apply Steps
1. Run generated SQL migrations (if any)
2. Set environment variables
3. Install required packages
4. Read blueprint-specific documentation

---

## Blueprint Combinations

Some blueprints work well together:

### Starter Stack
```
1. basic-saas                  # Infrastructure
2. supabase-accounts-rls       # Authentication
3. admin-complete              # Admin panel
```

### Freemium SaaS Stack
```
1. supabase-accounts-rls       # Authentication
2. stripe-pro-roles            # Subscriptions + Roles
3. usage-metering-complete     # Quotas
```

### B2B SaaS Stack
```
1. supabase-accounts-rls       # Authentication
2. multi-tenant-workspaces     # Teams
3. admin-complete              # Admin panel
4. usage-metering-complete     # Usage tracking
```

### Enterprise Stack
```
1. basic-saas                  # Infrastructure
2. supabase-accounts-rls       # Authentication
3. multi-tenant-workspaces     # Teams
4. admin-complete              # Admin panel
5. stripe-pro-roles            # Subscriptions
6. usage-metering-complete     # Quotas & Metering
```

---

## Blueprint Dependencies

| Blueprint | Requires | Optional |
|-----------|----------|----------|
| basic-saas | - | - |
| seo-landing | - | - |
| supabase-accounts-rls | - | - |
| admin-complete | supabase-accounts-rls | - |
| stripe-saas | - | - |
| stripe-pro-roles | supabase-accounts-rls | admin-complete |
| multi-tenant-workspaces | supabase-accounts-rls | - |
| usage-metering-complete | supabase-accounts-rls | admin-complete |

---

## Environment Variables Matrix

| Variable | Required For |
|----------|-------------|
| `SUPABASE_URL` | All Supabase blueprints |
| `SUPABASE_ANON_KEY` | All Supabase blueprints |
| `SUPABASE_SERVICE_ROLE` | admin-complete, stripe-pro-roles, usage-metering-complete |
| `STRIPE_SECRET_KEY` | stripe-saas, stripe-pro-roles |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | stripe-saas, stripe-pro-roles |
| `STRIPE_WEBHOOK_SECRET` | stripe-saas, stripe-pro-roles |

---

## Creating Custom Blueprints

Create a new JSON file in `blueprints/`:

```json
{
  "id": "my-custom-blueprint",
  "title": "My Custom Blueprint",
  "summary": "Description of what this blueprint does",
  "steps": [
    {
      "builder": "builder-id",
      "variables": {
        "VAR_NAME": "value or ${env:ENV_VAR}"
      }
    }
  ]
}
```

**Best Practices**:
- Use descriptive IDs (lowercase, hyphenated)
- Keep summaries under 150 characters
- Document prerequisites
- Test variable resolution
- Create corresponding docs in `docs/`

---

## Troubleshooting

### Blueprint Not Appearing in UI
- Verify JSON syntax is valid
- Check blueprint is in `blueprints/` directory
- Ensure `id` field is unique

### Variables Not Resolving
- Format: `${env:VAR_NAME}`
- Check environment variable is set
- Case-sensitive variable names

### Builder Not Found
- Verify builder exists in `tools/geo-builders-mcp/builders/`
- Check builder ID matches manifest
- Ensure MCP server is running

### SQL Migration Errors
- Run migrations in correct order
- Check for existing tables/functions
- Verify RLS policies don't conflict

---

## Support & Contribution

### Documentation
Each blueprint has dedicated documentation in `docs/`:
- `SUPABASE_AUTH_RLS.md`
- `STRIPE_PRO_ROLES_GATING.md`
- `MULTI_TENANT_WORKSPACES.md`
- `USAGE_METERING_QUOTAS.md`
- etc.

### Builder Documentation
Individual builders documented in `docs/builders/`

### MCP Server
Builders powered by `tools/geo-builders-mcp/`

### Issues
Report blueprint issues with:
- Blueprint ID
- Steps to reproduce
- Environment details
- Error messages

---

## Changelog

### Recent Additions
- **v1.8** (2025-01): `usage-metering-complete` - Usage tracking and quotas
- **v1.7** (2025-01): `multi-tenant-workspaces` - Multi-tenancy support
- **v1.6** (2025-01): `admin-complete` - Admin dashboard
- **v1.5** (2025-01): `stripe-pro-roles` - Subscription-based roles
- **v1.4** (2025-01): `supabase-accounts-rls` - Auth + profiles
- **v1.3** (2024-12): `stripe-saas` - Stripe integration
- **v1.2** (2024-12): `seo-landing` - SEO landing pages
- **v1.1** (2024-12): `basic-saas` - Basic infrastructure

---

## Quick Reference

| Blueprint | Steps | Complexity | Time | Documentation |
|-----------|-------|------------|------|---------------|
| basic-saas | 5 | ⭐⭐ | 5 min | builders/ |
| seo-landing | 3 | ⭐ | 3 min | builders/ |
| supabase-accounts-rls | 2 | ⭐⭐ | 10 min | SUPABASE_AUTH_RLS.md |
| admin-complete | 4 | ⭐⭐⭐ | 8 min | ADMIN_DASHBOARD.md |
| stripe-saas | 2 | ⭐⭐ | 5 min | STRIPE_BLUEPRINT.md |
| stripe-pro-roles | 3 | ⭐⭐⭐ | 12 min | STRIPE_PRO_ROLES_GATING.md |
| multi-tenant-workspaces | 2 | ⭐⭐⭐ | 10 min | MULTI_TENANT_WORKSPACES.md |
| usage-metering-complete | 3 | ⭐⭐⭐⭐ | 15 min | USAGE_METERING_QUOTAS.md |

**Total Build Time**: ~70 minutes (all blueprints)
