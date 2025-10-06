#!/usr/bin/env node

/**
 * Quick script to run migration 011 on Supabase production database
 * Run: node scripts/run-migration-011.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../web-app/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in web-app/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('📋 Reading migration file...');

  const migrationPath = path.join(__dirname, '../database/migrations/011_add_sandbox_tasks.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  // Remove ROLLBACK section
  const sqlToRun = migrationSQL.split('-- ROLLBACK:')[0].trim();

  console.log('🚀 Running migration 011...\n');

  try {
    // Execute migration SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_string: sqlToRun
    });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('\nPlease run this migration manually in Supabase SQL Editor:');
      console.error('1. Go to https://supabase.com/dashboard');
      console.error('2. Select your project');
      console.error('3. Click SQL Editor');
      console.error('4. Copy and paste the contents of:');
      console.error('   database/migrations/011_add_sandbox_tasks.sql');
      console.error('5. Click Run');
      process.exit(1);
    }

    console.log('✅ Migration 011 completed successfully!\n');
    console.log('Created:');
    console.log('  - sandbox_tasks table');
    console.log('  - Indexes (session, status, agent, created_at, cost)');
    console.log('  - Constraints (status_check, agent_check)');
    console.log('  - Auto-update timestamp trigger');
    console.log('  - sandbox_task_analytics view');
    console.log('  - Updated active_sandbox_sessions view');
    console.log('  - Updated get_sandbox_session_stats() function');
    console.log('\n🎉 Your site should now work at:');
    console.log('   https://geo-seo-domination-tool.vercel.app/');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.error('\nPlease run the migration manually in Supabase SQL Editor.');
    console.error('See instructions above.');
    process.exit(1);
  }
}

// Verify tables exist after migration
async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');

  const { data: tasks, error: tasksError } = await supabase
    .from('sandbox_tasks')
    .select('id')
    .limit(1);

  if (tasksError && tasksError.code === 'PGRST204') {
    console.log('✅ sandbox_tasks table exists (empty)');
  } else if (tasksError) {
    console.error('⚠️  Could not verify sandbox_tasks table:', tasksError.message);
  } else {
    console.log(`✅ sandbox_tasks table exists (${tasks ? tasks.length : 0} records)`);
  }

  const { data: sessions, error: sessionsError } = await supabase
    .from('sandbox_sessions')
    .select('id')
    .limit(1);

  if (sessionsError && sessionsError.code === 'PGRST204') {
    console.log('✅ sandbox_sessions table exists (empty)');
  } else if (sessionsError) {
    console.error('⚠️  Could not verify sandbox_sessions table:', sessionsError.message);
  } else {
    console.log(`✅ sandbox_sessions table exists (${sessions ? sessions.length : 0} records)`);
  }
}

// Run migration
console.log('════════════════════════════════════════════════════════');
console.log('  Migration 011: Add sandbox_tasks table');
console.log('════════════════════════════════════════════════════════\n');

runMigration()
  .then(() => verifyMigration())
  .then(() => {
    console.log('\n════════════════════════════════════════════════════════');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Error:', err.message);
    console.error('\nPlease run migration manually in Supabase SQL Editor.');
    process.exit(1);
  });
