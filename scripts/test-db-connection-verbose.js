#!/usr/bin/env node

/**
 * Comprehensive Database Connection Test
 * Tests connection, lists tables, counts rows, and checks schemas
 */

import { DatabaseClient } from '../lib/db.js';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testConnection() {
  log('\n╔═══════════════════════════════════════════════╗', colors.cyan);
  log('║  Comprehensive Database Connection Test      ║', colors.cyan + colors.bright);
  log('╚═══════════════════════════════════════════════╝\n', colors.cyan);

  const db = new DatabaseClient();

  try {
    // Initialize connection
    log('Step 1: Initializing database connection...', colors.blue);
    await db.initialize();
    const dbType = db.getType();
    log(`✓ Connected to ${dbType.toUpperCase()} database\n`, colors.green);

    // Get all tables
    log('Step 2: Retrieving table list...', colors.blue);
    const tables = await db.listTables();
    log(`✓ Found ${tables.length} tables\n`, colors.green);

    if (tables.length === 0) {
      log('⚠ Warning: No tables found. Database may not be initialized.', colors.yellow);
      log('  Run: npm run db:init\n', colors.yellow);
      return;
    }

    // Display tables with row counts
    log('Step 3: Analyzing tables...', colors.blue);
    log('─'.repeat(80), colors.cyan);
    log(
      `${'TABLE NAME'.padEnd(35)} | ${'ROWS'.padStart(10)} | ${'STATUS'.padEnd(10)}`,
      colors.bright
    );
    log('─'.repeat(80), colors.cyan);

    let totalRows = 0;
    const tablesByCategory = {
      'Core SEO': ['companies', 'individuals', 'audits', 'keywords', 'rankings', 'competitors'],
      'AI Search': [
        'ai_search_campaigns',
        'campaign_strategies',
        'ai_search_visibility',
        'ai_competitor_analysis',
      ],
      'Tracking': [
        'local_pack_tracking',
        'backlinks',
        'content_gaps',
        'citations',
        'service_areas',
      ],
      'Integrations': [
        'integration_registry',
        'integration_connections',
        'integration_webhooks',
        'webhook_events',
      ],
      'Projects': [
        'hub_projects',
        'hub_project_configs',
        'hub_sandbox_sessions',
        'project_templates',
      ],
      'Scheduler': ['scheduled_jobs', 'scheduled_audits', 'job_runs'],
      'Notifications': ['notification_queue', 'notification_preferences', 'email_logs'],
      'Support': ['support_tickets', 'support_ticket_responses'],
    };

    for (const table of tables) {
      try {
        const result = await db.query(
          `SELECT COUNT(*) as count FROM ${dbType === 'postgres' ? '"' + table + '"' : table}`
        );
        const count = result.rows[0].count || result.rows[0].COUNT;
        totalRows += parseInt(count);

        const category = Object.keys(tablesByCategory).find((cat) =>
          tablesByCategory[cat].includes(table)
        );
        const categoryLabel = category ? `[${category}]` : '';

        log(
          `${table.padEnd(35)} | ${String(count).padStart(10)} | ${count > 0 ? '✓ Active' : '○ Empty'}  ${categoryLabel}`,
          count > 0 ? colors.green : colors.reset
        );
      } catch (error) {
        log(
          `${table.padEnd(35)} | ${'ERROR'.padStart(10)} | ✗ Failed`,
          colors.red
        );
      }
    }

    log('─'.repeat(80), colors.cyan);
    log(`${'TOTAL'.padEnd(35)} | ${String(totalRows).padStart(10)} |`, colors.bright);
    log('─'.repeat(80) + '\n', colors.cyan);

    // Check critical tables
    log('Step 4: Checking critical tables...', colors.blue);
    const criticalTables = [
      'companies',
      'audits',
      'keywords',
      'rankings',
      'ai_search_campaigns',
      'scheduled_jobs',
    ];

    let missingCritical = [];
    for (const table of criticalTables) {
      if (!tables.includes(table)) {
        missingCritical.push(table);
      }
    }

    if (missingCritical.length > 0) {
      log('⚠ Missing critical tables:', colors.yellow);
      missingCritical.forEach((table) => log(`  - ${table}`, colors.red));
      log('\n  Run: npm run db:init to create missing tables\n', colors.yellow);
    } else {
      log('✓ All critical tables present\n', colors.green);
    }

    // Test a simple query
    log('Step 5: Testing query execution...', colors.blue);
    try {
      const testResult = await db.query('SELECT 1 as test');
      if (testResult.rows[0].test === 1 || testResult.rows[0].TEST === 1) {
        log('✓ Query execution successful\n', colors.green);
      }
    } catch (error) {
      log('✗ Query execution failed: ' + error.message, colors.red);
    }

    // Connection summary
    log('═'.repeat(80), colors.cyan);
    log('CONNECTION SUMMARY', colors.bright + colors.cyan);
    log('═'.repeat(80), colors.cyan);
    log(`Database Type:     ${dbType.toUpperCase()}`, colors.blue);
    log(`Total Tables:      ${tables.length}`, colors.blue);
    log(`Total Records:     ${totalRows}`, colors.blue);
    log(`Status:            ${missingCritical.length === 0 ? '✓ HEALTHY' : '⚠ NEEDS ATTENTION'}`,
      missingCritical.length === 0 ? colors.green : colors.yellow);
    log('═'.repeat(80) + '\n', colors.cyan);

    log('✓ Database connection test completed successfully!', colors.green + colors.bright);

  } catch (error) {
    log('\n✗ Connection test failed:', colors.red + colors.bright);
    log(`  Error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

testConnection();
