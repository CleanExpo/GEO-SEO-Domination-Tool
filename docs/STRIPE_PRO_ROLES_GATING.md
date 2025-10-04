# Stripe Pro Roles Gating

This feature integrates Stripe subscriptions with Supabase user roles to gate features for paid users. When a user subscribes via Stripe, their `profiles.role` is set to **pro**; when they cancel or the subscription expires, it reverts to **free**.

## Overview

The **stripe-pro-roles** blueprint combines three builders:
1. **stripe-setup** → Stripe client initialization and environment variables
2. **supabase-profiles-role** → Adds `role` column to profiles table
3. **stripe-webhook-roles-sync** → Webhook endpoint that syncs subscription status to user roles

Additionally, a protected `/pro` page demonstrates role-based access control.

## Prerequisites

### Stripe Account
1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard > Developers > API keys
3. Create a product with recurring pricing (e.g., "Pro Plan" at $10/month)

### Supabase Setup
1. Profiles table must exist (use `supabase-profiles-rls` builder first)
2. Get **Service Role Key** from Supabase Dashboard > Settings > API
   - ⚠️ **CRITICAL**: Service role key bypasses RLS - keep server-side only!

### Environment Variables

Add to `.env.local` (web-app directory):
```env
# Stripe (from stripe-setup builder)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGci...  # ⚠️ Server-side only!
```

**Note**: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE` are used by the webhook (server-side) to update roles.

### Package Installation
```bash
npm i -w web-app stripe @supabase/supabase-js @supabase/ssr
```

## Apply the Blueprint

### Via Blueprints UI
1. Navigate to `/projects/blueprints`
2. Select "Stripe Pro Roles Gating"
3. Review variable overrides (defaults are fine)
4. Click "Preview Blueprint" to see file changes
5. Click "Apply Blueprint"

### Via MCP Server
```bash
call_mcp apply_blueprint --id stripe-pro-roles
```

## Generated Files

### Builders Output
- `web-app/lib/stripe.ts` — Stripe client (from stripe-setup)
- `web-app/.env.local` — Environment variables template (from stripe-setup)
- `database/supabase/profiles_role.sql` — SQL to add role column
- `web-app/app/api/webhooks/stripe-sync/route.ts` — Webhook endpoint
- `docs/builders/supabase-profiles-role.md` — Builder docs
- `docs/builders/stripe-webhook-roles-sync.md` — Builder docs

### Manual Files (created outside blueprint)
- `web-app/app/pro/page.tsx` — Protected pro page (already created)

## Setup Steps

### 1. Apply the Blueprint
Use Blueprints UI or MCP to generate all files.

### 2. Run Database Migration
Copy the SQL from `database/supabase/profiles_role.sql` and run in Supabase SQL Editor:
```sql
alter table if exists public.profiles
  add column if not exists role text not null default 'free';

create index if not exists idx_profiles_role
  on public.profiles(role);
```

Verify the column was added:
```sql
SELECT * FROM profiles LIMIT 1;
```

### 3. Configure Stripe Webhook

#### Development (Stripe CLI)
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe-sync
   ```
4. Copy the webhook signing secret (`whsec_...`) to `STRIPE_WEBHOOK_SECRET` in `.env.local`
5. Restart dev server

#### Production (Stripe Dashboard)
1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. URL: `https://yourdomain.com/api/webhooks/stripe-sync`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.paused`
5. Copy the signing secret to `STRIPE_WEBHOOK_SECRET` environment variable
6. Redeploy

### 4. Start Development Server
```bash
npm run dev -w web-app
```

## Testing

### Test Subscription Flow (Local)

#### Using Stripe CLI Triggers
1. Start webhook listener:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe-sync
   ```

2. Trigger checkout completed event:
   ```bash
   stripe trigger checkout.session.completed
   ```

3. Check Supabase Table Editor > profiles:
   - Find the user with matching email
   - Verify `role` changed to `pro`

4. Trigger subscription deleted event:
   ```bash
   stripe trigger customer.subscription.deleted
   ```

5. Check profiles table again:
   - Verify `role` reverted to `free`

