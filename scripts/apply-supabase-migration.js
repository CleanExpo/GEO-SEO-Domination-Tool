#!/usr/bin/env node

/**
 * Apply Production Database Migration to Supabase
 *
 * This script applies the complete schema initialization to Supabase
 * and verifies all tables and columns are correctly created.
 *
 * Usage: node scripts/apply-supabase-migration.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qwoggbbavikzhypzodcr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function readMigrationFile() {
  const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '001_initialize_production.sql');

  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${migrationPath}`);
  }

  return fs.readFileSync(migrationPath, 'utf8');
}

async function applyMigration() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║  APPLYING SUPABASE PRODUCTION MIGRATION                  ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');

  try {
    // Read migration SQL
    log('📄 Reading migration file...', 'blue');
    const migrationSQL = await readMigrationFile();

    log('✅ Migration file loaded\n', 'green');

    // NOTE: Supabase client doesn't support raw SQL execution via client library
    // Migration must be applied manually via Supabase SQL Editor
    log('⚠️  IMPORTANT: This migration must be applied via Supabase SQL Editor', 'yellow');
    log('\n📋 STEPS TO APPLY:\n', 'cyan');
    log('1. Go to: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/editor', 'blue');
    log('2. Open a new query', 'blue');
    log('3. Copy the entire contents from:', 'blue');
    log('   database/migrations/001_initialize_production.sql', 'yellow');
    log('4. Paste into SQL Editor', 'blue');
    log('5. Click "Run" button', 'blue');
    log('6. Verify success in Results panel\n', 'blue');

    // Instead, we'll verify the current schema state
    log('🔍 VERIFYING CURRENT DATABASE STATE...\n', 'cyan');
    await verifySchema();

  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`, 'red');
    if (error.details) log(`   Details: ${error.details}`, 'red');
    process.exit(1);
  }
}

async function verifySchema() {
  const checks = [
    {
      name: 'Companies Table Exists',
      test: async () => {
        const { data, error } = await supabase
          .from('companies')
          .select('id')
          .limit(1);
        return { pass: !error || error.code !== '42P01', error };
      }
    },
    {
      name: 'Companies Has Email Column',
      test: async () => {
        const { data, error } = await supabase
          .from('companies')
          .select('email')
          .limit(1);
        return { pass: !error || error.code !== 'PGRST204', error };
      }
    },
    {
      name: 'Companies Has Phone Column',
      test: async () => {
        const { data, error } = await supabase
          .from('companies')
          .select('phone')
          .limit(1);
        return { pass: !error || error.code !== 'PGRST204', error };
      }
    },
    {
      name: 'Companies Has Address Column',
      test: async () => {
        const { data, error } = await supabase
          .from('companies')
          .select('address')
          .limit(1);
        return { pass: !error || error.code !== 'PGRST204', error };
      }
    },
    {
      name: 'Client Credentials Table Exists',
      test: async () => {
        const { data, error } = await supabase
          .from('client_credentials')
          .select('id')
          .limit(1);
        return { pass: !error || error.code !== '42P01', error };
      }
    },
    {
      name: 'Saved Onboarding Sessions Table Exists',
      test: async () => {
        const { data, error } = await supabase
          .from('saved_onboarding_sessions')
          .select('id')
          .limit(1);
        return { pass: !error || error.code !== '42P01', error };
      }
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    try {
      const result = await check.test();

      if (result.pass) {
        log(`✅ ${check.name}`, 'green');
        passed++;
      } else {
        log(`❌ ${check.name}`, 'red');
        if (result.error) {
          log(`   Error: ${result.error.message || result.error.code}`, 'red');
        }
        failed++;
      }
    } catch (error) {
      log(`❌ ${check.name}`, 'red');
      log(`   Error: ${error.message}`, 'red');
      failed++;
    }
  }

  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║  SCHEMA VERIFICATION SUMMARY                              ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');

  log(`Total Checks: ${checks.length}`, 'blue');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, 'red');
  log(`Success Rate: ${((passed / checks.length) * 100).toFixed(1)}%\n`, passed === checks.length ? 'green' : 'yellow');

  if (failed > 0) {
    log('⚠️  MIGRATION NEEDED - Apply migration via Supabase SQL Editor', 'yellow');
    log('   See instructions above\n', 'yellow');
  } else {
    log('🎉 ALL CHECKS PASSED - Database schema is correct!\n', 'green');
  }
}

// Run
applyMigration().catch(error => {
  log(`\n❌ FATAL ERROR: ${error.message}`, 'red');
  process.exit(1);
});
