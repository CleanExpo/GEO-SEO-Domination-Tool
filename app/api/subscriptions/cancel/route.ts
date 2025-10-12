/**
 * Subscription Cancellation API
 *
 * POST /api/subscriptions/cancel
 *
 * Cancels a subscription at the end of the current billing period
 * Does NOT immediately revoke access - user retains access until period ends
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import Database from 'better-sqlite3';
import path from 'path';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');

interface CancelRequest {
  clientId: string;
  immediate?: boolean; // If true, cancel immediately. Default: false (cancel at period end)
  reason?: string;
}

export async function POST(request: NextRequest) {
  const db = new Database(dbPath);

  try {
    const body: CancelRequest = await request.json();
    const { clientId, immediate = false, reason } = body;

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId required' },
        { status: 400 }
      );
    }

    // Get active subscription
    const subscription = db.prepare(`
      SELECT s.id, s.tier, s.current_period_end
      FROM subscriptions s
      WHERE s.client_id = ? AND s.status = 'active'
    `).get(clientId) as any;

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Get Stripe subscription ID
    const stripeCustomer = db.prepare(`
      SELECT stripe_subscription_id FROM stripe_customers WHERE client_id = ?
    `).get(clientId) as any;

    if (!stripeCustomer || !stripeCustomer.stripe_subscription_id) {
      return NextResponse.json(
        { success: false, error: 'Stripe subscription not found' },
        { status: 404 }
      );
    }

    // Cancel Stripe subscription
    let stripeSubscription: Stripe.Subscription;

    if (immediate) {
      // Cancel immediately
      stripeSubscription = await stripe.subscriptions.cancel(stripeCustomer.stripe_subscription_id);

      // Update database immediately
      db.prepare(`
        UPDATE subscriptions
        SET status = 'canceled', canceled_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).run(subscription.id);

      // Set tier access expiration to now
      db.prepare(`
        UPDATE tier_access SET expires_at = datetime('now') WHERE client_id = ?
      `).run(clientId);

      // Update client status
      db.prepare(`
        UPDATE client_onboarding SET status = 'canceled', updated_at = datetime('now') WHERE id = ?
      `).run(clientId);

    } else {
      // Cancel at period end
      stripeSubscription = await stripe.subscriptions.update(stripeCustomer.stripe_subscription_id, {
        cancel_at_period_end: true,
        cancellation_details: {
          comment: reason || 'User requested cancellation'
        }
      });

      // Update database to mark for cancellation
      db.prepare(`
        UPDATE subscriptions
        SET cancel_at_period_end = TRUE, updated_at = datetime('now')
        WHERE id = ?
      `).run(subscription.id);

      // Set tier access expiration to period end
      db.prepare(`
        UPDATE tier_access SET expires_at = ? WHERE client_id = ?
      `).run(subscription.current_period_end, clientId);
    }

    // Log cancellation
    const historyId = generateId();
    db.prepare(`
      INSERT INTO subscription_history (
        id, subscription_id, client_id, event_type, old_status, new_status, reason
      ) VALUES (?, ?, ?, 'canceled', 'active', 'canceled', ?)
    `).run(historyId, subscription.id, clientId, reason || 'User requested cancellation');

    console.log(`[Subscriptions] Subscription ${subscription.id} canceled for client ${clientId} (${immediate ? 'immediate' : 'at period end'})`);

    return NextResponse.json({
      success: true,
      message: immediate
        ? 'Subscription canceled immediately. Access revoked.'
        : 'Subscription will be canceled at the end of your billing period. You retain access until then.',
      subscription: {
        id: subscription.id,
        status: immediate ? 'canceled' : 'active',
        cancelAtPeriodEnd: !immediate,
        accessEndsAt: immediate ? new Date().toISOString() : subscription.current_period_end
      }
    });

  } catch (error: any) {
    console.error('[Subscriptions] Cancel error:', error);

    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { success: false, error: 'Failed to cancel Stripe subscription: ' + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
}
