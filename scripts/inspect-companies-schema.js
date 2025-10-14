#!/usr/bin/env node

/**
 * Inspect Actual Companies Table Schema in Supabase
 *
 * This script queries the actual companies table structure
 * to see what columns really exist.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qwoggbbavikzhypzodcr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  console.log('\n🔍 INSPECTING COMPANIES TABLE SCHEMA\n');

  // Try selecting ALL columns by using SELECT *
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ Sample Row Structure:');
    console.log(JSON.stringify(data[0], null, 2));
    console.log('\n📋 Available Columns:');
    Object.keys(data[0]).forEach(col => {
      console.log(`  - ${col}`);
    });
  } else {
    console.log('⚠️  Table is empty, cannot determine structure from data');
    console.log('   Trying metadata query...\n');

    // Try a metadata query instead
    const testColumns = ['id', 'name', 'website', 'email', 'phone', 'address', 'city', 'state', 'zip', 'industry', 'created_at'];
    const results = {};

    for (const col of testColumns) {
      const { error } = await supabase
        .from('companies')
        .select(col)
        .limit(1);

      results[col] = !error || error.code !== 'PGRST204';
    }

    console.log('📋 Column Existence Check:');
    Object.entries(results).forEach(([col, exists]) => {
      console.log(`  ${exists ? '✅' : '❌'} ${col}`);
    });
  }
}

inspectSchema().catch(error => {
  console.error('\n❌ FATAL ERROR:', error.message);
  process.exit(1);
});
