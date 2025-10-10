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
        AND table_name = 'company_portfolios'
      ) AS exists
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ company_portfolios table does NOT exist!');
      console.log('\n📋 This table needs to be created.');
      process.exit(1);
    }

    console.log('✅ company_portfolios table exists\n');

    // Get table structure
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'company_portfolios'
      ORDER BY ordinal_position
    `);

    console.log('📋 Table structure:');
    structure.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default || 'none'})`);
    });

    // Check for email column specifically
    const hasEmail = structure.rows.some(row => row.column_name === 'email');

    if (!hasEmail) {
      console.log('\n❌ MISSING: "email" column does not exist!');
      console.log('   This is the cause of the error.');
    } else {
      console.log('\n✅ "email" column exists');
    }

    // Get row count
    const count = await pool.query(`SELECT COUNT(*) FROM company_portfolios`);
    console.log(`\n📊 Total records: ${count.rows[0].count}`);

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
