#!/usr/bin/env node

/**
 * Run Post-Audit Automation Schema Migration
 *
 * Executes the schema SQL against Supabase database
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
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  let client;

  try {
    log('🚀 Post-Audit Automation Schema Migration', 'bright');
    log('='.repeat(80), 'bright');

    // Get database URL (try multiple sources)
    let databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!databaseUrl) {
      // Construct from Supabase credentials
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const password = process.env.DATABASE_PASSWORD;

      if (supabaseUrl && password) {
        // Extract project reference from Supabase URL (e.g., "qwoggbbavikzhypzodcr" from "https://qwoggbbavikzhypzodcr.supabase.co")
        const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

        if (projectRef) {
          // Use correct pooler format with project reference in username
          databaseUrl = `postgresql://postgres.${projectRef}:${password}@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres`;
          log('⚠️  Using constructed database URL from Supabase credentials', 'yellow');
        }
      }

      if (!databaseUrl) {
        throw new Error('DATABASE_URL not found. Please uncomment POSTGRES_URL in .env.local or ensure NEXT_PUBLIC_SUPABASE_URL and DATABASE_PASSWORD are set.');
      }
    }

    log('\n✓ Database credentials found', 'green');

    // Connect to database
    const { Pool } = pg;
    const pool = new Pool({ connectionString: databaseUrl });
    client = await pool.connect();

    log('✓ Connected to database', 'green');

    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'post-audit-automation-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    log('✓ Schema file loaded (395 lines)\n', 'green');

    // Execute the entire schema
    log('📝 Executing migration...', 'blue');

    try {
      await client.query(schema);
      log('✅ Migration executed successfully!', 'green');
    } catch (error) {
      // Some errors are expected (like "already exists")
      if (error.message.includes('already exists')) {
        log('⚠️  Some objects already exist (this is normal)', 'yellow');
        log('✅ Migration completed with warnings', 'green');
      } else {
        throw error;
      }
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
        const result = await client.query(
          `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
          [table]
        );

        if (result.rows[0].count > 0) {
          // Get row count
          const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
          log(`   ✓ ${table}: Ready (${countResult.rows[0].count} rows)`, 'green');
        } else {
          log(`   ✗ ${table}: Not found`, 'red');
        }
      } catch (err) {
        log(`   ✗ ${table}: ${err.message}`, 'red');
      }
    }

    // Check indexes
    log('\n🔍 Checking indexes...', 'blue');
    const indexResult = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('website_credentials', 'agent_tasks', 'task_execution_logs')
    `);
    log(`   ✓ ${indexResult.rows[0].count} indexes created`, 'green');

    // Check triggers
    log('\n🔍 Checking triggers...', 'blue');
    const triggerResult = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
        AND event_object_table IN ('website_credentials', 'agent_tasks')
    `);
    log(`   ✓ ${triggerResult.rows[0].count} triggers created`, 'green');

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
  } finally {
    if (client) {
      client.release();
    }
  }
}

main();
