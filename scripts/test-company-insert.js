const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwoggbbavikzhypzodcr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3b2dnYmJhdmlremh5cHpvZGNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM2NjgxOSwiZXhwIjoyMDc0OTQyODE5fQ.anCfcuP_ruzof_tY_dCHXOFWR_0ra2hS_GZSuLKRqrk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('1. Checking existing companies table schema...');

  // First, try to select all columns to see what exists
  const { data: existing, error: selectError } = await supabase
    .from('companies')
    .select('*')
    .limit(1);

  if (selectError) {
    console.error('❌ Select error:', selectError);
  } else if (existing && existing.length > 0) {
    console.log('✅ Existing columns:', Object.keys(existing[0]));
  } else {
    console.log('⚠️  No companies found, trying minimal insert...');
  }

  console.log('\n2. Testing insert WITHOUT address column...');

  const { data, error } = await supabase
    .from('companies')
    .insert([{
      name: 'Test Company',
      website: 'https://test.com',
      industry: 'Test',
      contact_name: 'Test User',
      contact_email: 'test@test.com',
      contact_phone: '1234567890',
      // address: '123 Test St',  // REMOVED - column doesn't exist
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString()
    }])
    .select('id')
    .single();

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Success! Company ID:', data.id);

    // Clean up
    await supabase.from('companies').delete().eq('id', data.id);
    console.log('✅ Test company deleted');
  }
}

testInsert();
