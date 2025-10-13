/**
 * Subscription Update API (Upgrade/Downgrade)
 *
 * POST /api/subscriptions/update
 *
 * Changes subscription tier (upgrade or downgrade)
 * Upgrades: Prorated immediately
 * Downgrades: Apply at end of current billing period
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

const dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');

interface UpdateRequest {
  clientId: string;
  newTier: 'good' | 'better' | 'best';
  billingCycle?: 'monthly' | 'annual'; // Optional: change billing cycle
}

export async function POST(request: NextRequest) {
  const db = new Database(dbPath);

  try {
    const body: UpdateRequest = await request.json();
    const { clientId, newTier, billingCycle } = body;

    if (!clientId || !newTier) {
      return NextResponse.json(
        { success: false, error: 'clientId and newTier required' },
        { status: 400 }
      );
    }

    if (!['good', 'better', 'best'].includes(newTier)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tier. Must be: good, better, or best' },
        { status: 400 }
      );
    }

    // Get current subscription
    const subscription = db.prepare(`
      SELECT s.id, s.tier, s.billing_cycle, s.status
      FROM subscriptions s
      WHERE s.client_id = ? AND s.status = 'active'
    `).get(clientId) as any;

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Check if already on target tier
    if (subscription.tier === newTier && (!billingCycle || billingCycle === subscription.billing_cycle)) {
      return NextResponse.json(
        { success: false, error: `Already subscribed to ${newTier} tier` },
        { status: 400 }
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

    // Get target Stripe price ID
    const targetBillingCycle = billingCycle || subscription.billing_cycle;
    const priceMap = {
      good: {
        monthly: process.env.STRIPE_PRICE_GOOD_MONTHLY!,
        annual: process.env.STRIPE_PRICE_GOOD_ANNUAL!
      },
      better: {
        monthly: process.env.STRIPE_PRICE_BETTER_MONTHLY!,
        annual: process.env.STRIPE_PRICE_BETTER_ANNUAL!
      },
      best: {
        monthly: process.env.STRIPE_PRICE_BEST_MONTHLY!,
        annual: process.env.STRIPE_PRICE_BEST_ANNUAL!
      }
    };

    const newPriceId = priceMap[newTier][targetBillingCycle];

    if (!newPriceId) {
      return NextResponse.json(
        { success: false, error: 'Price ID not configured for target tier and billing cycle' },
        { status: 500 }
      );
    }

    // Determine if upgrade or downgrade
    const tierOrder = { good: 1, better: 2, best: 3 };
    const isUpgrade = tierOrder[newTier] > tierOrder[subscription.tier];

    // Get current Stripe subscription
    const stripe = getStripe();
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeCustomer.stripe_subscription_id);

    // Update Stripe subscription
    const updatedStripeSubscription = await stripe.subscriptions.update(stripeSubscription.id, {
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: newPriceId
        }
      ],
      proration_behavior: isUpgrade ? 'always_invoice' : 'none', // Prorate upgrades immediately, downgrades at period end
      billing_cycle_anchor: isUpgrade ? 'now' : 'unchanged',
      metadata: {
        clientId,
        tier: newTier,
        automationLevel: getAutomationLevel(newTier)
      }
    });

    // Update database subscription
    db.prepare(`
      UPDATE subscriptions
      SET tier = ?, billing_cycle = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newTier, targetBillingCycle, subscription.id);

    // Update tier access
    const newFeatures = getTierFeatures(newTier);
    const newAutomationLevel = getAutomationLevel(newTier);
    const approvalRequired = newTier !== 'best';

    db.prepare(`
      UPDATE tier_access
      SET tier = ?, features = ?, automation_level = ?, approval_required = ?, expires_at = NULL
      WHERE client_id = ?
    `).run(newTier, JSON.stringify(newFeatures), newAutomationLevel, approvalRequired, clientId);

    // Update client tier
    db.prepare(`
      UPDATE client_onboarding SET tier = ?, updated_at = datetime('now') WHERE id = ?
    `).run(newTier, clientId);

    // Log change
    const historyId = generateId();
    const eventType = isUpgrade ? 'upgraded' : 'downgraded';
    db.prepare(`
      INSERT INTO subscription_history (
        id, subscription_id, client_id, event_type, old_tier, new_tier, old_status, new_status
      ) VALUES (?, ?, ?, ?, ?, ?, 'active', 'active')
    `).run(historyId, subscription.id, clientId, eventType, subscription.tier, newTier);

    console.log(`[Subscriptions] Subscription ${subscription.id} ${eventType} from ${subscription.tier} to ${newTier}`);

    // Type assertion for current_period_end which may not be in Response type
    const currentPeriodEnd = (updatedStripeSubscription as any).current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    return NextResponse.json({
      success: true,
      message: isUpgrade
        ? `Successfully upgraded to ${newTier} tier. Changes effective immediately.`
        : `Successfully downgraded to ${newTier} tier. Changes will apply at the end of your current billing period.`,
      subscription: {
        id: subscription.id,
        oldTier: subscription.tier,
        newTier,
        billingCycle: targetBillingCycle,
        effectiveDate: isUpgrade ? new Date().toISOString() : new Date(currentPeriodEnd * 1000).toISOString()
      }
    });

  } catch (error: any) {
    console.error('[Subscriptions] Update error:', error);

    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { success: false, error: 'Failed to update Stripe subscription: ' + error.message },
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
