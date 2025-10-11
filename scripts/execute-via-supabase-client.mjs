#!/usr/bin/env node

/**
 * Execute SQL via Supabase Admin API
 * Uses postgrest to execute raw SQL
 */

import fetch from 'node-fetch';
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

async function executeSQL(sql, schemaName) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Use Supabase REST API to execute SQL
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return await response.json();
}

async function main() {
  log('\n🚀 Executing Database Enhancements via Supabase API', 'bright');
  log('='.repeat(80), 'cyan');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    log('\n❌ Missing Supabase credentials', 'red');
    process.exit(1);
  }

  log('\n✓ Supabase credentials found', 'green');
  log(`   URL: ${supabaseUrl}`, 'cyan');
  log('\n⚠️  This method requires the exec_sql RPC function to exist.', 'yellow');
  log('   If execution fails, please use the SQL Editor method instead.', 'yellow');
  log('   See: EXECUTE_ENHANCEMENTS_NOW.md\n', 'yellow');

  // Read all schemas
  const schemas = [
    'database/enhancements/01-analytics-schema.sql',
    'database/enhancements/02-rate-limiting-schema.sql',
    'database/enhancements/03-audit-history-schema.sql',
    'database/enhancements/04-client-portal-schema.sql',
  ];

  for (const schemaFile of schemas) {
    const schemaPath = path.join(__dirname, '..', schemaFile);
    const sql = fs.readFileSync(schemaPath, 'utf8');
    const schemaName = path.basename(schemaFile);

    log(`${'='.repeat(80)}`, 'cyan');
    log(`  Executing: ${schemaName}`, 'bright');
    log(`${'='.repeat(80)}`, 'cyan');

    try {
      await executeSQL(sql, schemaName);
      log(`   ✅ Success!`, 'green');
    } catch (error) {
      log(`   ❌ Error: ${error.message}`, 'red');
      log(`\n   This is expected if exec_sql function doesn't exist.`, 'yellow');
      log(`   Please execute manually via SQL Editor instead.`, 'yellow');
      break;
    }
  }

  log('\n' + '='.repeat(80), 'cyan');
  log('See EXECUTE_ENHANCEMENTS_NOW.md for manual execution instructions', 'cyan');
  log('='.repeat(80), 'cyan');
}

main().catch(error => {
  log(`\n💥 Failed: ${error.message}`, 'red');
  log('\nPlease execute manually via Supabase SQL Editor:', 'yellow');
  log('https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/editor/sql\n', 'cyan');
});