#### Using Test Mode Checkout
1. Create a Stripe Checkout session (requires custom code or use Stripe Payment Links)
2. Use test card: `4242 4242 4242 4242`, any future expiry, any CVC
3. Complete checkout
4. Webhook should fire and set `role = 'pro'`

### Test Protected Page

#### As Free User
1. Sign up at `/login` with a new email
2. Navigate to `/pro`
3. You should see "You need a Pro subscription" message

#### As Pro User
1. Manually set role to pro in Supabase:
   ```sql
   UPDATE profiles SET role = 'pro' WHERE email = 'user@example.com';
   ```
2. Navigate to `/pro`
3. You should see "Pro Dashboard" with unlocked features

#### Via Webhook
1. Complete Stripe checkout (see above)
2. Navigate to `/pro`
3. You should have pro access automatically

### Verify Webhook Logs
Check server console for webhook events:
```
[webhook] checkout.session.completed { customer_email: 'user@example.com' }
[webhook] Profile updated: user@example.com → pro
```

## Role-Based Access Patterns

### Server Component (Recommended)
```typescript
// app/premium-feature/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function PremiumFeaturePage(){
  const supa = createServerClient(/*...*/);
  const { data: { user } } = await supa.auth.getUser();

  const { data: profile } = await supa
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  if (profile.role !== 'pro'){
    return <div>Upgrade to Pro to access this feature.</div>;
  }

  return <div>Premium content here</div>;
}
```

### Client Component
```typescript
'use client';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function ClientFeature(){
  const [role, setRole] = useState<string>('free');

  useEffect(() => {
    async function fetchRole(){
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user!.id)
        .single();
      setRole(data?.role || 'free');
    }
    fetchRole();
  }, []);

  if (role !== 'pro') return <div>Pro only</div>;
  return <div>Premium feature</div>;
}
```

### API Route Protection
```typescript
// app/api/premium/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(){
  const supa = createServerClient(/*...*/);
  const { data: { user } } = await supa.auth.getUser();

  const { data: profile } = await supa
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  if (profile?.role !== 'pro'){
    return Response.json({ error: 'Pro subscription required' }, { status: 403 });
  }

  return Response.json({ data: 'premium data' });
}
```

## Webhook Event Handling

The webhook handles the following Stripe events:

### `checkout.session.completed`
- **Trigger**: User completes Stripe Checkout
- **Action**: Sets `role = 'pro'` for user with matching email
- **Use case**: Initial subscription purchase

### `customer.subscription.created`
- **Trigger**: Subscription is created (may overlap with checkout.session.completed)
- **Action**: Sets `role = 'pro'` if status is active/trialing/past_due
- **Use case**: Subscription created via API or dashboard

### `customer.subscription.updated`
- **Trigger**: Subscription status changes (e.g., renewal, payment failed)
- **Action**: Updates role based on subscription status
- **Use case**: Status changes from active to past_due, or vice versa

### `customer.subscription.deleted`
- **Trigger**: Subscription is canceled or expires
- **Action**: Sets `role = 'free'`
- **Use case**: User cancels or subscription ends

### `customer.subscription.paused`
- **Trigger**: Subscription is paused (if enabled in Stripe)
- **Action**: Sets `role = 'free'`
- **Use case**: Temporary subscription pause

## Customization

### Add Additional Roles
Edit the SQL migration to support more roles:
```sql
alter table profiles
  add column role text not null default 'free'
  check (role in ('free', 'pro', 'enterprise'));
```

Update webhook logic in `route.ts.eta`:
```typescript
function getRoleForSubscription(sub: Stripe.Subscription): string {
  if (!isActive(sub.status)) return 'free';

  // Check price ID to determine tier
  const priceId = sub.items.data[0]?.price.id;
  if (priceId === 'price_enterprise_xxx') return 'enterprise';
  if (priceId === 'price_pro_xxx') return 'pro';

  return 'free';
}
```

### Add Stripe Customer ID to Profiles
Store `stripe_customer_id` for easier lookups:
```sql
alter table profiles add column stripe_customer_id text;
create unique index idx_profiles_stripe_customer on profiles(stripe_customer_id);
```

