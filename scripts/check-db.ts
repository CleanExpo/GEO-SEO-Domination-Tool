#!/usr/bin/env node
/**
 * Database Connectivity and Schema Validator
 *
 * Checks database connectivity, validates schema, and ensures RLS is enabled.
 */

import { createClient } from '@supabase/supabase-js';
import * as pg from 'pg';

interface DBCheckResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

const REQUIRED_TABLES = [
  'organisations',
  'organisation_members',
  'companies',
  'keywords',
  'rankings',
  'seo_audits',
  'notifications',
  'user_settings',
];

const RLS_ENABLED_TABLES = [
  'organisations',
  'organisation_members',
  'companies',
  'keywords',
  'rankings',
  'seo_audits',
  'notifications',
  'user_settings',
];

async function checkDatabaseConnection(): Promise<DBCheckResult> {
  const result: DBCheckResult = {
    success: true,
    errors: [],
    warnings: [],
  };

  console.log('🔍 Checking database connectivity and schema...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  if (!supabaseUrl || !supabaseKey) {
    result.errors.push('❌ Missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
    result.success = false;
    return result;
  }

  if (!databaseUrl) {
    result.errors.push('❌ Missing DATABASE_URL environment variable');
    result.success = false;
    return result;
  }

  // Test Supabase connection
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('organisations').select('count').limit(1);

    if (error) {
      result.errors.push(`❌ Supabase connection failed: ${error.message}`);
      result.success = false;
    } else {
      console.log('✅ Supabase connection successful');
    }
  } catch (error: any) {
    result.errors.push(`❌ Supabase connection error: ${error.message}`);
    result.success = false;
  }

  // Test direct PostgreSQL connection
  try {
    const pool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    });

    const client = await pool.connect();
    console.log('✅ Direct PostgreSQL connection successful');

    // Check for required tables
    const { rows: tables } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    const existingTables = tables.map((row) => row.table_name);

    for (const requiredTable of REQUIRED_TABLES) {
      if (!existingTables.includes(requiredTable)) {
        result.errors.push(`❌ Missing required table: ${requiredTable}`);
        result.success = false;
      } else {
        console.log(`✅ Table exists: ${requiredTable}`);
      }
    }

    // Check RLS policies
    const { rows: rlsStatus } = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename = ANY($1)
    `, [RLS_ENABLED_TABLES]);

    for (const row of rlsStatus) {
      if (!row.rowsecurity) {
        result.warnings.push(`⚠️  RLS not enabled on table: ${row.tablename}`);
      } else {
        console.log(`✅ RLS enabled: ${row.tablename}`);
      }
    }

    // Check for migrations table
    const { rows: migrations } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'migrations'
    `);

    if (migrations.length === 0) {
      result.warnings.push('⚠️  No migrations table found - database may not be initialized');
    } else {
      const { rows: appliedMigrations } = await client.query(`
        SELECT name, applied_at
        FROM migrations
        ORDER BY applied_at DESC
        LIMIT 5
      `);

      console.log('\n📋 Recent migrations:');
      appliedMigrations.forEach((migration) => {
        console.log(`   - ${migration.name} (${new Date(migration.applied_at).toISOString()})`);
      });
    }

    client.release();
    await pool.end();
  } catch (error: any) {
    result.errors.push(`❌ PostgreSQL connection error: ${error.message}`);
    result.success = false;
  }

  return result;
}

async function main() {
  const result = await checkDatabaseConnection();

  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    result.warnings.forEach((warning) => console.log(warning));
  }

  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:\n');
    result.errors.forEach((error) => console.log(error));
    console.log('\n💡 TIP: Run database migrations first: npm run db:migrate\n');
    process.exit(1);
  }

  console.log('\n✅ Database connectivity and schema validated successfully!\n');
  process.exit(0);
}

main();
