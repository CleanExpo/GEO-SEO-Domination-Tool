/**
 * Stripe Webhook Handler
 *
 * POST /api/webhooks/stripe
 *
 * Handles Stripe webhook events for subscription lifecycle:
 * - checkout.session.completed → Activate subscription
 * - invoice.paid → Record payment
 * - invoice.payment_failed → Handle failure
 * - customer.subscription.updated → Update subscription
 * - customer.subscription.deleted → Cancel subscription
 *
 * CRITICAL: Webhook signature verification prevents unauthorized requests
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import Database from 'better-sqlite3';
import path from 'path';

// Lazy initialization - only create Stripe instance when needed
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-09-30.clover',
  });
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');

export async function POST(request: NextRequest) {
  const db = new Database(dbPath);

  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[Stripe Webhook] Missing signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const stripe = getStripe();
    let event: Stripe.Event;
    try {
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET not configured');
      }
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

    // Check if event already processed (idempotency)
    const existingEvent = db.prepare(`
      SELECT id FROM webhook_events WHERE stripe_event_id = ?
    `).get(event.id) as any;

    if (existingEvent) {
      console.log(`[Stripe Webhook] Event ${event.id} already processed`);
      return NextResponse.json({ received: true, message: 'Event already processed' });
    }

    // Log webhook event
    const eventId = generateId();
    db.prepare(`
      INSERT INTO webhook_events (id, event_type, stripe_event_id, payload, processed)
      VALUES (?, ?, ?, ?, FALSE)
    `).run(eventId, event.type, event.id, JSON.stringify(event.data.object));

    // Handle event
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutComplete(db, event.data.object as Stripe.Checkout.Session);
          break;

        case 'invoice.paid':
          await handleInvoicePaid(db, event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await handlePaymentFailed(db, event.data.object as Stripe.Invoice);
          break;

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(db, event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionCanceled(db, event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.trial_will_end':
          await handleTrialWillEnd(db, event.data.object as Stripe.Subscription);
          break;

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }

      // Mark event as processed
      db.prepare(`
        UPDATE webhook_events SET processed = TRUE, processed_at = datetime('now') WHERE id = ?
      `).run(eventId);

      console.log(`[Stripe Webhook] Event ${event.id} processed successfully`);

      return NextResponse.json({ received: true });

    } catch (error: any) {
      console.error(`[Stripe Webhook] Error processing event ${event.id}:`, error);

      // Update webhook event with error
      db.prepare(`
        UPDATE webhook_events SET error_message = ?, retry_count = retry_count + 1 WHERE id = ?
      `).run(error.message, eventId);

      return NextResponse.json({ error: 'Event processing failed' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[Stripe Webhook] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    db.close();
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

async function handleCheckoutComplete(db: Database.Database, session: Stripe.Checkout.Session) {
  const { clientId, tier, billingCycle } = session.metadata!;

  console.log(`[Webhook] Checkout complete for client ${clientId} - ${tier} (${billingCycle})`);

  // 1. Create subscription record
  const subscriptionId = generateId();
  const now = new Date();
  const periodEnd = new Date(now.getTime() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000);

  db.prepare(`
    INSERT INTO subscriptions (
      id, client_id, tier, billing_cycle, status,
      current_period_start, current_period_end, created_at
    ) VALUES (?, ?, ?, ?, 'active', datetime('now'), ?, datetime('now'))
  `).run(subscriptionId, clientId, tier, billingCycle, periodEnd.toISOString());

  // 2. Update Stripe customer mapping
  db.prepare(`
    UPDATE stripe_customers
    SET stripe_subscription_id = ?, updated_at = datetime('now')
    WHERE client_id = ?
  `).run(session.subscription, clientId);

  // 3. Grant tier access
  const features = getTierFeatures(tier);
  const automationLevel = getAutomationLevel(tier);
  const approvalRequired = tier !== 'best';

  const tierAccessId = generateId();
  db.prepare(`
    INSERT INTO tier_access (
      id, client_id, tier, features, automation_level, approval_required, granted_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(tierAccessId, clientId, tier, JSON.stringify(features), automationLevel, approvalRequired);

  // 4. Update client status
  db.prepare(`
    UPDATE client_onboarding SET status = 'active', tier = ?, updated_at = datetime('now') WHERE id = ?
  `).run(tier, clientId);

  // 5. Initialize usage tracking
  const usageMetrics = ['websites', 'keywords', 'audits', 'api_calls'];
  const periodStart = now.toISOString();
  const periodEndStr = periodEnd.toISOString();

  usageMetrics.forEach(metric => {
    const usageId = generateId();
    db.prepare(`
      INSERT INTO usage_tracking (id, client_id, period_start, period_end, metric_type, metric_value, limit_value)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(usageId, clientId, periodStart, periodEndStr, metric, features[metric] || null);
  });

  // 6. Log subscription history
  const historyId = generateId();
  db.prepare(`
    INSERT INTO subscription_history (
      id, subscription_id, client_id, event_type, new_tier, new_status
    ) VALUES (?, ?, ?, 'created', ?, 'active')
  `).run(historyId, subscriptionId, clientId, tier);

  console.log(`[Webhook] Subscription ${subscriptionId} activated for client ${clientId}`);

  // 7. Initialize AI agents (asynchronous - don't await)
  initializeAgents(clientId, tier).catch(err => {
    console.error(`[Webhook] Error initializing agents for ${clientId}:`, err);
  });

  // 8. Send welcome email (asynchronous)
  sendWelcomeEmail(clientId, tier).catch(err => {
    console.error(`[Webhook] Error sending welcome email to ${clientId}:`, err);
  });
}

async function handleInvoicePaid(db: Database.Database, invoice: Stripe.Invoice) {
  // Type assertion for Invoice properties that may be expandable in newer API versions
  const invoiceAny = invoice as any;
  const subscriptionId = typeof invoiceAny.subscription === 'string' ? invoiceAny.subscription : invoiceAny.subscription?.id;
  const amount = invoice.amount_paid / 100; // Convert cents to dollars
  const currency = invoice.currency.toUpperCase();

  console.log(`[Webhook] Invoice paid: ${invoice.id} - ${currency} ${amount}`);

  // Get client from subscription
  const stripeCustomer = db.prepare(`
    SELECT client_id FROM stripe_customers WHERE stripe_subscription_id = ?
  `).get(subscriptionId) as any;

  if (!stripeCustomer) {
    console.error(`[Webhook] No client found for subscription ${subscriptionId}`);
    return;
  }

  const clientId = stripeCustomer.client_id;

  // Record payment
  const paymentId = generateId();
  const paymentIntentId = typeof invoiceAny.payment_intent === 'string' ? invoiceAny.payment_intent : invoiceAny.payment_intent?.id;

  db.prepare(`
    INSERT INTO payments (
      id, subscription_id, client_id, amount, currency, status,
      stripe_payment_intent_id, stripe_invoice_id, paid_at
    ) VALUES (?, ?, ?, ?, ?, 'succeeded', ?, ?, datetime('now'))
  `).run(
    paymentId,
    subscriptionId,
    clientId,
    amount,
    currency,
    paymentIntentId,
    invoice.id
  );

  // Update subscription period (if invoice has period)
  if (invoice.lines && invoice.lines.data.length > 0) {
    const line = invoice.lines.data[0];
    if (line.period) {
      const periodStart = new Date(line.period.start * 1000).toISOString();
      const periodEnd = new Date(line.period.end * 1000).toISOString();

      db.prepare(`
        UPDATE subscriptions
        SET current_period_start = ?, current_period_end = ?, updated_at = datetime('now')
        WHERE id = (SELECT id FROM subscriptions WHERE client_id = ? AND status = 'active')
      `).run(periodStart, periodEnd, clientId);
    }
  }

  console.log(`[Webhook] Payment ${paymentId} recorded for client ${clientId}`);
}

async function handlePaymentFailed(db: Database.Database, invoice: Stripe.Invoice) {
  // Type assertion for Invoice properties that may be expandable in newer API versions
  const invoiceAny = invoice as any;
  const subscriptionId = typeof invoiceAny.subscription === 'string' ? invoiceAny.subscription : invoiceAny.subscription?.id;

  console.log(`[Webhook] Payment failed: ${invoice.id}`);

  // Get client from subscription
  const stripeCustomer = db.prepare(`
    SELECT client_id FROM stripe_customers WHERE stripe_subscription_id = ?
  `).get(subscriptionId) as any;

  if (!stripeCustomer) {
    console.error(`[Webhook] No client found for subscription ${subscriptionId}`);
    return;
  }

  const clientId = stripeCustomer.client_id;

  // Record failed payment
  const paymentId = generateId();
  db.prepare(`
    INSERT INTO payments (
      id, subscription_id, client_id, amount, currency, status,
      stripe_invoice_id, failure_reason
    ) VALUES (?, ?, ?, ?, ?, 'failed', ?, ?)
  `).run(
    paymentId,
    subscriptionId,
    clientId,
    (invoice.amount_due || 0) / 100,
    invoice.currency.toUpperCase(),
    invoice.id,
    'Payment failed - card declined or insufficient funds'
  );

  // Update subscription status to past_due
  db.prepare(`
    UPDATE subscriptions SET status = 'past_due', updated_at = datetime('now')
    WHERE id = (SELECT id FROM subscriptions WHERE client_id = ? AND status = 'active')
  `).run(clientId);

  // Send payment failure notification
  sendPaymentFailedEmail(clientId).catch(err => {
    console.error(`[Webhook] Error sending payment failed email to ${clientId}:`, err);
  });

  console.log(`[Webhook] Subscription for client ${clientId} marked as past_due`);
}

async function handleSubscriptionUpdated(db: Database.Database, subscription: Stripe.Subscription) {
  const metadata = subscription.metadata;
  const clientId = metadata.clientId;

  if (!clientId) {
    console.error('[Webhook] No clientId in subscription metadata');
    return;
  }

  console.log(`[Webhook] Subscription updated: ${subscription.id} for client ${clientId}`);

  // Type assertion for Subscription properties that exist in runtime but may have type issues
  const currentPeriodStart = (subscription as any).current_period_start || subscription.billing_cycle_anchor || Math.floor(Date.now() / 1000);
  const currentPeriodEnd = (subscription as any).current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

  // Update subscription in database
  db.prepare(`
    UPDATE subscriptions
    SET
      status = ?,
      current_period_start = ?,
      current_period_end = ?,
      cancel_at_period_end = ?,
      updated_at = datetime('now')
    WHERE client_id = ? AND status IN ('active', 'past_due')
  `).run(
    subscription.status,
    new Date(currentPeriodStart * 1000).toISOString(),
    new Date(currentPeriodEnd * 1000).toISOString(),
    subscription.cancel_at_period_end ? 1 : 0,
    clientId
  );
}

async function handleSubscriptionCanceled(db: Database.Database, subscription: Stripe.Subscription) {
  const metadata = subscription.metadata;
  const clientId = metadata.clientId;

  if (!clientId) {
    console.error('[Webhook] No clientId in subscription metadata');
    return;
  }

  console.log(`[Webhook] Subscription canceled: ${subscription.id} for client ${clientId}`);

  // Update subscription status
  db.prepare(`
    UPDATE subscriptions
    SET status = 'canceled', canceled_at = datetime('now'), updated_at = datetime('now')
    WHERE client_id = ?
  `).run(clientId);

  // Type assertion for current_period_end
  const currentPeriodEnd = (subscription as any).current_period_end || Math.floor(Date.now() / 1000);

  // Set tier access expiration
  db.prepare(`
    UPDATE tier_access SET expires_at = ? WHERE client_id = ?
  `).run(new Date(currentPeriodEnd * 1000).toISOString(), clientId);

  // Update client status
  db.prepare(`
    UPDATE client_onboarding SET status = 'canceled', updated_at = datetime('now') WHERE id = ?
  `).run(clientId);

  // Send cancellation confirmation
  sendCancellationEmail(clientId).catch(err => {
    console.error(`[Webhook] Error sending cancellation email to ${clientId}:`, err);
  });
}

async function handleTrialWillEnd(db: Database.Database, subscription: Stripe.Subscription) {
  const metadata = subscription.metadata;
  const clientId = metadata.clientId;

  if (!clientId) {
    console.error('[Webhook] No clientId in subscription metadata');
    return;
  }

  console.log(`[Webhook] Trial will end: ${subscription.id} for client ${clientId}`);

  // Send trial ending notification
  sendTrialEndingEmail(clientId, subscription.trial_end!).catch(err => {
    console.error(`[Webhook] Error sending trial ending email to ${clientId}:`, err);
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

function getTierFeatures(tier: string): any {
  const featuresMap: Record<string, any> = {
    good: {
      websites: 1,
      audits_per_month: 1,
      keywords: 50,
      competitors: 2,
      backlinks_limit: 100,
      ai_recommendations: true,
      scheduled_reports: false,
      auto_publishing: false
    },
    better: {
      websites: 5,
      audits_per_month: 4,
      keywords: 500,
      competitors: 10,
      backlinks_limit: 10000,
      ai_recommendations: true,
      scheduled_reports: true,
      auto_publishing: false,
      ai_content_generation: true
    },
    best: {
      websites: -1, // unlimited
      audits_per_month: -1,
      keywords: -1,
      competitors: -1,
      backlinks_limit: -1,
      ai_recommendations: true,
      scheduled_reports: true,
      auto_publishing: true,
      ai_content_generation: true,
      ai_swarm_coordination: true
    }
  };

  return featuresMap[tier] || featuresMap.good;
}

function getAutomationLevel(tier: string): string {
  const automationMap: Record<string, string> = {
    good: 'manual',
    better: 'semi_autonomous',
    best: 'full_autopilot',
    custom: 'custom'
  };
  return automationMap[tier] || 'manual';
}

// Placeholder functions for async operations
async function initializeAgents(clientId: string, tier: string) {
  console.log(`[Agents] Initializing agents for client ${clientId} (${tier})`);
  // TODO: Implement agent initialization
  // - Schedule first SEO audit
  // - Initialize keyword tracking
  // - Set up automated reports
}

async function sendWelcomeEmail(clientId: string, tier: string) {
  console.log(`[Email] Sending welcome email to client ${clientId}`);
  // TODO: Implement welcome email
}

async function sendPaymentFailedEmail(clientId: string) {
  console.log(`[Email] Sending payment failed email to client ${clientId}`);
  // TODO: Implement payment failed email
}

async function sendCancellationEmail(clientId: string) {
  console.log(`[Email] Sending cancellation email to client ${clientId}`);
  // TODO: Implement cancellation email
}

async function sendTrialEndingEmail(clientId: string, trialEnd: number) {
  console.log(`[Email] Sending trial ending email to client ${clientId}`);
  // TODO: Implement trial ending email
}
