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

async function verifyTable() {
  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'onboarding_sessions'
      ) AS exists
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ onboarding_sessions table does not exist');
      process.exit(1);
    }

    console.log('✅ onboarding_sessions table exists\n');

    // Get table structure
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'onboarding_sessions'
      ORDER BY ordinal_position
    `);

    console.log('📋 Table structure:');
    structure.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check row count
    const countResult = await pool.query(`SELECT COUNT(*) as count FROM onboarding_sessions`);
    console.log(`\n📊 Current rows: ${countResult.rows[0].count}`);

    // Test insert
    const testId = `test_${Date.now()}`;
    console.log(`\n🧪 Testing insert with ID: ${testId}`);

    await pool.query(`
      INSERT INTO onboarding_sessions (
        id, business_name, email, status, created_at
      ) VALUES ($1, $2, $3, $4, NOW())
    `, [testId, 'Test Business', 'test@example.com', 'pending']);

    console.log('✅ Insert successful');

    // Clean up test row
    await pool.query(`DELETE FROM onboarding_sessions WHERE id = $1`, [testId]);
    console.log('✅ Test row deleted');

    console.log('\n✅ Table is fully operational!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    if (error.detail) {
      console.error('   Details:', error.detail);
    }
  } finally {
    await pool.end();
  }
}

verifyTable();
