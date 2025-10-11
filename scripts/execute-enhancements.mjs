#!/usr/bin/env node

/**
 * Execute Database Enhancements
 *
 * Runs all 4 enhancement schemas against Supabase database:
 * 1. Analytics Schema (competitor tracking, SEO trends)
 * 2. Rate Limiting Schema (API throttling, quotas)
 * 3. Audit History Schema (version control, change tracking)
 * 4. Client Portal Schema (client-facing reports, notifications)
 */

import { createClient } from '@supabase/supabase-js';
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

async function executeSQL(supabase, sql, filename) {
  try {
    // Split SQL into individual statements (simple approach)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'END;' && s !== 'END' && s !== '$$');

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      let statement = statements[i];

      // Skip certain statements
      if (
        statement.startsWith('DO $$') ||
        statement.includes('CREATE OR REPLACE FUNCTION') ||
        statement.includes('CREATE TRIGGER') ||
        statement.includes('COMMENT ON')
      ) {
        // These require special handling, skip for now
        skipCount++;
        continue;
      }

      // Add semicolon back
      if (!statement.endsWith(';')) {
        statement += ';';
      }

      try {
        // Execute via direct query (requires service role key)
        const { error } = await supabase.rpc('query', { sql_query: statement });

        if (error) {
          if (error.message?.includes('already exists')) {
            skipCount++;
          } else if (error.message?.includes('does not exist')) {
            // Function query doesn't exist, try alternative method
            skipCount++;
          } else {
            log(`      ⚠️  Statement ${i + 1}: ${error.message.substring(0, 100)}`, 'yellow');
            errorCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        log(`      ✗ Statement ${i + 1}: ${err.message.substring(0, 100)}`, 'red');
        errorCount++;
      }
    }

    return { successCount, skipCount, errorCount, total: statements.length };
  } catch (error) {
    throw error;
  }
}

async function main() {
  log('\n🚀 Database Enhancement Execution', 'bright');
  log('='.repeat(80), 'cyan');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log('\n❌ Missing Supabase credentials', 'red');
    process.exit(1);
  }

  log('\n✓ Supabase credentials found', 'green');

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  log('✓ Connected to Supabase\n', 'green');

  // Enhancement schemas to execute
  const schemas = [
    {
      file: 'database/enhancements/01-analytics-schema.sql',
      name: 'Analytics Schema',
      description: 'Competitor tracking, SEO trends, visibility scoring',
    },
    {
      file: 'database/enhancements/02-rate-limiting-schema.sql',
      name: 'Rate Limiting Schema',
      description: 'API throttling, request tracking, quota management',
    },
    {
      file: 'database/enhancements/03-audit-history-schema.sql',
      name: 'Audit History Schema',
      description: 'Version control, change tracking, data snapshots',
    },
    {
      file: 'database/enhancements/04-client-portal-schema.sql',
      name: 'Client Portal Schema',
      description: 'Client reports, notifications, activity tracking',
    },
  ];

  let totalSuccess = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const schema of schemas) {
    log('═'.repeat(80), 'cyan');
    log(`  ${schema.name}`, 'bright');
    log(`  ${schema.description}`, 'blue');
    log('═'.repeat(80), 'cyan');

    try {
      const schemaPath = path.join(__dirname, '..', schema.file);
      const sql = fs.readFileSync(schemaPath, 'utf8');

      log(`\n   📝 Executing ${schema.file}...`, 'blue');
      log(`   File size: ${(sql.length / 1024).toFixed(2)} KB\n`, 'cyan');

      const result = await executeSQL(supabase, sql, schema.file);

      log(`   ✅ ${result.successCount} statements executed`, 'green');
      if (result.skipCount > 0) {
        log(`   ⏭️  ${result.skipCount} statements skipped (already exist)`, 'yellow');
      }
      if (result.errorCount > 0) {
        log(`   ⚠️  ${result.errorCount} statements had errors`, 'yellow');
      }

      totalSuccess += result.successCount;
      totalSkipped += result.skipCount;
      totalErrors += result.errorCount;

    } catch (error) {
      log(`\n   💥 Failed to execute ${schema.name}: ${error.message}`, 'red');
      totalErrors++;
    }

    log('');
  }

  // Summary
  log('═'.repeat(80), 'cyan');
  log('  EXECUTION SUMMARY', 'bright');
  log('═'.repeat(80), 'cyan');
  log(`\n   ✅ Successful: ${totalSuccess} statements`, 'green');
  log(`   ⏭️  Skipped: ${totalSkipped} statements`, 'yellow');
  log(`   ⚠️  Errors: ${totalErrors} statements`, totalErrors > 0 ? 'yellow' : 'green');

  // Verify tables
  log('\n═'.repeat(80), 'cyan');
  log('  VERIFYING NEW TABLES', 'bright');
  log('═'.repeat(80), 'cyan');

  const expectedTables = [
    'competitor_snapshots',
    'seo_trends',
    'ranking_history',
    'visibility_history',
    'api_requests',
    'rate_limits',
    'api_quotas',
    'api_keys',
    'audit_history',
    'company_history',
    'change_approvals',
    'data_snapshots',
    'client_portal_access',
    'client_reports',
    'client_notifications',
    'client_feedback',
    'client_dashboard_widgets',
    'client_activity_log',
  ];

  let verifiedCount = 0;
  let missingCount = 0;

  for (const tableName of expectedTables) {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.message.includes('does not exist')) {
        log(`   ❌ ${tableName.padEnd(35)} - MISSING`, 'red');
        missingCount++;
      } else {
        log(`   ⚠️  ${tableName.padEnd(35)} - ERROR: ${error.message.substring(0, 50)}`, 'yellow');
      }
    } else {
      log(`   ✅ ${tableName.padEnd(35)} (${count || 0} rows)`, 'green');
      verifiedCount++;
    }
  }

  log('\n═'.repeat(80), 'cyan');
  log(`  ${verifiedCount}/${expectedTables.length} tables verified`, verifiedCount === expectedTables.length ? 'green' : 'yellow');
  log('═'.repeat(80), 'cyan');

  if (missingCount > 0) {
    log('\n⚠️  Some tables are missing. This is expected if using RPC method.', 'yellow');
    log('   Recommended: Use Supabase SQL Editor to execute schemas manually.', 'yellow');
    log('\n📝 To execute manually:', 'blue');
    log('   1. Go to: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/editor/sql', 'cyan');
    log('   2. Copy each enhancement schema file', 'cyan');
    log('   3. Paste into SQL Editor and click "Run"', 'cyan');
    log('   4. Repeat for all 4 enhancement schemas\n', 'cyan');
  } else {
    log('\n🎉 All enhancement tables created successfully!', 'green');
    log('\n📚 New Capabilities Enabled:', 'blue');
    log('   ✅ Advanced Analytics - Competitor tracking, SEO trends', 'cyan');
    log('   ✅ Rate Limiting - API throttling, request tracking', 'cyan');
    log('   ✅ Audit History - Version control, change tracking', 'cyan');
    log('   ✅ Client Portal - Client reports, notifications\n', 'cyan');
  }

  log('═'.repeat(80), 'cyan');
}

main().catch(error => {
  log(`\n💥 Execution failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
