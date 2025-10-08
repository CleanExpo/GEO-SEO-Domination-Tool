#!/usr/bin/env node

/**
 * Test database client methods directly
 */

import { getDatabase } from '../lib/db.js';

async function testDatabaseMethods() {
  console.log('Testing DatabaseClient methods...\n');

  try {
    const db = getDatabase();
    console.log('✓ getDatabase() called successfully');
    console.log('  Database type:', db.getType());

    await db.initialize();
    console.log('✓ Database initialized');

    // Test queryOne
    console.log('\nTesting queryOne method...');
    const existing = await db.queryOne(
      `SELECT id FROM saved_onboarding WHERE business_name = ? AND email = ?`,
      ['Test Company', 'test@example.com']
    );
    console.log('✓ queryOne executed:', existing);

    // Test query (INSERT)
    console.log('\nTesting query method (INSERT)...');
    const testData = {
      businessName: 'Method Test Company',
      email: 'methodtest@example.com',
      formData: { test: 'data' },
      currentStep: 1
    };

    await db.query(
      `INSERT OR REPLACE INTO saved_onboarding (business_name, email, form_data, current_step, last_saved)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [testData.businessName, testData.email, JSON.stringify(testData.formData), testData.currentStep]
    );
    console.log('✓ INSERT query executed');

    // Verify insert
    const verify = await db.queryOne(
      `SELECT * FROM saved_onboarding WHERE business_name = ? AND email = ?`,
      [testData.businessName, testData.email]
    );
    console.log('✓ Verification query:', verify);

    console.log('\n✓ All database method tests PASSED!');
  } catch (error) {
    console.error('\n❌ Database method test FAILED:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testDatabaseMethods();
