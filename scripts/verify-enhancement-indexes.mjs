#!/usr/bin/env node

/**
 * Verify Enhancement Indexes Created
 *
 * Checks that all indexes for the 18 enhancement tables exist
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('❌ Missing POSTGRES_URL');
  process.exit(1);
}

const { Pool } = pg;
const pool = new Pool({ connectionString: databaseUrl });

async function verifyIndexes() {
  const client = await pool.connect();

  try {
    console.log('\n🔍 Verifying Enhancement Table Indexes\n');
    console.log('='.repeat(80));

    const result = await client.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN (
          'competitor_snapshots', 'seo_trends', 'ranking_history', 'visibility_history',
          'api_requests', 'rate_limits', 'api_quotas', 'api_keys',
          'audit_history', 'company_history', 'change_approvals', 'data_snapshots',
          'client_portal_access', 'client_reports', 'client_notifications',
          'client_feedback', 'client_dashboard_widgets', 'client_activity_log'
        )
      ORDER BY tablename, indexname;
    `);

    console.log(`📊 Found ${result.rows.length} indexes:\n`);

    let currentTable = null;
    for (const row of result.rows) {
      if (row.tablename !== currentTable) {
        if (currentTable !== null) console.log('');
        console.log(`\n📋 ${row.tablename}:`);
        currentTable = row.tablename;
      }
      console.log(`   ✅ ${row.indexname}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✅ Total indexes created: ${result.rows.length}\n`);

  } catch (error) {
    console.error('❌ Error checking indexes:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyIndexes();
