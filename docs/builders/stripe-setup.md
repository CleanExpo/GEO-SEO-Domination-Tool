# Builder: stripe-setup

Creates Stripe env variables and a minimal server client.

**Variables**
- `STRIPE_SECRET_KEY` (required)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (required)

**Creates**
- `web-app/.env.local` (appends keys)
- `web-app/lib/stripe.ts`

**Next**
- Install dependency: `npm i -w web-app stripe`
- Do not import `lib/stripe.ts` from client components.
