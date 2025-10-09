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

async function testCaseInsensitiveSearch() {
  console.log('🧪 Testing case-insensitive TRIM search\n');

  const testCases = [
    { businessName: 'disaster recovery', email: 'phill@disasterrecovery.com.au', description: 'lowercase, no trailing space' },
    { businessName: 'Disaster Recovery', email: 'phill@disasterrecovery.com.au', description: 'exact case, no trailing space' },
    { businessName: 'DISASTER RECOVERY', email: 'PHILL@DISASTERRECOVERY.COM.AU', description: 'uppercase everything' },
    { businessName: '  Disaster Recovery  ', email: '  phill@disasterrecovery.com.au  ', description: 'with extra whitespace' },
  ];

  for (const testCase of testCases) {
    console.log(`📝 Test: ${testCase.description}`);
    console.log(`   Input: businessName="${testCase.businessName}", email="${testCase.email}"`);

    try {
      const result = await pool.query(
        `SELECT business_name, email, current_step
         FROM saved_onboarding
         WHERE LOWER(TRIM(business_name)) = LOWER(TRIM($1))
         AND LOWER(TRIM(email)) = LOWER(TRIM($2))`,
        [testCase.businessName, testCase.email]
      );

      if (result.rows.length > 0) {
        console.log(`   ✅ FOUND: ${result.rows[0].business_name} (${result.rows[0].email})`);
        console.log(`   Step: ${result.rows[0].current_step}\n`);
      } else {
        console.log(`   ❌ NOT FOUND\n`);
      }
    } catch (error) {
      console.error(`   ❌ ERROR: ${error.message}\n`);
    }
  }

  await pool.end();
}

testCaseInsensitiveSearch();
