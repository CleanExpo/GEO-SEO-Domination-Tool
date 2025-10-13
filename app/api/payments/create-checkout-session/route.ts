/**
 * Stripe Checkout Session Creation
 *
 * POST /api/payments/create-checkout-session
 *
 * Creates a Stripe Checkout session for tier-based subscription signup
 * Redirects to Stripe for payment, then returns to /dashboard on success
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

interface CheckoutRequest {
  clientId: string;
  tier: 'good' | 'better' | 'best';
  billingCycle: 'monthly' | 'annual';
}

export async function POST(request: NextRequest) {
  const db = new Database(dbPath);

  try {
    const body: CheckoutRequest = await request.json();
    const { clientId, tier, billingCycle } = body;

    // Validate required fields
    if (!clientId || !tier || !billingCycle) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: clientId, tier, billingCycle' },
        { status: 400 }
      );
    }

    // Validate tier
    if (!['good', 'better', 'best'].includes(tier)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tier. Must be: good, better, or best' },
        { status: 400 }
      );
    }

    // Validate billing cycle
    if (!['monthly', 'annual'].includes(billingCycle)) {
      return NextResponse.json(
        { success: false, error: 'Invalid billingCycle. Must be: monthly or annual' },
        { status: 400 }
      );
    }

    // Get client details
    const client = db.prepare(`
      SELECT id, business_name, email, website_url
      FROM client_onboarding
      WHERE id = ?
    `).get(clientId) as any;

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check if client already has active subscription
    const existingSubscription = db.prepare(`
      SELECT id, tier, status FROM subscriptions WHERE client_id = ? AND status = 'active'
    `).get(clientId) as any;

    if (existingSubscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client already has an active subscription',
          currentTier: existingSubscription.tier
        },
        { status: 409 }
      );
    }

    // Get Stripe price IDs from environment
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

    const priceId = priceMap[tier][billingCycle];

    if (!priceId) {
      return NextResponse.json(
        { success: false, error: 'Stripe price ID not configured for this tier and billing cycle' },
        { status: 500 }
      );
    }

    // Check if Stripe customer exists
    let stripeCustomerId: string;
    const existingStripeCustomer = db.prepare(`
      SELECT stripe_customer_id FROM stripe_customers WHERE client_id = ?
    `).get(clientId) as any;

    if (existingStripeCustomer) {
      stripeCustomerId = existingStripeCustomer.stripe_customer_id;
    } else {
      // Create Stripe customer
      const stripe = getStripe();
      const stripeCustomer = await stripe.customers.create({
        email: client.email,
        name: client.business_name,
        metadata: {
          clientId,
          websiteUrl: client.website_url || ''
        }
      });

      stripeCustomerId = stripeCustomer.id;

      // Save to database
      db.prepare(`
        INSERT INTO stripe_customers (id, client_id, stripe_customer_id, email)
        VALUES (?, ?, ?, ?)
      `).run(generateId(), clientId, stripeCustomerId, client.email);
    }

    // Create Stripe Checkout session
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?tier=${tier}&canceled=true`,
      metadata: {
        clientId,
        tier,
        billingCycle,
        websiteUrl: client.website_url || ''
      },
      subscription_data: {
        metadata: {
          clientId,
          tier,
          automationLevel: getAutomationLevel(tier)
        },
        trial_period_days: 0 // No trial for now
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto'
      }
    });

    // Update client status to pending_payment
    db.prepare(`
      UPDATE client_onboarding
      SET status = 'pending_payment', updated_at = datetime('now')
      WHERE id = ?
    `).run(clientId);

    console.log(`[Payments] Checkout session created: ${session.id} for client ${clientId} (${tier} - ${billingCycle})`);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      message: 'Checkout session created successfully'
    });

  } catch (error: any) {
    console.error('[Payments] Error creating checkout session:', error);

    // Handle Stripe-specific errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { success: false, error: 'Payment failed. Please check your card details.' },
        { status: 400 }
      );
    }

    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { success: false, error: 'Invalid payment request. Please contact support.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
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
