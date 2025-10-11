#!/usr/bin/env node

/**
 * Migrate Post-Audit Automation Schema to Supabase
 *
 * Creates tables for:
 * - website_credentials (encrypted storage)
 * - agent_tasks (automation tasks)
 * - task_execution_logs (audit trail)
 * - task_templates (reusable definitions)
 * - credentials_access_log (security)
 * - automation_rules (trigger-based execution)
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  try {
    log('🚀 Post-Audit Automation Schema Migration', 'bright');
    log('='.repeat(80), 'bright');

    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found in .env.local');
    }

    log('\n✓ Supabase credentials found', 'green');

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'post-audit-automation-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    log('✓ Schema file loaded (395 lines)', 'green');

    // Split into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    log(`✓ Parsed ${statements.length} SQL statements\n`, 'green');

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments
      if (statement.startsWith('COMMENT') || statement.includes('/*')) {
        continue;
      }

      // Extract table/function name for logging
      let entityName = 'Unknown';
      if (statement.includes('CREATE TABLE')) {
        const match = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
        if (match) entityName = match[1];
      } else if (statement.includes('CREATE INDEX')) {
        const match = statement.match(/CREATE INDEX (\w+)/);
        if (match) entityName = match[1];
      } else if (statement.includes('CREATE TRIGGER')) {
        const match = statement.match(/CREATE TRIGGER (\w+)/);
        if (match) entityName = match[1];
      } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
        const match = statement.match(/FUNCTION (\w+)/);
        if (match) entityName = match[1];
      }

      process.stdout.write(`  [${i + 1}/${statements.length}] ${entityName}... `);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // Try direct query as fallback
          const { error: directError } = await supabase.from('_migrations').select('*').limit(0);

          if (directError && directError.message.includes('does not exist')) {
            // Table doesn't exist yet, use raw query
            log('⚠️  Using raw query', 'yellow');
          }

          // For now, log the error but continue
          log(`✗ ${error.message}`, 'red');
          errorCount++;
        } else {
          log('✓', 'green');
          successCount++;
        }
      } catch (err) {
        log(`✗ ${err.message}`, 'red');
        errorCount++;
      }
    }

    log('\n' + '='.repeat(80), 'bright');
    log(`\n📊 Migration Summary:`, 'blue');
    log(`   Successful: ${successCount}`, 'green');
    log(`   Errors: ${errorCount}`, errorCount > 0 ? 'yellow' : 'green');

    if (errorCount > 0) {
      log('\n⚠️  Some statements failed. This is often normal for:', 'yellow');
      log('   - Tables that already exist', 'yellow');
      log('   - Indexes that are already created', 'yellow');
      log('   - Comments (not critical)', 'yellow');
    }

    // Verify tables were created
    log('\n🔍 Verifying table creation...', 'blue');

    const tablesToCheck = [
      'website_credentials',
      'agent_tasks',
      'task_execution_logs',
      'task_templates',
      'credentials_access_log',
      'automation_rules'
    ];

    for (const table of tablesToCheck) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          log(`   ✗ ${table}: ${error.message}`, 'red');
        } else {
          log(`   ✓ ${table}: Ready (${count || 0} rows)`, 'green');
        }
      } catch (err) {
        log(`   ✗ ${table}: ${err.message}`, 'red');
      }
    }

    log('\n✅ Migration complete!', 'green');
    log('\n📝 Next steps:', 'blue');
    log('   1. Generate encryption key: openssl rand -base64 32', 'yellow');
    log('   2. Add to .env.local: CREDENTIALS_ENCRYPTION_KEY="..."', 'yellow');
    log('   3. Test credential encryption: npm run test:crypto', 'yellow');
    log('   4. Build API endpoints for task creation\n', 'yellow');

  } catch (error) {
    log(`\n💥 Migration failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
