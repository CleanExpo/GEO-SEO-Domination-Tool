#!/usr/bin/env node

import pg from 'pg';
import fs from 'fs';
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

async function runMigration() {
  try {
    console.log('🔧 Adding missing columns to company_portfolios table...\n');

    // Add email column
    await pool.query(`
      ALTER TABLE company_portfolios
      ADD COLUMN IF NOT EXISTS email VARCHAR(255)
    `);
    console.log('✅ Added email column');

    // Add phone column
    await pool.query(`
      ALTER TABLE company_portfolios
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50)
    `);
    console.log('✅ Added phone column');

    // Add target_keywords column
    await pool.query(`
      ALTER TABLE company_portfolios
      ADD COLUMN IF NOT EXISTS target_keywords JSONB
    `);
    console.log('✅ Added target_keywords column');

    // Add target_locations column
    await pool.query(`
      ALTER TABLE company_portfolios
      ADD COLUMN IF NOT EXISTS target_locations JSONB
    `);
    console.log('✅ Added target_locations column');

    // Add content_preferences column
    await pool.query(`
      ALTER TABLE company_portfolios
      ADD COLUMN IF NOT EXISTS content_preferences JSONB
    `);
    console.log('✅ Added content_preferences column');

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_portfolios_email ON company_portfolios(email)
    `);
    console.log('✅ Created email index');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_portfolios_phone ON company_portfolios(phone)
    `);
    console.log('✅ Created phone index');

    console.log('\n✅ Migration completed successfully!\n');

    // Verify columns exist
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'company_portfolios'
      AND column_name IN ('email', 'phone', 'target_keywords', 'target_locations', 'content_preferences')
      ORDER BY column_name
    `);

    console.log('📋 Verified columns:');
    result.rows.forEach(row => {
      console.log(`   ✅ ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
