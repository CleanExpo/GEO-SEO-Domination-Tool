/**
 * Stripe Setup Script
 *
 * Creates Stripe products and prices for all tiers
 * Run once during initial deployment
 *
 * Usage:
 *   node scripts/stripe-setup.mjs
 *
 * Outputs:
 *   - Product IDs
 *   - Price IDs (to add to .env)
 */

import Stripe from 'stripe';
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe products and prices...\n');

  const priceIds = {};

  try {
    // ============================================================================
    // Good Tier ($299 AUD/month)
    // ============================================================================
    console.log('📦 Creating Good Tier product...');
    const goodProduct = await stripe.products.create({
      name: 'Good - SEO Automation',
      description: 'Manual AI recommendations for small businesses getting started with SEO automation',
      metadata: {
        tier: 'good',
        automationLevel: 'manual',
        websites: '1',
        keywords: '50',
        audits_per_month: '1'
      },
      images: [], // TODO: Add product image URLs
      active: true
    });

    console.log(`✅ Good Product created: ${goodProduct.id}`);

    // Monthly price
    const goodMonthly = await stripe.prices.create({
      product: goodProduct.id,
      unit_amount: 29900, // $299 AUD in cents
      currency: 'aud',
      recurring: {
        interval: 'month',
        interval_count: 1
      },
      metadata: {
        tier: 'good',
        billingCycle: 'monthly'
      },
      nickname: 'Good - Monthly'
    });

    priceIds.STRIPE_PRICE_GOOD_MONTHLY = goodMonthly.id;
    console.log(`   ✅ Monthly: ${goodMonthly.id} ($299 AUD/mo)`);

    // Annual price (17% discount)
    const goodAnnual = await stripe.prices.create({
      product: goodProduct.id,
      unit_amount: 299000, // $2990 AUD in cents (saves $598)
      currency: 'aud',
      recurring: {
        interval: 'year',
        interval_count: 1
      },
      metadata: {
        tier: 'good',
        billingCycle: 'annual',
        discount: '17%'
      },
      nickname: 'Good - Annual'
    });

    priceIds.STRIPE_PRICE_GOOD_ANNUAL = goodAnnual.id;
    console.log(`   ✅ Annual: ${goodAnnual.id} ($2990 AUD/yr - saves $598)\n`);

    // ============================================================================
    // Better Tier ($449 AUD/month) - MOST POPULAR
    // ============================================================================
    console.log('🚀 Creating Better Tier product (Most Popular)...');
    const betterProduct = await stripe.products.create({
      name: 'Better - SEO Automation (Most Popular)',
      description: 'Semi-autonomous automation for growing businesses with 5 websites and 500 keywords',
      metadata: {
        tier: 'better',
        automationLevel: 'semi_autonomous',
        websites: '5',
        keywords: '500',
        audits_per_month: '4',
        popular: 'true'
      },
      images: [],
      active: true
    });

    console.log(`✅ Better Product created: ${betterProduct.id}`);

    // Monthly price
    const betterMonthly = await stripe.prices.create({
      product: betterProduct.id,
      unit_amount: 44900, // $449 AUD in cents
      currency: 'aud',
      recurring: {
        interval: 'month',
        interval_count: 1
      },
      metadata: {
        tier: 'better',
        billingCycle: 'monthly',
        popular: 'true'
      },
      nickname: 'Better - Monthly'
    });

    priceIds.STRIPE_PRICE_BETTER_MONTHLY = betterMonthly.id;
    console.log(`   ✅ Monthly: ${betterMonthly.id} ($449 AUD/mo)`);

    // Annual price (17% discount)
    const betterAnnual = await stripe.prices.create({
      product: betterProduct.id,
      unit_amount: 449000, // $4490 AUD in cents (saves $898)
      currency: 'aud',
      recurring: {
        interval: 'year',
        interval_count: 1
      },
      metadata: {
        tier: 'better',
        billingCycle: 'annual',
        discount: '17%'
      },
      nickname: 'Better - Annual'
    });

    priceIds.STRIPE_PRICE_BETTER_ANNUAL = betterAnnual.id;
    console.log(`   ✅ Annual: ${betterAnnual.id} ($4490 AUD/yr - saves $898)\n`);

    // ============================================================================
    // Best Tier ($599 AUD/month)
    // ============================================================================
    console.log('👑 Creating Best Tier product...');
    const bestProduct = await stripe.products.create({
      name: 'Best - SEO Automation',
      description: 'Full AI autopilot for enterprises with unlimited websites, keywords, and autonomous execution',
      metadata: {
        tier: 'best',
        automationLevel: 'full_autopilot',
        websites: 'unlimited',
        keywords: 'unlimited',
        audits_per_month: 'unlimited'
      },
      images: [],
      active: true
    });

    console.log(`✅ Best Product created: ${bestProduct.id}`);

    // Monthly price
    const bestMonthly = await stripe.prices.create({
      product: bestProduct.id,
      unit_amount: 59900, // $599 AUD in cents
      currency: 'aud',
      recurring: {
        interval: 'month',
        interval_count: 1
      },
      metadata: {
        tier: 'best',
        billingCycle: 'monthly'
      },
      nickname: 'Best - Monthly'
    });

    priceIds.STRIPE_PRICE_BEST_MONTHLY = bestMonthly.id;
    console.log(`   ✅ Monthly: ${bestMonthly.id} ($599 AUD/mo)`);

    // Annual price (17% discount)
    const bestAnnual = await stripe.prices.create({
      product: bestProduct.id,
      unit_amount: 599000, // $5990 AUD in cents (saves $1198)
      currency: 'aud',
      recurring: {
        interval: 'year',
        interval_count: 1
      },
      metadata: {
        tier: 'best',
        billingCycle: 'annual',
        discount: '17%'
      },
      nickname: 'Best - Annual'
    });

    priceIds.STRIPE_PRICE_BEST_ANNUAL = bestAnnual.id;
    console.log(`   ✅ Annual: ${bestAnnual.id} ($5990 AUD/yr - saves $1198)\n`);

    // ============================================================================
    // Output Summary
    // ============================================================================
    console.log('✨ Stripe setup complete!\n');
    console.log('📋 Add these environment variables to your .env file:\n');
    console.log('# Stripe Price IDs (Production)');
    Object.entries(priceIds).forEach(([key, value]) => {
      console.log(`${key}=${value}`);
    });

    console.log('\n💡 Next steps:');
    console.log('1. Copy the environment variables above to your .env.local file');
    console.log('2. Configure webhook endpoint in Stripe Dashboard:');
    console.log('   https://dashboard.stripe.com/webhooks');
    console.log('   Endpoint URL: https://yourdomain.com/api/webhooks/stripe');
    console.log('3. Subscribe to webhook events:');
    console.log('   - checkout.session.completed');
    console.log('   - invoice.paid');
    console.log('   - invoice.payment_failed');
    console.log('   - customer.subscription.updated');
    console.log('   - customer.subscription.deleted');
    console.log('4. Copy webhook secret to STRIPE_WEBHOOK_SECRET in .env.local');
    console.log('\n🧪 Test mode:');
    console.log('   To test payments, use Stripe test card: 4242 4242 4242 4242');
    console.log('   https://stripe.com/docs/testing');

  } catch (error) {
    console.error('❌ Error setting up Stripe:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run setup
setupStripeProducts().catch(console.error);
