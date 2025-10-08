#!/usr/bin/env node

/**
 * Quick database check and initialization
 */

import { db } from '../database/init.ts';

async function checkDatabase() {
  try {
    console.log('🔍 Checking database...\n');

    // Check if key tables exist
    const tables = [
      'companies',
      'saved_onboarding',
      'subscription_tiers',
      'client_subscriptions',
      'task_execution_calendar'
    ];

    for (const table of tables) {
      try {
        const result = await db.get(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ ${table}: ${result.count} rows`);
      } catch (error) {
        console.log(`❌ ${table}: NOT FOUND`);
      }
    }

    // Check subscription tiers
    console.log('\n📊 Subscription Tiers:');
    try {
      const tiers = await db.all(`SELECT name, monthly_price_usd FROM subscription_tiers`);
      if (tiers.length === 0) {
        console.log('⚠️  No tiers found - database may need initialization');
      } else {
        tiers.forEach(tier => {
          console.log(`  - ${tier.name}: $${tier.monthly_price_usd}`);
        });
      }
    } catch (error) {
      console.log('❌ subscription_tiers table not found');
    }

    console.log('\n✅ Database check complete');

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await db.close();
  }
}

checkDatabase();
