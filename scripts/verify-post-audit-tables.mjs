#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const postAuditTables = [
  'website_credentials',
  'agent_tasks',
  'task_execution_logs',
  'task_templates',
  'credentials_access_log',
  'automation_rules'
];

console.log('\n🔍 Verifying Post-Audit Automation Tables:\n');

for (const table of postAuditTables) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.log(`❌ ${table.padEnd(30)} - MISSING`);
  } else {
    console.log(`✅ ${table.padEnd(30)} (${count || 0} rows)`);
  }
}

console.log('');
