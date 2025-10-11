#!/usr/bin/env node

/**
 * Verify Enhancement Tables Created
 *
 * Checks that all 18 enhancement tables exist in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const enhancementTables = [
  // Analytics (4)
  'competitor_snapshots',
  'seo_trends',
  'ranking_history',
  'visibility_history',

  // Rate Limiting (4)
  'api_requests',
  'rate_limits',
  'api_quotas',
  'api_keys',

  // Audit History (4)
  'audit_history',
  'company_history',
  'change_approvals',
  'data_snapshots',

  // Client Portal (6)
  'client_portal_access',
  'client_reports',
  'client_notifications',
  'client_feedback',
  'client_dashboard_widgets',
  'client_activity_log'
];

console.log('\n🔍 Verifying 18 Enhancement Tables\n');
console.log('='.repeat(80));

let successCount = 0;
let failCount = 0;

for (const tableName of enhancementTables) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ ${tableName.padEnd(30)} - NOT FOUND: ${error.message}`);
      failCount++;
    } else {
      console.log(`✅ ${tableName.padEnd(30)} - EXISTS (${count} rows)`);
      successCount++;
    }
  } catch (err) {
    console.log(`❌ ${tableName.padEnd(30)} - ERROR: ${err.message}`);
    failCount++;
  }
}

console.log('='.repeat(80));
console.log(`\n📊 Results: ${successCount}/18 tables created`);

if (successCount === 18) {
  console.log('✅ All enhancement tables created successfully!\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${failCount} tables missing or inaccessible\n`);
  process.exit(1);
}
