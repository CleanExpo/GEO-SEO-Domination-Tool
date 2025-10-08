#!/usr/bin/env node

/**
 * Quick Database Initialization
 * Executes quick-init.sql to create essential tables
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
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function quickInit() {
  try {
    log('\n========================================', colors.cyan);
    log('  Quick Database Initialization', colors.cyan);
    log('========================================\n', colors.cyan);

    // Database path
    const dbPath = path.join(__dirname, '..', 'data', 'geo-seo.db');
    const dataDir = path.dirname(dbPath);

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      log('✓ Created data directory', colors.green);
    }

    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'database', 'quick-init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    log(`Database: ${dbPath}`, colors.yellow);
    log(`SQL File: ${sqlPath}\n`, colors.yellow);

    // Open database
    const db = new Database(dbPath);
    
    // Execute SQL
    log('Executing SQL...', colors.cyan);
    db.exec(sql);
    
    log('✓ SQL executed successfully\n', colors.green);

    // Verify tables
    log('Verifying tables...', colors.cyan);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    
    log(`\nFound ${tables.length} tables:`, colors.green);
    tables.forEach(table => {
      log(`  ✓ ${table.name}`, colors.green);
    });

    // Check tier data
    const tiers = db.prepare('SELECT name, display_name, monthly_price_usd FROM subscription_tiers ORDER BY display_order').all();
    log(`\nSubscription Tiers Loaded:`, colors.green);
    tiers.forEach(tier => {
      log(`  ✓ ${tier.display_name} - $${tier.monthly_price_usd}/mo`, colors.green);
    });

    db.close();

    log('\n========================================', colors.cyan);
    log('✓ Quick initialization complete!', colors.green);
    log('========================================\n', colors.cyan);

  } catch (error) {
    log(`\n✗ Error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

quickInit();
