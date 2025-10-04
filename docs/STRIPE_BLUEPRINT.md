# Stripe SaaS Blueprint

This blueprint applies two builders:
1) **stripe-setup** → `.env.local` keys + `lib/stripe.ts`
2) **stripe-webhook** → `app/api/webhooks/stripe/route.ts` with signature verification

## Prereqs
- Set environment variables (or fill during Apply):
  - `STRIPE_SECRET_KEY`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET` (from Stripe CLI or Dashboard)
- Install package: `npm i -w web-app stripe`

## Test locally
1. Run dev server: `npm run dev -w web-app`
2. Start Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Trigger a test event, e.g.: `stripe trigger checkout.session.completed`

Check server logs; route returns `{ ok:true }` on success.
