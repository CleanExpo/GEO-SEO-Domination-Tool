const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qwoggbbavikzhypzodcr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3b2dnYmJhdmlremh5cHpvZGNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM2NjgxOSwiZXhwIjoyMDc0OTQyODE5fQ.anCfcuP_ruzof_tY_dCHXOFWR_0ra2hS_GZSuLKRqrk'
);

async function checkSchema() {
  console.log('🔍 Checking production database schema...\n');

  // Check companies table
  const { data: companies, error: compError } = await supabase
    .from('companies')
    .select('*')
    .limit(1);

  if (compError) {
    console.log('❌ Companies table error:', compError.message);
  } else if (companies && companies.length > 0) {
    console.log('✅ Companies table columns:', Object.keys(companies[0]));
  } else {
    console.log('⚠️  Companies table exists but is empty');
    console.log('   Need to check information_schema for column list');
  }

  // Check credentials table
  const { data: creds, error: credError } = await supabase
    .from('credentials')
    .select('*')
    .limit(1);

  if (credError) {
    console.log('\n❌ Credentials table:', credError.message);
    console.log('   Action: Need to run database/integrations-schema.sql');
  } else {
    console.log('\n✅ Credentials table exists');
    if (creds && creds.length > 0) {
      console.log('   Columns:', Object.keys(creds[0]));
    }
  }
}

checkSchema();
