#!/usr/bin/env node

/**
 * Simple Database Initialization Script
 * Loads all SQL files from database/ directory
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

async function initDatabase() {
  log('\n========================================', colors.cyan);
  log('  Database Initialization', colors.cyan);
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
  log('✓ Connected to SQLite database\n', colors.green);

  // Get all SQL files (sorted alphabetically)
  const sqlFiles = fs.readdirSync(databaseDir)
    .filter(file => file.endsWith('.sql') && file !== '00-init-all.sql')
    .sort();

  log(`Found ${sqlFiles.length} schema files:\n`, colors.blue);
  sqlFiles.forEach(file => log(`  - ${file}`, colors.cyan));
  log('');

  // Execute each schema file
  log('Executing schema files...', colors.blue);
  let successCount = 0;
  let errorCount = 0;

  for (const sqlFile of sqlFiles) {
    const fileName = sqlFile;
    const filePath = path.join(databaseDir, sqlFile);

    try {
      log(`  Processing ${fileName}...`, colors.yellow);

      const sqlContent = fs.readFileSync(filePath, 'utf-8');

      // Split by semicolon and execute each statement
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.toLowerCase().startsWith('.read')) {
          // Skip .read directives (SQLite CLI only)
          continue;
        }
        try {
          db.exec(statement);
        } catch (err) {
          // Ignore table already exists errors
          if (!err.message.includes('already exists')) {
            throw err;
          }
        }
      }

      log(`  ✓ ${fileName} executed successfully`, colors.green);
      successCount++;
    } catch (error) {
      log(`  ✗ Error in ${fileName}: ${error.message}`, colors.red);
      errorCount++;
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
    }
  }

  // Check subscription tiers
  log('\nSubscription Tiers:', colors.blue);
  try {
    const tiers = db.prepare('SELECT name, monthly_price_usd FROM subscription_tiers').all();
    if (tiers.length === 0) {
      log('  ⚠️  No tiers found - they should be auto-inserted', colors.yellow);
    } else {
      tiers.forEach(tier => {
        log(`  ✓ ${tier.name}: $${tier.monthly_price_usd}`, colors.green);
      });
    }
  } catch (error) {
    log('  ✗ subscription_tiers table not found', colors.red);
  }

  db.close();

  log('\n' + '='.repeat(40), colors.cyan);
  log(`Summary:`, colors.cyan);
  log(`  Total files: ${sqlFiles.length}`, colors.blue);
  log(`  Successful: ${successCount}`, colors.green);
  log(`  Errors: ${errorCount}`, errorCount > 0 ? colors.red : colors.green);
  log('========================================\n', colors.cyan);

  if (errorCount === 0) {
    log('✓ Database initialization completed successfully!', colors.green);
    log('\nNext steps:', colors.cyan);
    log('  1. Start dev server: npm run dev', colors.blue);
    log('  2. Visit: http://localhost:3000/clients', colors.blue);
    log('  3. Create a subscription and watch the magic! ✨', colors.blue);
  } else {
    log('⚠ Database initialization completed with errors', colors.yellow);
  }
}

initDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
