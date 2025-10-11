#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🔍 Checking agent_tasks table structure...\n');

// Try to query and see what columns exist
const { data, error } = await supabase
  .from('agent_tasks')
  .select('*')
  .limit(1);

if (error) {
  console.log('❌ Error:', error.message);
} else {
  if (data && data.length > 0) {
    console.log('✅ Table exists with data. Sample record:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('✅ Table exists but is empty.');
    console.log('\nAttempting to describe table structure...');

    // Insert and immediately delete a test record to see expected structure
    const testRecord = {
      company_id: '00000000-0000-0000-0000-000000000000',
      task_type: 'test',
      category: 'content',
      priority: 'low',
      status: 'pending',
      instructions: {}
    };

    const { error: insertError } = await supabase
      .from('agent_tasks')
      .insert(testRecord)
      .select();

    if (insertError) {
      console.log('\n⚠️  Insert failed. This tells us the table structure:');
      console.log(insertError.message);

      // Check if it has post-audit specific columns
      if (insertError.message.includes('task_type') || insertError.message.includes('category')) {
        console.log('\n✅ This appears to be the POST-AUDIT AUTOMATION version');
      } else {
        console.log('\n⚠️  This appears to be a different agent_tasks table');
      }
    } else {
      console.log('\n✅ Successfully inserted test record - this is POST-AUDIT version');
      // Delete test record
      await supabase
        .from('agent_tasks')
        .delete()
        .eq('company_id', '00000000-0000-0000-0000-000000000000');
    }
  }
}

console.log('');
