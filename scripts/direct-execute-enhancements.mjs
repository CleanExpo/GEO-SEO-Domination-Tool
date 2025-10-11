#!/usr/bin/env node

/**
 * Direct SQL Execution for Database Enhancements
 * Uses pg package to directly connect to Supabase PostgreSQL
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function executeSchema(client, schemaFile, schemaName) {
  log(`\n${'═'.repeat(80)}`, 'cyan');
  log(`  ${schemaName}`, 'bright');
  log('═'.repeat(80), 'cyan');

  try {
    const schemaPath = path.join(__dirname, '..', schemaFile);
    const sql = fs.readFileSync(schemaPath, 'utf8');

    log(`\n   📝 Executing ${path.basename(schemaFile)}...`, 'blue');
    log(`   File size: ${(sql.length / 1024).toFixed(2)} KB\n`, 'cyan');

    // Execute the entire schema in one transaction
    await client.query('BEGIN');

    try {
      await client.query(sql);
      await client.query('COMMIT');

      log(`   ✅ Schema executed successfully!`, 'green');
      return { success: true, error: null };
    } catch (error) {
      await client.query('ROLLBACK');

      // Check if error is "already exists" - that's OK
      if (error.message.includes('already exists')) {
        log(`   ⚠️  Some objects already exist (continuing...)`, 'yellow');
        return { success: true, error: null };
      }

      throw error;
    }
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function verifyTables(client, expectedTables) {
  log(`\n${'═'.repeat(80)}`, 'cyan');
  log('  VERIFYING TABLES', 'bright');
  log('═'.repeat(80), 'cyan');
  log('');

  let verifiedCount = 0;
  let missingCount = 0;

  for (const tableName of expectedTables) {
    try {
      const result = await client.query(
        `SELECT COUNT(*) as count FROM ${tableName}`
      );

      const count = result.rows[0].count;
      log(`   ✅ ${tableName.padEnd(35)} (${count} rows)`, 'green');
      verifiedCount++;
    } catch (error) {
      if (error.message.includes('does not exist')) {
        log(`   ❌ ${tableName.padEnd(35)} - MISSING`, 'red');
        missingCount++;
      } else {
        log(`   ⚠️  ${tableName.padEnd(35)} - ERROR: ${error.message.substring(0, 50)}`, 'yellow');
      }
    }
  }

  return { verifiedCount, missingCount, total: expectedTables.length };
}

async function main() {
  log('\n🚀 Direct SQL Execution - Database Enhancements', 'bright');
  log('='.repeat(80), 'cyan');

  // Get database URL from environment
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    log('\n❌ POSTGRES_URL not found in .env.local', 'red');
    process.exit(1);
  }

  log('\n✓ Connection string found', 'green');
  log(`   Using: POSTGRES_URL from .env.local`, 'cyan');

  const { Pool } = pg;
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  let client;

  try {
    client = await pool.connect();
    log('✓ Connected to Supabase PostgreSQL\n', 'green');

    // Execute all 4 enhancement schemas
    const schemas = [
      {
        file: 'database/enhancements/01-analytics-schema.sql',
        name: 'Enhancement 1: Analytics Schema',
        tables: ['competitor_snapshots', 'seo_trends', 'ranking_history', 'visibility_history']
      },
      {
        file: 'database/enhancements/02-rate-limiting-schema.sql',
        name: 'Enhancement 2: Rate Limiting Schema',
        tables: ['api_requests', 'rate_limits', 'api_quotas', 'api_keys']
      },
      {
        file: 'database/enhancements/03-audit-history-schema.sql',
        name: 'Enhancement 3: Audit History Schema',
        tables: ['audit_history', 'company_history', 'change_approvals', 'data_snapshots']
      },
      {
        file: 'database/enhancements/04-client-portal-schema.sql',
        name: 'Enhancement 4: Client Portal Schema',
        tables: ['client_portal_access', 'client_reports', 'client_notifications', 'client_feedback', 'client_dashboard_widgets', 'client_activity_log']
      }
    ];

    let successCount = 0;
    let failCount = 0;

    for (const schema of schemas) {
      const result = await executeSchema(client, schema.file, schema.name);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    // Verify all tables
    log('');
    const allExpectedTables = schemas.flatMap(s => s.tables);
    const verification = await verifyTables(client, allExpectedTables);

    // Summary
    log(`\n${'═'.repeat(80)}`, 'cyan');
    log('  EXECUTION SUMMARY', 'bright');
    log('═'.repeat(80), 'cyan');
    log(`\n   ✅ Schemas executed: ${successCount}/${schemas.length}`, 'green');
    if (failCount > 0) {
      log(`   ❌ Failed schemas: ${failCount}`, 'red');
    }
    log(`   ✅ Tables verified: ${verification.verifiedCount}/${verification.total}`, verification.verifiedCount === verification.total ? 'green' : 'yellow');

    if (verification.missingCount > 0) {
      log(`   ❌ Missing tables: ${verification.missingCount}`, 'red');
    }

    if (verification.verifiedCount === verification.total) {
      log('\n🎉 All enhancements executed successfully!', 'green');
      log('\n📚 New Capabilities Enabled:', 'blue');
      log('   ✅ Advanced Analytics - Competitor tracking, SEO trends', 'cyan');
      log('   ✅ Rate Limiting - API throttling, request tracking', 'cyan');
      log('   ✅ Audit History - Version control, change tracking', 'cyan');
      log('   ✅ Client Portal - Client reports, notifications\n', 'cyan');
    } else {
      log('\n⚠️  Some tables could not be verified. Check errors above.', 'yellow');
    }

    log('═'.repeat(80), 'cyan');

  } catch (error) {
    log(`\n💥 Execution failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

main();
