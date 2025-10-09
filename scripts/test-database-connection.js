#!/usr/bin/env node

/**
 * Test Database Connection
 * Tests if your DATABASE_URL is valid
 */

const { Pool } = require('pg');

// Get DATABASE_URL from command line argument
const connectionString = process.argv[2];

if (!connectionString) {
  console.log('❌ Usage: node scripts/test-database-connection.js "postgresql://..."');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/test-database-connection.js "postgresql://postgres.qwoggbbavikzhypzodcr:PASSWORD@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres"');
  process.exit(1);
}

console.log('🧪 Testing Database Connection\n');
console.log('📍 Connection String:', connectionString.replace(/:[^:@]+@/, ':***@'));
console.log('');

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('⏳ Connecting to database...');

    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Connection successful!');
    console.log('');

    // Get database info
    const result = await client.query(`
      SELECT
        current_database() as database,
        current_user as user,
        version() as version,
        pg_size_pretty(pg_database_size(current_database())) as size
    `);

    const info = result.rows[0];
    console.log('📊 Database Information:');
    console.log('─'.repeat(60));
    console.log(`Database: ${info.database}`);
    console.log(`User:     ${info.user}`);
    console.log(`Size:     ${info.size}`);
    console.log(`Version:  ${info.version.split(',')[0]}`);
    console.log('─'.repeat(60));
    console.log('');

    // Check if saved_onboarding table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'saved_onboarding'
      );
    `);

    const tableExists = tableCheck.rows[0].exists;
    console.log(`Table 'saved_onboarding': ${tableExists ? '✅ EXISTS' : '❌ MISSING'}`);

    if (!tableExists) {
      console.log('');
      console.log('⚠️  The saved_onboarding table needs to be created.');
      console.log('Run the SQL script from SUPABASE_CONFIG_FIX.md in Supabase SQL Editor.');
    }

    // Check bytebot_tasks table
    const bytebotCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'bytebot_tasks'
      );
    `);

    const bytebotExists = bytebotCheck.rows[0].exists;
    console.log(`Table 'bytebot_tasks':    ${bytebotExists ? '✅ EXISTS' : '❌ MISSING'}`);

    console.log('');
    console.log('🎉 Database connection is working correctly!');
    console.log('');
    console.log('✅ Next steps:');
    if (!tableExists || !bytebotExists) {
      console.log('1. Create missing tables in Supabase SQL Editor');
      console.log('2. Update DATABASE_URL in Vercel with this connection string');
      console.log('3. Redeploy application');
    } else {
      console.log('1. Update DATABASE_URL in Vercel with this connection string');
      console.log('2. Redeploy application');
      console.log('3. Test production API');
    }

    client.release();
    await pool.end();

  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('');
    console.error('Error:', error.message);
    console.error('');

    if (error.message.includes('password authentication failed')) {
      console.error('💡 Issue: Invalid password');
      console.error('   Solution: Reset database password in Supabase dashboard');
    } else if (error.message.includes('does not exist')) {
      console.error('💡 Issue: Database or user does not exist');
      console.error('   Solution: Verify project ID is qwoggbbavikzhypzodcr');
    } else if (error.message.includes('timeout')) {
      console.error('💡 Issue: Connection timeout');
      console.error('   Solution: Check firewall or use pooler (port 6543)');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('💡 Issue: Host not found');
      console.error('   Solution: Verify host is aws-0-ap-southeast-2.pooler.supabase.com');
    }

    await pool.end();
    process.exit(1);
  }
}

testConnection();
