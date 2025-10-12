# Stripe Deployment Guide
## Complete Setup for Production-Ready Tier-Based Payments

**Date:** 2025-10-12
**Status:** Ready for Deployment
**Estimated Setup Time:** 30-45 minutes

---

## Prerequisites

- [ ] Stripe account created (https://dashboard.stripe.com)
- [ ] Database migrations applied (`npm run db:migrate`)
- [ ] Environment variables configured
- [ ] Next.js app deployed or running locally

---

## Step 1: Stripe Account Setup (10 minutes)

### 1.1 Create Stripe Account

1. Go to https://dashboard.stripe.com/register
2. Complete account registration
3. Verify email address
4. Complete business profile (for production)

### 1.2 Get API Keys

**Test Mode (for development):**
1. Navigate to **Developers → API keys**
2. Click "Reveal test key token"
3. Copy **Publishable key** (starts with `pk_test_...`)
4. Copy **Secret key** (starts with `sk_test_...`)

**Live Mode (for production):**
1. Toggle to **Live mode** in top right
2. Complete Stripe account activation
3. Copy **Publishable key** (starts with `pk_live_...`)
4. Copy **Secret key** (starts with `sk_live_...`)

Add to `.env.local`:
```bash
STRIPE_SECRET_KEY=sk_test_...    # or sk_live_... for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # or pk_live_... for production
```

---

## Step 2: Create Products & Prices (5 minutes)

### 2.1 Run Stripe Setup Script

```bash
node scripts/stripe-setup.mjs
```

**Expected Output:**
```
🚀 Setting up Stripe products and prices...

📦 Creating Good Tier product...
✅ Good Product created: prod_xxxxxxxxxxxxx
   ✅ Monthly: price_xxxxxxxxxxxxx ($299 AUD/mo)
   ✅ Annual: price_xxxxxxxxxxxxx ($2990 AUD/yr - saves $598)

🚀 Creating Better Tier product (Most Popular)...
✅ Better Product created: prod_xxxxxxxxxxxxx
   ✅ Monthly: price_xxxxxxxxxxxxx ($449 AUD/mo)
   ✅ Annual: price_xxxxxxxxxxxxx ($4490 AUD/yr - saves $898)

👑 Creating Best Tier product...
✅ Best Product created: prod_xxxxxxxxxxxxx
   ✅ Monthly: price_xxxxxxxxxxxxx ($599 AUD/mo)
   ✅ Annual: price_xxxxxxxxxxxxx ($5990 AUD/yr - saves $1198)

✨ Stripe setup complete!

📋 Add these environment variables to your .env file:

# Stripe Price IDs (Production)
STRIPE_PRICE_GOOD_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_GOOD_ANNUAL=price_xxxxxxxxxxxxx
STRIPE_PRICE_BETTER_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_BETTER_ANNUAL=price_xxxxxxxxxxxxx
STRIPE_PRICE_BEST_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_BEST_ANNUAL=price_xxxxxxxxxxxxx
```

### 2.2 Add Price IDs to Environment

Copy the price IDs from output and add to `.env.local`:

```bash
# Stripe Price IDs
STRIPE_PRICE_GOOD_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_GOOD_ANNUAL=price_xxxxxxxxxxxxx
STRIPE_PRICE_BETTER_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_BETTER_ANNUAL=price_xxxxxxxxxxxxx
STRIPE_PRICE_BEST_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_BEST_ANNUAL=price_xxxxxxxxxxxxx
```

---

## Step 3: Configure Webhook Endpoint (10 minutes)

### 3.1 Deploy Your Application

Before configuring webhooks, deploy your app to get a public URL:

**Option A: Vercel (5 minutes)**
```bash
npm run vercel:deploy:prod
```

**Option B: Local Testing with Stripe CLI**
```bash
# Install Stripe CLI
npm install -g stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

### 3.2 Configure Webhook in Stripe Dashboard

1. Go to **Developers → Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Enter endpoint URL:
   - Production: `https://yourdomain.com/api/webhooks/stripe`
   - Test (local): Use CLI forwarding URL or ngrok
4. Select **API version**: `2024-12-18.acacia` (latest)
5. Select events to listen to:
   - `checkout.session.completed` ✅ (CRITICAL)
   - `invoice.paid` ✅
   - `invoice.payment_failed` ✅
   - `customer.subscription.updated` ✅
   - `customer.subscription.deleted` ✅
   - `customer.subscription.trial_will_end` (optional)
6. Click **Add endpoint**

### 3.3 Get Webhook Secret

After creating the webhook:
1. Click on the newly created webhook endpoint
2. Click **Reveal** next to "Signing secret"
3. Copy the secret (starts with `whsec_...`)
4. Add to `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## Step 4: Database Migration (2 minutes)

### 4.1 Apply Subscription Schema

```bash
npm run db:migrate
```

**Verify tables created:**
```bash
node scripts/db-test.mjs
```

Expected tables:
- ✅ `subscriptions`
- ✅ `payments`
- ✅ `stripe_customers`
- ✅ `tier_access`
- ✅ `approval_tasks`
- ✅ `agent_execution_logs`
- ✅ `webhook_events`
- ✅ `usage_tracking`
- ✅ `subscription_history`
- ✅ `tier_features_reference`

---

## Step 5: Complete Environment Variables (5 minutes)

### 5.1 Full .env.local Template

```bash
# ============================================================================
# Stripe Configuration
# ============================================================================
STRIPE_SECRET_KEY=sk_test_...               # Stripe secret key (test or live)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_...             # Webhook signing secret

# Stripe Price IDs
STRIPE_PRICE_GOOD_MONTHLY=price_...
STRIPE_PRICE_GOOD_ANNUAL=price_...
STRIPE_PRICE_BETTER_MONTHLY=price_...
STRIPE_PRICE_BETTER_ANNUAL=price_...
STRIPE_PRICE_BEST_MONTHLY=price_...
STRIPE_PRICE_BEST_ANNUAL=price_...

# ============================================================================
# Application Configuration
# ============================================================================
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # Your deployed URL

# ============================================================================
# Database (Existing)
# ============================================================================
DATABASE_URL=postgresql://...               # Production: Supabase PostgreSQL
# OR (for local development)
# Database auto-created at: ./data/geo-seo.db

# ============================================================================
# Security (Existing)
# ============================================================================
ENCRYPTION_KEY=your-64-char-hex-key-here    # For credential encryption

# ============================================================================
# AI Services (Existing)
# ============================================================================
QWEN_API_KEY=sk-...                         # Alibaba Cloud Model Studio
ANTHROPIC_API_KEY=sk-ant-...                # Claude AI
OPENAI_API_KEY=sk-...                       # OpenAI GPT
PERPLEXITY_API_KEY=pplx-...                 # Perplexity AI

# ============================================================================
# SEO Tools (Existing)
# ============================================================================
FIRECRAWL_API_KEY=fc-...                    # Firecrawl web scraping
GOOGLE_API_KEY=...                          # Google Lighthouse & Maps

# ============================================================================
# Email Service (Existing)
# ============================================================================
EMAIL_PROVIDER=resend                       # or 'sendgrid'
EMAIL_API_KEY=re_...                        # Resend or SendGrid API key
EMAIL_FROM=noreply@yourdomain.com
```

---

## Step 6: Test Payment Flow (10 minutes)

### 6.1 Test Cards (Test Mode Only)

| Card Number | Behavior |
|-------------|----------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 9995` | Declined (insufficient funds) |
| `4000 0000 0000 0002` | Declined (generic) |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |

Use any future expiry date (e.g., 12/34) and any 3-digit CVC.

### 6.2 Test Signup Flow

1. **Start signup:**
   ```
   Navigate to: http://localhost:3000/pricing
   Click: "Start Good Plan" (or Better/Best)
   ```

2. **Complete onboarding form:**
   - Business Name: Test Company
   - Email: test@example.com
   - Website URL: https://example.com
   - Click "Continue to Payment"

3. **Stripe Checkout:**
   - Should redirect to Stripe Checkout
   - Enter test card: `4242 4242 4242 4242`
   - Enter expiry: `12/34`
   - Enter CVC: `123`
   - Click "Pay"

4. **Verify success:**
   - Should redirect to `/dashboard?session_id=cs_test_...&success=true`
   - Check database for subscription:
   ```bash
   node scripts/check-subscription.mjs test@example.com
   ```

5. **Verify webhook received:**
   ```bash
   # Check webhook_events table
   node scripts/check-webhooks.mjs
   ```

   Expected event: `checkout.session.completed` (processed: true)

### 6.3 Test Tier Access

```bash
# Check tier access granted
node scripts/check-tier-access.mjs test@example.com

# Expected output:
✅ Tier: good
✅ Automation Level: manual
✅ Features: { websites: 1, keywords: 50, audits_per_month: 1 }
✅ Approval Required: true
```

---

## Step 7: Test Upgrade/Downgrade (5 minutes)

### 7.1 Test Upgrade (Good → Better)

```bash
curl -X POST http://localhost:3000/api/subscriptions/update \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "test-client-id",
    "newTier": "better"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully upgraded to better tier. Changes effective immediately.",
  "subscription": {
    "id": "...",
    "oldTier": "good",
    "newTier": "better",
    "billingCycle": "monthly",
    "effectiveDate": "2025-10-12T..."
  }
}
```

### 7.2 Test Downgrade (Better → Good)

Downgrade applies at end of billing period (no immediate charge).

### 7.3 Test Cancellation

```bash
curl -X POST http://localhost:3000/api/subscriptions/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "test-client-id",
    "immediate": false,
    "reason": "Testing cancellation flow"
  }'
```

---

## Step 8: Monitor & Debug (5 minutes)

### 8.1 Stripe Dashboard Monitoring

1. **Payments:** https://dashboard.stripe.com/test/payments
   - View all payment attempts
   - Filter by status (succeeded, failed, pending)

2. **Subscriptions:** https://dashboard.stripe.com/test/subscriptions
   - View all subscriptions
   - Check statuses (active, past_due, canceled)

3. **Webhooks:** https://dashboard.stripe.com/test/webhooks
   - View webhook delivery attempts
   - Check success/failure status
   - Retry failed webhooks

4. **Events:** https://dashboard.stripe.com/test/events
   - View all Stripe events
   - Useful for debugging webhook issues

### 8.2 Application Logs

```bash
# View webhook processing logs
tail -f logs/webhooks.log

# View payment creation logs
tail -f logs/payments.log

# View subscription updates
tail -f logs/subscriptions.log
```

### 8.3 Database Queries

**Check subscription status:**
```sql
SELECT
  c.business_name,
  s.tier,
  s.status,
  s.current_period_end
FROM subscriptions s
INNER JOIN client_onboarding c ON s.client_id = c.id
WHERE s.status = 'active';
```

**Check webhook processing:**
```sql
SELECT
  event_type,
  processed,
  error_message,
  created_at
FROM webhook_events
ORDER BY created_at DESC
LIMIT 10;
```

**Check tier access:**
```sql
SELECT
  c.business_name,
  t.tier,
  t.automation_level,
  t.approval_required
FROM tier_access t
INNER JOIN client_onboarding c ON t.client_id = c.id;
```

---

## Step 9: Production Checklist (Before Going Live)

### 9.1 Stripe Configuration

- [ ] Activate Stripe account (complete business verification)
- [ ] Switch to **Live mode** in Stripe Dashboard
- [ ] Re-run `node scripts/stripe-setup.mjs` with live keys
- [ ] Update `.env.local` with live keys (`sk_live_...`, `pk_live_...`)
- [ ] Configure live webhook endpoint with production URL
- [ ] Update `STRIPE_WEBHOOK_SECRET` with live webhook secret
- [ ] Test live mode with real card (small amount, then refund)

### 9.2 Security

- [ ] Verify `ENCRYPTION_KEY` is strong (64 characters, random)
- [ ] Ensure `.env.local` is in `.gitignore`
- [ ] Enable Stripe Radar for fraud detection
- [ ] Set up 3D Secure authentication for EU cards
- [ ] Review Stripe security best practices

### 9.3 Legal & Compliance

- [ ] Add **Terms of Service** link to pricing page
- [ ] Add **Privacy Policy** link to pricing page
- [ ] Add **Refund Policy** (if applicable)
- [ ] Ensure GDPR compliance (if serving EU customers)
- [ ] Add GST/VAT collection (if required)

### 9.4 Monitoring

- [ ] Set up Stripe webhook alerts (email on failures)
- [ ] Configure Sentry or error tracking
- [ ] Set up subscription renewal reminders
- [ ] Configure payment failure notifications
- [ ] Set up daily subscription health check

### 9.5 Testing

- [ ] Test full signup flow end-to-end
- [ ] Test upgrade flow (Good → Better → Best)
- [ ] Test downgrade flow (Best → Better → Good)
- [ ] Test cancellation (immediate and at period end)
- [ ] Test payment failure handling
- [ ] Test webhook retry on failure
- [ ] Load test checkout API (100 concurrent requests)

---

## Step 10: Go Live! 🚀

### 10.1 Final Steps

1. **Switch to Live Mode:**
   - Update `STRIPE_SECRET_KEY` with live key
   - Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` with live key
   - Update `STRIPE_WEBHOOK_SECRET` with live webhook secret

2. **Deploy to Production:**
   ```bash
   npm run vercel:deploy:prod
   ```

3. **Verify Production:**
   - Visit pricing page: `https://yourdomain.com/pricing`
   - Complete test signup with real card
   - Verify subscription created in Stripe Dashboard
   - Check database for subscription record
   - Verify webhook received and processed

4. **Monitor First Week:**
   - Check webhook success rate (target: 100%)
   - Monitor payment success rate (target: >95%)
   - Watch for failed payments
   - Review error logs daily

---

## Troubleshooting

### Webhook Not Received

**Symptoms:**
- Checkout completes but subscription not activated
- `webhook_events` table empty

**Solutions:**
1. Check webhook endpoint is publicly accessible
2. Verify `STRIPE_WEBHOOK_SECRET` is correct
3. Check Stripe webhook logs for delivery failures
4. Test webhook locally with Stripe CLI:
   ```bash
   stripe trigger checkout.session.completed
   ```

### Payment Fails Silently

**Symptoms:**
- User completes checkout but subscription not created
- No error shown

**Solutions:**
1. Check Stripe Dashboard → Payments for error details
2. Review `payments` table for `status = 'failed'`
3. Check card is not declined (use test cards)
4. Verify price IDs match environment

### Subscription Status Incorrect

**Symptoms:**
- User subscribed but tier_access not granted
- User canceled but still has access

**Solutions:**
1. Check `webhook_events` table for unprocessed events
2. Manually process webhook:
   ```bash
   node scripts/process-webhook.mjs <event_id>
   ```
3. Verify `current_period_end` is correct
4. Check `expires_at` in `tier_access` table

### Upgrade Not Prorated

**Symptoms:**
- User upgraded but not charged difference immediately

**Solutions:**
1. Check Stripe subscription settings → Proration behavior
2. Verify `proration_behavior: 'always_invoice'` in code
3. Review Stripe invoice for proration line items

---

## Support & Resources

### Stripe Documentation
- Getting Started: https://stripe.com/docs/payments
- Subscriptions: https://stripe.com/docs/billing/subscriptions
- Webhooks: https://stripe.com/docs/webhooks
- Testing: https://stripe.com/docs/testing

### Code References
- Pricing Page: [`app/pricing/page.tsx`](app/pricing/page.tsx)
- Checkout API: [`app/api/payments/create-checkout-session/route.ts`](app/api/payments/create-checkout-session/route.ts)
- Webhook Handler: [`app/api/webhooks/stripe/route.ts`](app/api/webhooks/stripe/route.ts)
- Tier Access: [`app/api/tier/check-access/route.ts`](app/api/tier/check-access/route.ts)
- Database Schema: [`database/subscriptions-schema.sql`](database/subscriptions-schema.sql)

### Need Help?
- Stripe Support: https://support.stripe.com
- Stripe Community: https://stripe.com/community

---

## Summary

You now have a **production-ready tier-based subscription system** with:

✅ 3 pricing tiers (Good, Better, Best) with monthly/annual billing
✅ Stripe Checkout integration
✅ Webhook handling for subscription lifecycle
✅ Automatic tier access granting
✅ Upgrade/downgrade functionality
✅ Payment retry and failure handling
✅ Usage tracking and limits
✅ Approval workflows per tier
✅ Comprehensive logging and monitoring

**Total Setup Time:** ~45 minutes
**Monthly Stripe Fee:** 2.9% + $0.30 per transaction
**First Payment:** $299 AUD (Good tier, monthly)

**Next Steps:**
1. Complete MCP server integration for AI agents
2. Build autonomous approval workflow UI
3. Implement agent scheduler
4. Create admin dashboard
5. Launch! 🚀
