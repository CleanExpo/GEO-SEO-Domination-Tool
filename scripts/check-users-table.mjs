#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('Checking users table...\n');

// Try to query users table
const { data, error } = await supabase
  .from('users')
  .select('id')
  .limit(1);

if (error) {
  console.log('❌ Error querying users table:', error.message);
  console.log('\nChecking if table exists in auth schema instead of public...');
} else {
  console.log('✅ Users table exists and is accessible');
  console.log('Data:', data);
}

// Check subscription_tiers table
const { data: tiers, error: tierError } = await supabase
  .from('subscription_tiers')
  .select('id')
  .limit(1);

if (tierError) {
  console.log('\n❌ subscription_tiers table missing:', tierError.message);
} else {
  console.log('\n✅ subscription_tiers table exists');
}
