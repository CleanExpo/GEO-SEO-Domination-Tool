/**
 * Add missing 'address' column to companies table
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addAddressColumn() {
  console.log('🔧 Adding address column to companies table...');

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE companies
      ADD COLUMN IF NOT EXISTS address TEXT;
    `
  });

  if (error) {
    // Try direct SQL if RPC doesn't work
    console.log('Trying direct ALTER TABLE...');

    const { error: directError } = await supabase
      .from('companies')
      .select('address')
      .limit(1);

    if (directError && directError.code === '42703') {
      console.error('❌ Column does not exist. Need to use Supabase SQL Editor to run:');
      console.log('\nALTER TABLE companies ADD COLUMN address TEXT;\n');
      process.exit(1);
    } else {
      console.log('✅ Address column already exists');
    }
  } else {
    console.log('✅ Address column added successfully');
  }
}

addAddressColumn();
