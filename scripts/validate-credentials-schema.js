/**
 * Validate credentials schema SQL syntax
 * Checks for common PostgreSQL compatibility issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function validateCredentialsSchema() {
  console.log('🔍 Validating Credentials Schema Syntax...\n');

  // Load schema
  const schemaPath = path.join(__dirname, '..', 'database', 'credentials-schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  console.log('✅ Schema file loaded');
  console.log(`   File size: ${(schemaSql.length / 1024).toFixed(2)} KB\n`);

  let errors = [];
  let warnings = [];

  // Check 1: UUID generation
  console.log('1️⃣ Checking UUID generation...');
  const randomBlobPattern = /randomblob\(/gi;
  const randomBlobMatches = schemaSql.match(randomBlobPattern);
  if (randomBlobMatches) {
    errors.push(`   ❌ Found ${randomBlobMatches.length} instance(s) of 'randomblob()' (SQLite-specific)`);
  } else {
    console.log('   ✅ No SQLite-specific UUID generation found');
  }

  const genRandomUuidPattern = /gen_random_uuid\(\)/gi;
  const genRandomUuidMatches = schemaSql.match(genRandomUuidPattern);
  if (genRandomUuidMatches) {
    console.log(`   ✅ Found ${genRandomUuidMatches.length} instances of 'gen_random_uuid()' (PostgreSQL)`);
  }

  // Check 2: pgcrypto extension
  console.log('\n2️⃣ Checking pgcrypto extension...');
  const pgcryptoPattern = /CREATE EXTENSION IF NOT EXISTS "pgcrypto"/gi;
  const pgcryptoMatches = schemaSql.match(pgcryptoPattern);
  if (pgcryptoMatches) {
    console.log('   ✅ pgcrypto extension declared');
  } else {
    errors.push('   ❌ Missing pgcrypto extension (required for gen_random_uuid())');
  }

  // Check 3: Trigger syntax
  console.log('\n3️⃣ Checking trigger syntax...');
  const badTriggerPattern = /CREATE TRIGGER IF NOT EXISTS/gi;
  const badTriggerMatches = schemaSql.match(badTriggerPattern);
  if (badTriggerMatches) {
    errors.push(`   ❌ Found ${badTriggerMatches.length} instance(s) of 'CREATE TRIGGER IF NOT EXISTS' (not supported in PostgreSQL)`);
  } else {
    console.log('   ✅ No invalid trigger syntax found');
  }

  const dropTriggerPattern = /DROP TRIGGER IF EXISTS/gi;
  const dropTriggerMatches = schemaSql.match(dropTriggerPattern);
  if (dropTriggerMatches) {
    console.log(`   ✅ Found ${dropTriggerMatches.length} DROP TRIGGER IF EXISTS statements`);
  }

  const executeFunctionPattern = /EXECUTE FUNCTION/gi;
  const executeFunctionMatches = schemaSql.match(executeFunctionPattern);
  if (executeFunctionMatches) {
    console.log(`   ✅ Found ${executeFunctionMatches.length} EXECUTE FUNCTION statements (modern PostgreSQL syntax)`);
  }

  // Check 4: Table definitions
  console.log('\n4️⃣ Checking table definitions...');
  const tablePattern = /CREATE TABLE IF NOT EXISTS (\w+)/gi;
  const tables = [];
  let match;
  while ((match = tablePattern.exec(schemaSql)) !== null) {
    tables.push(match[1]);
  }

  if (tables.length === 8) {
    console.log(`   ✅ Found all 8 expected tables:`);
    tables.forEach((table, index) => {
      console.log(`      ${index + 1}. ${table}`);
    });
  } else {
    warnings.push(`   ⚠️  Expected 8 tables, found ${tables.length}`);
  }

  // Check 5: UUID types
  console.log('\n5️⃣ Checking UUID type usage...');
  const uuidPrimaryKeyPattern = /id UUID PRIMARY KEY DEFAULT gen_random_uuid\(\)/gi;
  const uuidPrimaryKeyMatches = schemaSql.match(uuidPrimaryKeyPattern);
  if (uuidPrimaryKeyMatches) {
    console.log(`   ✅ Found ${uuidPrimaryKeyMatches.length} UUID primary keys`);
  } else {
    errors.push('   ❌ No UUID primary keys found');
  }

  const textIdPattern = /id TEXT PRIMARY KEY/gi;
  const textIdMatches = schemaSql.match(textIdPattern);
  if (textIdMatches) {
    errors.push(`   ❌ Found ${textIdMatches.length} TEXT primary keys (should be UUID)`);
  }

  const integerIdPattern = /id INTEGER PRIMARY KEY/gi;
  const integerIdMatches = schemaSql.match(integerIdPattern);
  if (integerIdMatches) {
    errors.push(`   ❌ Found ${integerIdMatches.length} INTEGER primary keys (should be UUID)`);
  }

  // Check 6: Foreign key types
  console.log('\n6️⃣ Checking foreign key types...');
  const uuidForeignKeyPattern = /company_id UUID.*REFERENCES companies\(id\)/gi;
  const uuidForeignKeyMatches = schemaSql.match(uuidForeignKeyPattern);
  if (uuidForeignKeyMatches) {
    console.log(`   ✅ Found ${uuidForeignKeyMatches.length} UUID foreign keys to companies(id)`);
  }

  const textForeignKeyPattern = /company_id TEXT.*REFERENCES|credential_id TEXT.*REFERENCES/gi;
  const textForeignKeyMatches = schemaSql.match(textForeignKeyPattern);
  if (textForeignKeyMatches) {
    errors.push(`   ❌ Found ${textForeignKeyMatches.length} TEXT foreign keys (should be UUID)`);
  }

  const integerForeignKeyPattern = /company_id INTEGER.*REFERENCES/gi;
  const integerForeignKeyMatches = schemaSql.match(integerForeignKeyPattern);
  if (integerForeignKeyMatches) {
    errors.push(`   ❌ Found ${integerForeignKeyMatches.length} INTEGER foreign keys (should be UUID)`);
  }

  // Check 7: Encryption columns
  console.log('\n7️⃣ Checking encryption columns...');
  const encryptionPattern = /encrypted_data TEXT NOT NULL.*encryption_iv TEXT NOT NULL.*encryption_tag TEXT NOT NULL/gs;
  if (encryptionPattern.test(schemaSql)) {
    console.log('   ✅ Encryption columns found (encrypted_data, encryption_iv, encryption_tag)');
  } else {
    warnings.push('   ⚠️  Could not verify encryption column structure');
  }

  // Check 8: Trigger function
  console.log('\n8️⃣ Checking trigger function...');
  const triggerFunctionPattern = /CREATE OR REPLACE FUNCTION update_timestamp\(\)/gi;
  if (triggerFunctionPattern.test(schemaSql)) {
    console.log('   ✅ update_timestamp() function defined');
  } else {
    errors.push('   ❌ Missing update_timestamp() trigger function');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(60));

  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ ALL CHECKS PASSED! Schema is PostgreSQL-compatible.\n');
    console.log('Key validations:');
    console.log('  ✅ pgcrypto extension enabled');
    console.log('  ✅ UUID generation using gen_random_uuid()');
    console.log('  ✅ All triggers use PostgreSQL syntax');
    console.log('  ✅ All 8 tables defined');
    console.log('  ✅ UUID types used for all IDs and foreign keys');
    console.log('  ✅ Proper encryption column structure');
    console.log('  ✅ Reusable trigger function defined\n');
    return true;
  }

  if (errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:\n');
    errors.forEach(error => console.log(error));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    warnings.forEach(warning => console.log(warning));
  }

  console.log('\n');
  return errors.length === 0;
}

const isValid = validateCredentialsSchema();
process.exit(isValid ? 0 : 1);
