#!/usr/bin/env node

import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- =====================================================
-- Onboarding Sessions Table for PostgreSQL/Supabase
-- =====================================================

CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id TEXT PRIMARY KEY,
  company_id TEXT,

  -- Business Information
  business_name TEXT NOT NULL,
  industry TEXT,
  email TEXT NOT NULL,
  phone TEXT,

  -- Progress Tracking
  status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'completed', 'failed')),
  current_step TEXT,

  -- Request Data (full intake form stored as JSONB in PostgreSQL)
  request_data JSONB,

  -- Step Progress Data (stored as JSONB in PostgreSQL)
  steps_data JSONB,

  -- Error Tracking
  error TEXT,

  -- Timestamps (use TIMESTAMP WITH TIME ZONE for PostgreSQL)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON onboarding_sessions(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_email ON onboarding_sessions(email);
CREATE INDEX IF NOT EXISTS idx_onboarding_created ON onboarding_sessions(created_at DESC);

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth setup)
CREATE POLICY "Allow all operations on onboarding_sessions" ON onboarding_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);
`;

async function createTable() {
  try {
    console.log('🔧 Creating onboarding_sessions table...\n');

    // Execute SQL
    await pool.query(sql);

    console.log('✅ Table created successfully!\n');

    // Verify table exists
    const result = await pool.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'onboarding_sessions'
      ORDER BY ordinal_position
    `);

    console.log('📋 Table structure:');
    result.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type}`);
    });

    console.log('\n✅ onboarding_sessions table is ready!');

  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTable();
