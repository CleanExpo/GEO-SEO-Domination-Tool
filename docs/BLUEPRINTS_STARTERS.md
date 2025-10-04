# Starter Blueprints

Two blueprint presets are now available and visible in `/projects/catalog` and via `geo blueprint`:

## 1) `saas-starter`
**Includes**
- `nextjs-api-route` → `/api/health` route
- `role-guards` → middleware + /settings/roles admin UI
- `supabase-setup` → `.env.local` and `lib/supabaseClient.ts` (fill values below)
- `docker-compose` → `infra/docker` + compose.yml
- `github-actions-ci` → CI for typecheck/lint/build & Docker publish
- `stripe-billing` → `/settings/billing` + checkout/portal/webhook

**Before running**
- Save Supabase URL + anon key in **/settings/integrations** (or provide them when prompted in the UI step form).
- (Optional) Add Stripe test keys to `web-app/.env.local` after generation.

## 2) `saas-starter-with-db`
Everything above plus `database-schema` (baseline SQL schema under `database/`).

## How to run (CRM)
1. Open **/projects/catalog**.
2. Choose a blueprint: `SaaS Starter` or `SaaS Starter + Database Schema`.
3. (Optional) Toggle **Auto-Link** (GitHub↔Vercel) and **First Deploy**.
4. If Autolink is on, fill **owner/repo**.
5. Click **Run Blueprint** and watch logs.

## How to run (CLI)
```bash
geo blueprint --run saas-starter --owner your-org --repo my-saas
# or
geo init --id saas-starter --owner your-org --repo my-saas
```

## Notes
- `supabase-setup` will use values you provide in the step form; if left blank, ensure you've saved credentials in **/settings/integrations** first.
- Stripe UI/APIs are generated; add keys later and use Stripe CLI to forward webhooks.
