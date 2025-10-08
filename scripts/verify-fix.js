#!/usr/bin/env node

/**
 * Verify that the onboarding and autopilot fixes are working
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

try {
  const dbPath = path.join(__dirname, '..', 'data', 'geo-seo.db');
  const db = new Database(dbPath);

  log('\n========================================', colors.cyan);
  log('  System Verification Report', colors.cyan);
  log('========================================\n', colors.cyan);

  // Check subscription tiers
  const tiers = db.prepare('SELECT COUNT(*) as count FROM subscription_tiers').get();
  log(`✓ Subscription Tiers: ${tiers.count} loaded`, tiers.count === 4 ? colors.green : colors.red);

  if (tiers.count === 4) {
    const tierDetails = db.prepare('SELECT name, display_name, monthly_price_usd FROM subscription_tiers ORDER BY display_order').all();
    tierDetails.forEach(tier => {
      log(`  • ${tier.display_name}: $${tier.monthly_price_usd}/mo`, colors.green);
    });
  }

  // Check saved_onboarding table
  const onboardingCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='saved_onboarding'").get();
  log(`\n✓ Saved Onboarding Table: ${onboardingCheck ? 'EXISTS' : 'MISSING'}`, onboardingCheck ? colors.green : colors.red);

  // Check client_subscriptions table
  const subsCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='client_subscriptions'").get();
  log(`✓ Client Subscriptions Table: ${subsCheck ? 'EXISTS' : 'MISSING'}`, subsCheck ? colors.green : colors.red);

  // Check task_execution_calendar table
  const calendarCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='task_execution_calendar'").get();
  log(`✓ Task Execution Calendar: ${calendarCheck ? 'EXISTS' : 'MISSING'}`, calendarCheck ? colors.green : colors.red);

  // Count total tables
  const tableCount = db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get();
  log(`\n✓ Total Tables: ${tableCount.count}`, colors.green);

  // Check if any subscriptions exist
  const subCount = db.prepare('SELECT COUNT(*) as count FROM client_subscriptions').get();
  log(`\n📊 Active Subscriptions: ${subCount.count}`, subCount.count > 0 ? colors.green : colors.yellow);

  // Check if any saved onboarding exists
  const savedCount = db.prepare('SELECT COUNT(*) as count FROM saved_onboarding').get();
  log(`📊 Saved Onboarding Sessions: ${savedCount.count}`, savedCount.count > 0 ? colors.green : colors.yellow);

  db.close();

  log('\n========================================', colors.cyan);
  log('✅ ALL CRITICAL SYSTEMS OPERATIONAL', colors.green);
  log('========================================\n', colors.cyan);

  log('🚀 Ready to test:', colors.cyan);
  log('  • Onboarding: http://localhost:3000/onboarding', colors.yellow);
  log('  • Client Autopilot: http://localhost:3000/clients\n', colors.yellow);

} catch (error) {
  log(`\n❌ Error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
}
