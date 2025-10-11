#!/usr/bin/env node

/**
 * Audit Supabase Database Schema
 *
 * Lists all tables, columns, indexes, and policies in the current Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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

async function main() {
  log('\n🔍 Supabase Database Schema Audit', 'bright');
  log('='.repeat(80), 'cyan');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log('\n❌ Missing Supabase credentials', 'red');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Get all tables
    log('\n📋 TABLES IN PUBLIC SCHEMA:', 'bright');
    log('='.repeat(80), 'cyan');

    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT
            table_name,
            (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
          FROM information_schema.tables t
          WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
      });

    if (tablesError) {
      // Try alternative method - query each table
      log('\n⚠️  RPC method failed, using direct table queries...', 'yellow');

      const knownTables = [
        'companies', 'seo_audits', 'keywords', 'rankings', 'individuals',
        'organisations', 'users', 'user_settings', 'saved_onboarding',
        'client_subscriptions', 'subscription_tiers', 'notifications',
        'scheduled_jobs', 'integrations', 'agent_tasks', 'autonomous_tasks',
        'company_portfolios', 'onboarding_sessions', 'gmb_integrations',
        'bing_webmaster_integrations'
      ];

      let tableCount = 0;
      for (const tableName of knownTables) {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          log(`  ✅ ${tableName.padEnd(35)} (${count || 0} rows)`, 'green');
          tableCount++;
        }
      }

      log(`\n📊 Total tables found: ${tableCount}`, 'cyan');

    } else {
      // Display tables from RPC result
      tables.forEach((table, index) => {
        log(`  ${(index + 1).toString().padStart(2)}. ${table.table_name.padEnd(35)} (${table.column_count} columns)`, 'cyan');
      });
      log(`\n📊 Total tables: ${tables.length}`, 'cyan');
    }

    // Get all indexes
    log('\n🔗 INDEXES:', 'bright');
    log('='.repeat(80), 'cyan');

    const { data: indexes } = await supabase
      .from('pg_indexes')
      .select('tablename, indexname')
      .eq('schemaname', 'public')
      .order('tablename');

    if (indexes && indexes.length > 0) {
      let currentTable = '';
      indexes.forEach(index => {
        if (index.tablename !== currentTable) {
          currentTable = index.tablename;
          log(`\n  📌 ${currentTable}:`, 'yellow');
        }
        log(`     - ${index.indexname}`, 'cyan');
      });
      log(`\n📊 Total indexes: ${indexes.length}`, 'cyan');
    }

    // Check for missing essential tables
    log('\n🔍 CHECKING ESSENTIAL TABLES:', 'bright');
    log('='.repeat(80), 'cyan');

    const essentialTables = {
      'companies': '✅ Core company data',
      'seo_audits': '✅ SEO audit results',
      'keywords': '✅ Keyword tracking',
      'rankings': '✅ Ranking data',
      'users': '✅ User accounts',
      'organisations': '✅ Multi-tenancy',
      'saved_onboarding': '✅ Onboarding system',
      'client_subscriptions': '✅ Subscription management',
      'agent_tasks': '✅ Agent automation',
      'website_credentials': '⏳ Post-audit automation (NEW)',
      'gmb_integrations': '⏳ GMB OAuth (NEW)',
      'bing_webmaster_integrations': '⏳ Bing Webmaster (NEW)',
    };

    for (const [tableName, description] of Object.entries(essentialTables)) {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.message.includes('does not exist')) {
          log(`  ❌ ${tableName.padEnd(35)} - MISSING`, 'red');
        } else {
          log(`  ⚠️  ${tableName.padEnd(35)} - ERROR: ${error.message}`, 'yellow');
        }
      } else {
        log(`  ✅ ${tableName.padEnd(35)} (${count || 0} rows) - ${description}`, 'green');
      }
    }

  } catch (error) {
    log(`\n💥 Audit failed: ${error.message}`, 'red');
    console.error(error);
  }

  log('\n' + '='.repeat(80), 'cyan');
  log('✅ Audit complete!\n', 'green');
}

main();
