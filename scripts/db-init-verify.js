#!/usr/bin/env node

/**
 * Database Initialize and Verify Script
 * Initializes database and verifies all tables exist
 *
 * Usage:
 *   node scripts/db-init-verify.js
 *   npm run db:init:verify
 */

import { initializeDatabase, verifyTables } from './init-database.js';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function run() {
  try {
    log('\n╔═══════════════════════════════════════════╗', colors.cyan);
    log('║  Database Initialize & Verify Tool       ║', colors.cyan + colors.bright);
    log('╚═══════════════════════════════════════════╝\n', colors.cyan);

    // Step 1: Initialize database
    await initializeDatabase();

    // Step 2: Verify tables
    log('\n' + '='.repeat(50), colors.cyan);
    await verifyTables();

    log('\n✓ Database initialization and verification complete!', colors.green + colors.bright);
    log('='.repeat(50) + '\n', colors.cyan);

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Fatal error:', error);
    process.exit(1);
  }
}

run();