Update webhook to use customer ID instead of email:
```typescript
const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
await supa.from('profiles').update({ role: 'pro' }).eq('stripe_customer_id', customerId);
```

### Add Trial Period Handling
```typescript
function isActive(status?: string){
  return status === 'active' || status === 'trialing' || status === 'past_due';
}

// Trialing users get pro access during trial
if (sub.status === 'trialing'){
  await setRoleByEmail(email, 'pro');
}
```

## Troubleshooting

### Role not updating after checkout
- Check webhook endpoint is receiving events (Stripe Dashboard > Developers > Webhooks > Events)
- Verify `STRIPE_WEBHOOK_SECRET` matches the endpoint's signing secret
- Check server logs for webhook errors
- Ensure email in Stripe checkout matches email in profiles table

### "Service role key not found" error
- Verify `SUPABASE_SERVICE_ROLE` is set in environment variables
- Ensure the key is the **service role key**, not anon key
- Restart dev server after adding env vars

### Webhook signature verification failed
- Check `STRIPE_WEBHOOK_SECRET` is correct
- For local testing, use Stripe CLI's forwarding secret (`whsec_...`)
- For production, use the webhook endpoint's signing secret from Stripe Dashboard

### Role updates but /pro page still shows "upgrade" message
- Clear browser cache and reload
- Check that session is fresh (sign out and sign in again)
- Verify profile query is using correct user ID
- Check Supabase RLS policies allow reading own profile

### Customer email not found
- Stripe checkout requires email - ensure it's collected during checkout
- Check `customer_details.email` or `customer_email` in webhook payload
- Consider storing `stripe_customer_id` instead of relying on email matching

## Security Considerations

### Service Role Key
- ⚠️ **NEVER** expose `SUPABASE_SERVICE_ROLE` to client-side code
- Only use in API routes (server-side)
- Store in environment variables, never commit to Git
- Rotate key if compromised

### Webhook Security
- Always verify webhook signatures (`stripe.webhooks.constructEvent`)
- Use HTTPS in production
- Restrict webhook endpoint to POST requests only
- Log all webhook events for audit trail

### Role Validation
- Always validate role on server before granting access
- Don't trust client-side role checks alone
- Use RLS policies to enforce role-based data access

## Production Deployment

### Environment Variables (Vercel)
1. Add all environment variables in Vercel Dashboard > Settings > Environment Variables
2. Include production Stripe keys (not test keys)
3. Set `STRIPE_WEBHOOK_SECRET` from production webhook endpoint
4. Redeploy

### Stripe Webhook Configuration
1. Create production webhook endpoint in Stripe Dashboard
2. URL: `https://yourdomain.com/api/webhooks/stripe-sync`
3. Select all subscription events
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### Database Migration
Run the role migration SQL in production Supabase project:
```sql
alter table public.profiles
  add column if not exists role text not null default 'free';
```

### Monitoring
- Monitor webhook delivery in Stripe Dashboard > Developers > Webhooks
- Set up Stripe webhook alerts for failures
- Log role changes for audit purposes
- Monitor failed payment events to handle gracefully

## Next Steps

### Add Pricing Page
Create `/pricing` page with Stripe Checkout links:
```typescript
// app/pricing/page.tsx
'use client';
import { supabase } from '@/lib/supabase';

export default function PricingPage(){
  async function checkout(){
    const { data: { user } } = await supabase.auth.getUser();
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ email: user?.email })
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div>
      <button onClick={checkout}>Subscribe to Pro</button>
    </div>
  );
}
```

### Add Billing Portal
Let users manage subscriptions:
```typescript
// app/api/billing-portal/route.ts
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request){
  const { customerId } = await req.json();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/account`
  });
  return Response.json({ url: session.url });
}
```

### Add Usage Limits
Enforce feature limits based on role:
```typescript
// lib/usage-limits.ts
export const LIMITS = {
  free: { apiCalls: 100, storage: 1024 },
  pro: { apiCalls: 10000, storage: 10240 }
};

export function canUseFeature(role: string, feature: string, usage: number){
  const limit = LIMITS[role as keyof typeof LIMITS]?.[feature as keyof typeof LIMITS.free];
  return usage < limit;
}
```

## References

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
