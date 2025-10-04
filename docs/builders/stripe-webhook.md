# Builder: stripe-webhook

Adds a Next.js App Router webhook endpoint with Stripe signature verification.

**Variables**
- `WEBHOOK_SECRET` (required) — webhook signing secret
- `ROUTE_SEGMENT` (optional) — defaults to `stripe`

**Requires**
- Env: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
- Package: `stripe` → `npm i -w web-app stripe`

**Local testing**
- Install Stripe CLI and run: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- It will print a `whsec_...` secret; set `STRIPE_WEBHOOK_SECRET` to that.
