#!/usr/bin/env node

/**
 * Test saved_onboarding table and save/load functionality
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');
const db = new Database(dbPath);

console.log('='.repeat(50));
console.log('Testing saved_onboarding Table');
console.log('='.repeat(50));
console.log('');

// Check if table exists
console.log('1. Checking if saved_onboarding table exists...');
const tableCheck = db.prepare(`
  SELECT name FROM sqlite_master WHERE type='table' AND name='saved_onboarding'
`).get();

if (!tableCheck) {
  console.log('❌ saved_onboarding table does NOT exist!');
  console.log('Creating table...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_onboarding (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_name TEXT NOT NULL,
      email TEXT NOT NULL,
      form_data TEXT NOT NULL,
      current_step INTEGER DEFAULT 0,
      last_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(business_name, email)
    );

    CREATE INDEX IF NOT EXISTS idx_saved_onboarding_lookup
    ON saved_onboarding(business_name, email);

    CREATE INDEX IF NOT EXISTS idx_saved_onboarding_email
    ON saved_onboarding(email);
  `);

  console.log('✓ Table created successfully');
} else {
  console.log('✓ saved_onboarding table exists');
}

// Show schema
console.log('\n2. Table schema:');
const schema = db.prepare(`SELECT sql FROM sqlite_master WHERE name='saved_onboarding'`).get();
console.log(schema.sql);

// Show existing data
console.log('\n3. Existing records:');
const records = db.prepare(`SELECT * FROM saved_onboarding`).all();
console.log(`Found ${records.length} records`);
if (records.length > 0) {
  records.forEach((record, i) => {
    console.log(`\nRecord ${i + 1}:`);
    console.log(`  ID: ${record.id}`);
    console.log(`  Business: ${record.business_name}`);
    console.log(`  Email: ${record.email}`);
    console.log(`  Step: ${record.current_step}`);
    console.log(`  Last Saved: ${record.last_saved}`);
  });
}

// Test insert
console.log('\n4. Testing INSERT...');
const testData = {
  businessName: 'Test Business',
  email: 'test@example.com',
  formData: JSON.stringify({
    businessName: 'Test Business',
    email: 'test@example.com',
    industry: 'Testing',
    contactName: 'Test User'
  }),
  currentStep: 1
};

try {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO saved_onboarding (business_name, email, form_data, current_step, last_saved)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  const result = insert.run(
    testData.businessName,
    testData.email,
    testData.formData,
    testData.currentStep
  );

  console.log(`✓ Insert successful! Row ID: ${result.lastInsertRowid}`);
} catch (error) {
  console.log(`❌ Insert failed: ${error.message}`);
}

// Test select
console.log('\n5. Testing SELECT...');
try {
  const select = db.prepare(`
    SELECT * FROM saved_onboarding WHERE business_name = ? AND email = ?
  `);

  const result = select.get(testData.businessName, testData.email);

  if (result) {
    console.log('✓ Select successful!');
    console.log(`  Business: ${result.business_name}`);
    console.log(`  Email: ${result.email}`);
    console.log(`  Step: ${result.current_step}`);
    console.log(`  Form Data: ${result.form_data.substring(0, 50)}...`);
  } else {
    console.log('❌ No record found');
  }
} catch (error) {
  console.log(`❌ Select failed: ${error.message}`);
}

// Show final count
console.log('\n6. Final record count:');
const finalCount = db.prepare(`SELECT COUNT(*) as count FROM saved_onboarding`).get();
console.log(`Total records: ${finalCount.count}`);

console.log('\n' + '='.repeat(50));
console.log('✓ Database test complete!');
console.log('='.repeat(50));

db.close();
