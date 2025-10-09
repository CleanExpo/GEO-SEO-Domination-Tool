#!/usr/bin/env node

import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkTable() {
  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'saved_onboarding'
      ) AS exists
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ saved_onboarding table does NOT exist!');
      console.log('\n🔧 You need to create it. Run:');
      console.log('   1. Open Supabase SQL Editor');
      console.log('   2. Run database/supabase-saved-onboarding.sql');
      process.exit(1);
    }

    console.log('✅ saved_onboarding table exists\n');

    // Get table structure
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'saved_onboarding'
      ORDER BY ordinal_position
    `);

    console.log('📋 Table structure:');
    structure.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Get all saved records
    const records = await pool.query(`
      SELECT
        id,
        business_name,
        email,
        current_step,
        last_saved,
        SUBSTRING(form_data::TEXT, 1, 100) as form_data_preview
      FROM saved_onboarding
      ORDER BY last_saved DESC
    `);

    console.log(`\n📊 Total records: ${records.rows.length}`);

    if (records.rows.length > 0) {
      console.log('\n📝 Saved records:');
      records.rows.forEach((record, idx) => {
        console.log(`\n   ${idx + 1}. ID: ${record.id}`);
        console.log(`      Business: ${record.business_name}`);
        console.log(`      Email: ${record.email}`);
        console.log(`      Current Step: ${record.current_step}`);
        console.log(`      Last Saved: ${record.last_saved}`);
        console.log(`      Form Data Preview: ${record.form_data_preview}...`);
      });

      // Get full form_data for first record to inspect structure
      const firstRecord = await pool.query(`
        SELECT form_data FROM saved_onboarding WHERE id = $1
      `, [records.rows[0].id]);

      console.log(`\n🔍 Full form_data structure (first record):`);
      console.log(JSON.stringify(firstRecord.rows[0].form_data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
  } finally {
    await pool.end();
  }
}

checkTable();
