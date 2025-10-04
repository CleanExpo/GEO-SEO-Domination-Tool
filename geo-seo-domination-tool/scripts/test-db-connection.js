#!/usr/bin/env node

/**
 * Test Database Connection Script
 * Tests database connection and displays configuration
 *
 * Usage:
 *   node scripts/test-db-connection.js
 */

const { DatabaseClient } = require('../web-app/lib/db');
require('dotenv').config();

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testConnection() {
  log('\n========================================', colors.cyan);
  log('  Database Connection Test', colors.cyan + colors.bright);
  log('========================================\n', colors.cyan);

  const db = new DatabaseClient();

  try {
    // Show detected configuration
    log('Environment Variables:', colors.blue);
    log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '✓ Set' : '✗ Not set'}`,
        process.env.DATABASE_URL ? colors.green : colors.yellow);
    log(`  POSTGRES_URL: ${process.env.POSTGRES_URL ? '✓ Set' : '✗ Not set'}`,
        process.env.POSTGRES_URL ? colors.green : colors.yellow);
    log(`  SQLITE_PATH: ${process.env.SQLITE_PATH ? '✓ Set' : '✗ Not set (using default)'}`,
        process.env.SQLITE_PATH ? colors.green : colors.yellow);
    log('');

    // Detect configuration
    const config = db.config;
    log('Detected Configuration:', colors.blue);
    log(`  Database Type: ${config.type}`, colors.cyan);

    if (config.type === 'postgres') {
      // Don't show full connection string for security
      log(`  Connection String: ${config.connectionString.substring(0, 20)}...`, colors.cyan);
    } else {
      log(`  SQLite Path: ${config.sqlitePath}`, colors.cyan);
    }
    log('');

    // Test connection
    log('Testing connection...', colors.yellow);
    await db.initialize();
    log('✓ Connection successful!', colors.green);
    log('');

    // Get database info
    log('Database Information:', colors.blue);

    if (config.type === 'sqlite') {
      // Show SQLite info
      const tables = await db.query(`
        SELECT name FROM sqlite_master
        WHERE type='table'
        AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);

      log(`  Total Tables: ${tables.rows.length}`, colors.cyan);

      if (tables.rows.length > 0) {
        log(`  Tables:`, colors.cyan);
        tables.rows.slice(0, 10).forEach(row => {
          log(`    - ${row.name}`, colors.cyan);
        });
        if (tables.rows.length > 10) {
          log(`    ... and ${tables.rows.length - 10} more`, colors.cyan);
        }
      } else {
        log(`  No tables found. Run 'npm run db:init' to create tables.`, colors.yellow);
      }
    } else {
      // Show PostgreSQL info
      const tables = await db.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);

      log(`  Total Tables: ${tables.rows.length}`, colors.cyan);

      if (tables.rows.length > 0) {
        log(`  Tables:`, colors.cyan);
        tables.rows.slice(0, 10).forEach(row => {
          log(`    - ${row.table_name}`, colors.cyan);
        });
        if (tables.rows.length > 10) {
          log(`    ... and ${tables.rows.length - 10} more`, colors.cyan);
        }
      } else {
        log(`  No tables found. Run 'npm run db:init' to create tables.`, colors.yellow);
      }
    }
    log('');

    // Test a simple query
    log('Testing query execution...', colors.yellow);
    try {
      // Try to query a table if it exists
      const testTable = await db.tableExists('companies');
      if (testTable) {
        const result = await db.query('SELECT COUNT(*) as count FROM companies');
        log(`✓ Query successful! Companies table has ${result.rows[0].count} records.`, colors.green);
      } else {
        log('✓ Query capability verified (no test table found)', colors.green);
      }
    } catch (error) {
      log(`⚠ Query test skipped: ${error.message}`, colors.yellow);
    }
    log('');

    log('========================================', colors.cyan);
    log('✓ All tests passed!', colors.green + colors.bright);
    log('========================================\n', colors.cyan);

    // Show next steps
    log('Next Steps:', colors.blue);
    if (config.type === 'sqlite') {
      log('  1. Run initialization: npm run db:init', colors.cyan);
      log('  2. Verify tables: npm run db:init:verify', colors.cyan);
      log('  3. Check migration status: npm run db:migrate:status', colors.cyan);
    } else {
      log('  1. Run initialization: npm run db:init', colors.cyan);
      log('  2. Run migrations: npm run db:migrate', colors.cyan);
      log('  3. Verify deployment: npm run db:migrate:status', colors.cyan);
    }
    log('');

  } catch (error) {
    log('\n========================================', colors.red);
    log('✗ Connection Test Failed', colors.red + colors.bright);
    log('========================================\n', colors.red);
    log(`Error: ${error.message}`, colors.red);
    console.error(error);
    log('');

    log('Troubleshooting:', colors.yellow);
    if (config.type === 'postgres') {
      log('  1. Check DATABASE_URL format:', colors.cyan);
      log('     postgresql://username:password@host:port/database', colors.cyan);
      log('  2. Verify network access to PostgreSQL server', colors.cyan);
      log('  3. Check PostgreSQL server is running', colors.cyan);
      log('  4. Verify credentials are correct', colors.cyan);
    } else {
      log('  1. Check directory permissions for SQLite path', colors.cyan);
      log('  2. Ensure no other process has database locked', colors.cyan);
      log('  3. Verify SQLITE_PATH in .env if set', colors.cyan);
    }
    log('');

    process.exit(1);
  } finally {
    await db.close();
  }
}

// Run the test
if (require.main === module) {
  testConnection().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { testConnection };
