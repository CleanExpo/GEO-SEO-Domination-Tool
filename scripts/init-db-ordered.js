#!/usr/bin/env node

/**
 * Ordered Database Initialization Script
 * Loads SQL files in the correct dependency order
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Define the correct order for schema loading
const SCHEMA_ORDER = [
  // 1. Core foundation tables
  'schema.sql',

  // 2. User and authentication
  'user-settings-schema.sql',

  // 3. Onboarding
  'onboarding-schema.sql',
  'client-onboarding-schema.sql',
  'saved-onboarding-schema.sql',

  // 4. Client subscriptions and autopilot (NEW!)
  'client-subscriptions-schema.sql',

  // 5. Autonomous tasks
  'autonomous-tasks-schema.sql',
  'agent-system-schema.sql',

  // 6. Content and SEO
  'content-opportunities-schema.sql',
  'ai-search-schema.sql',
  'marketing-knowledge-schema.sql',

  // 7. CRM (SQLite version only)
  'empire-crm-schema-sqlite.sql',

  // 8. Integrations
  'integrations-schema.sql',
  'google-search-console-schema.sql',

  // 9. Monitoring
  'seo-monitor-schema.sql',
  'serpbear-schema.sql',
  'siteone-crawler-schema.sql',

  // 10. Notifications and scheduling
  'notifications-schema.sql',
  'scheduled-jobs-schema.sql',

  // 11. Support
  'support-tickets-schema.sql',

  // 12. Sandbox
  'sandbox-schema.sql',

  // 13. Localization
  'localization-schema.sql',

  // 14. Core SEO enhancements (must come after schema.sql)
  '02-core-seo.sql',

  // 15. Migrations and additions (last)
  'add-user-id-columns.sql',
  'integrations-migration.sql',
];

async function initDatabase() {
  log('\n========================================', colors.cyan);
  log('  Database Initialization (Ordered)', colors.cyan);
  log('========================================\n', colors.cyan);

  const dbPath = path.join(__dirname, '..', 'data', 'geo-seo.db');
  const databaseDir = path.join(__dirname, '..', 'database');

  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    log('✓ Created data directory', colors.green);
  }

  // Connect to database
  log(`Connecting to: ${dbPath}`, colors.blue);
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  log('✓ Connected to SQLite database\n', colors.green);

  log(`Loading ${SCHEMA_ORDER.length} schema files in order:\n`, colors.blue);

  let successCount = 0;
  let errorCount = 0;

  for (const sqlFile of SCHEMA_ORDER) {
    const filePath = path.join(databaseDir, sqlFile);

    if (!fs.existsSync(filePath)) {
      log(`  ⚠ Skipping ${sqlFile} (not found)`, colors.yellow);
      continue;
    }

    try {
      log(`  Processing ${sqlFile}...`, colors.yellow);

      const sqlContent = fs.readFileSync(filePath, 'utf-8');

      // Execute the entire file as a transaction
      db.exec(sqlContent);

      log(`  ✓ ${sqlFile} executed successfully`, colors.green);
      successCount++;
    } catch (error) {
      // Check if it's just a "table already exists" error
      if (error.message.includes('already exists')) {
        log(`  ✓ ${sqlFile} (tables already exist)`, colors.green);
        successCount++;
      } else {
        log(`  ✗ Error in ${sqlFile}: ${error.message}`, colors.red);
        errorCount++;
      }
    }
  }

  // Verify key tables
  log('\n' + '='.repeat(40), colors.cyan);
  log('Verifying tables...', colors.blue);

  const keyTables = [
    'companies',
    'saved_onboarding',
    'subscription_tiers',
    'client_subscriptions',
    'task_execution_calendar',
    'autonomous_tasks'
  ];

  for (const table of keyTables) {
    try {
      const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      log(`✓ ${table}: ${result.count} rows`, colors.green);
    } catch (error) {
      log(`✗ ${table}: NOT FOUND`, colors.red);
      errorCount++;
    }
  }

  // Check subscription tiers
  log('\n' + '='.repeat(40), colors.cyan);
  log('Subscription Tiers:', colors.blue);
  try {
    const tiers = db.prepare('SELECT name, monthly_price_usd FROM subscription_tiers').all();
    if (tiers.length === 0) {
      log('  ⚠️  No tiers found - attempting to insert...', colors.yellow);

      // Insert tiers manually if they don't exist
      const insertTier = db.prepare(`
        INSERT OR IGNORE INTO subscription_tiers
        (name, display_name, description, monthly_price_usd,
         seo_audits_per_month, blog_posts_per_month, social_posts_per_month,
         research_papers_per_month, gmb_posts_per_month, white_papers_per_month,
         competitor_monitoring_frequency, autopilot_enabled, auto_publish_enabled,
         ruler_quality_threshold, priority_level, max_concurrent_tasks, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const tiersData = [
        ['starter', 'Starter', 'Perfect for small businesses', 500.00, 2, 4, 20, 0, 8, 0, 'weekly', 1, 0, 85, 1, 2, 1],
        ['growth', 'Growth', 'Ideal for growing businesses', 1000.00, 4, 8, 40, 1, 16, 0, '3x_week', 1, 1, 80, 2, 3, 2],
        ['scale', 'Scale', 'For established businesses', 2500.00, 8, 16, 80, 2, 32, 1, 'daily', 1, 1, 75, 3, 5, 3],
        ['empire', 'Empire', 'Industry leaders', 5000.00, 16, 32, 160, 4, 64, 2, 'realtime', 1, 1, 70, 4, 10, 4]
      ];

      for (const tier of tiersData) {
        insertTier.run(...tier);
      }

      const newTiers = db.prepare('SELECT name, monthly_price_usd FROM subscription_tiers').all();
      newTiers.forEach(tier => {
        log(`  ✓ ${tier.name}: $${tier.monthly_price_usd}`, colors.green);
      });
    } else {
      tiers.forEach(tier => {
        log(`  ✓ ${tier.name}: $${tier.monthly_price_usd}`, colors.green);
      });
    }
  } catch (error) {
    log(`  ✗ Error checking tiers: ${error.message}`, colors.red);
  }

  db.close();

  log('\n' + '='.repeat(40), colors.cyan);
  log(`Summary:`, colors.cyan);
  log(`  Files processed: ${SCHEMA_ORDER.length}`, colors.blue);
  log(`  Successful: ${successCount}`, colors.green);
  log(`  Errors: ${errorCount}`, errorCount > 0 ? colors.red : colors.green);
  log('========================================\n', colors.cyan);

  if (errorCount === 0) {
    log('✓ Database initialization completed successfully!', colors.green);
    log('\nNext steps:', colors.cyan);
    log('  1. Start dev server: npm run dev', colors.blue);
    log('  2. Visit: http://localhost:3000/clients', colors.blue);
    log('  3. Create a subscription and watch the circular visualization! ✨', colors.blue);
    log('\nOr test onboarding:', colors.cyan);
    log('  http://localhost:3000/onboarding', colors.blue);
  } else {
    log('⚠ Database initialization completed with some errors', colors.yellow);
    log('Check the errors above to see what went wrong.', colors.yellow);
  }
}

initDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
