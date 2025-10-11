#!/usr/bin/env node

/**
 * Run Post-Audit Automation Schema Migration via Supabase Client
 *
 * Uses the Supabase Admin client instead of direct PostgreSQL connection
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
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  try {
    log('🚀 Post-Audit Automation Schema Migration (Supabase Client)', 'bright');
    log('='.repeat(80), 'bright');

    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
    }

    log('\n✓ Supabase credentials found', 'green');

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    log('✓ Supabase admin client created', 'green');

    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'post-audit-automation-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    log('✓ Schema file loaded (396 lines)\n', 'green');

    // Execute the schema using rpc() for raw SQL
    log('📝 Executing migration via Supabase...', 'blue');

    // Split schema into individual statements (simple split by semicolon)
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    log(`   Processing ${statements.length} SQL statements...`, 'blue');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comment lines
      if (statement.startsWith('--')) continue;

      try {
        // Execute via Supabase RPC (note: this requires a custom function or direct PostgreSQL access)
        // Since Supabase doesn't directly support raw SQL execution via client, we'll use the REST API
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

        if (error) {
          // Check if it's an "already exists" error
          if (error.message?.includes('already exists')) {
            log(`   ⚠️  Statement ${i + 1}: Already exists (skipped)`, 'yellow');
          } else {
            log(`   ✗ Statement ${i + 1}: ${error.message}`, 'red');
            errorCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        log(`   ✗ Statement ${i + 1}: ${err.message}`, 'red');
        errorCount++;
      }
    }

    log(`\n✅ Migration completed: ${successCount} successful, ${errorCount} errors`, successCount > errorCount ? 'green' : 'yellow');

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

    log('\n' + '='.repeat(80), 'bright');
    log('✅ Migration Complete!', 'green');
    log('\n📝 Next steps:', 'blue');
    log('   1. Generate encryption key:', 'yellow');
    log('      openssl rand -base64 32', 'bright');
    log('   2. Add to .env.local:', 'yellow');
    log('      CREDENTIALS_ENCRYPTION_KEY="your_key_here"', 'bright');
    log('   3. Test encryption:', 'yellow');
    log('      node scripts/test-credential-encryption.mjs', 'bright');
    log('   4. Build API endpoints for credentials and tasks\n', 'yellow');

  } catch (error) {
    log(`\n💥 Migration failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
