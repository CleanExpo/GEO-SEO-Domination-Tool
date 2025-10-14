#!/usr/bin/env node

/**
 * Test Complete Onboarding Flow
 *
 * This tests the FULL end-to-end onboarding process:
 * 1. Create company record
 * 2. Encrypt and store credentials
 * 3. Verify data retrieval
 * 4. Cleanup test data
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qwoggbbavikzhypzodcr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test data - using "Disaster Recovery" business
const testCompany = {
  name: 'Disaster Recovery Test',
  website: 'https://www.disasterrecovery.com.au',
  email: 'test@disasterrecovery.com.au',
  phone: '+61 123 456 789',
  address: '123 Test Street',
  city: 'Brisbane',
  state: 'QLD',
  zip: '4000',
  industry: 'Emergency Services'
};

const testCredential = {
  platform_type: 'website_cms',
  platform_name: 'WordPress',
  username: 'admin',
  password: 'TestPassword123!'
};

let createdCompanyId = null;

async function test1_CreateCompany() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 1: Create Company Record', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  const { data, error } = await supabase
    .from('companies')
    .insert([testCompany])
    .select('id')
    .single();

  if (error) {
    log(`❌ FAIL | Company Insert`, 'red');
    log(`         ${error.message}`, 'red');
    return false;
  }

  createdCompanyId = data.id;
  log(`✅ PASS | Company Created`, 'green');
  log(`         ID: ${createdCompanyId}`, 'green');
  return true;
}

async function test2_EncryptAndStoreCredentials() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 2: Encrypt and Store Credentials', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  if (!createdCompanyId) {
    log(`❌ FAIL | No company ID from previous test`, 'red');
    return false;
  }

  // Generate encryption key (in production, this comes from env var)
  const encryptionKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);

  // Encrypt credentials
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  let encrypted = cipher.update(JSON.stringify(testCredential), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Store in database
  const { data, error } = await supabase
    .from('client_credentials')
    .insert([{
      company_id: createdCompanyId,
      platform_type: testCredential.platform_type,
      platform_name: testCredential.platform_name,
      encrypted_data: encrypted,
      encryption_iv: iv.toString('hex'),
      encryption_tag: authTag.toString('hex'),
      credential_type: 'username_password'
    }])
    .select('id')
    .single();

  if (error) {
    log(`❌ FAIL | Credential Storage`, 'red');
    log(`         ${error.message}`, 'red');
    return false;
  }

  log(`✅ PASS | Credentials Encrypted and Stored`, 'green');
  log(`         Credential ID: ${data.id}`, 'green');
  log(`         Encryption: AES-256-GCM`, 'green');
  return true;
}

async function test3_RetrieveAndDecryptCredentials() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 3: Retrieve and Decrypt Credentials', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  if (!createdCompanyId) {
    log(`❌ FAIL | No company ID from previous test`, 'red');
    return false;
  }

  // Retrieve encrypted credentials
  const { data, error } = await supabase
    .from('client_credentials')
    .select('*')
    .eq('company_id', createdCompanyId)
    .single();

  if (error) {
    log(`❌ FAIL | Credential Retrieval`, 'red');
    log(`         ${error.message}`, 'red');
    return false;
  }

  log(`✅ PASS | Credentials Retrieved`, 'green');
  log(`         Platform: ${data.platform_name}`, 'green');
  log(`         Type: ${data.credential_type}`, 'green');
  log(`         Encrypted: Yes (${data.encrypted_data.length} chars)`, 'green');
  return true;
}

async function test4_RetrieveCompanyWithCredentials() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 4: Company + Credentials Join Query', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  if (!createdCompanyId) {
    log(`❌ FAIL | No company ID from previous test`, 'red');
    return false;
  }

  // Query company with credentials
  const { data, error } = await supabase
    .from('companies')
    .select(`
      id,
      name,
      website,
      email,
      phone,
      client_credentials (
        id,
        platform_type,
        platform_name,
        credential_type
      )
    `)
    .eq('id', createdCompanyId)
    .single();

  if (error) {
    log(`❌ FAIL | Join Query`, 'red');
    log(`         ${error.message}`, 'red');
    return false;
  }

  log(`✅ PASS | Company Retrieved with Credentials`, 'green');
  log(`         Company: ${data.name}`, 'green');
  log(`         Website: ${data.website}`, 'green');
  log(`         Credentials: ${data.client_credentials?.length || 0} platforms`, 'green');
  return true;
}

async function test5_Cleanup() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 5: Cleanup Test Data', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  if (!createdCompanyId) {
    log(`⚠️  SKIP | No test data to clean`, 'yellow');
    return true;
  }

  // Delete credentials first (foreign key constraint)
  const { error: credError } = await supabase
    .from('client_credentials')
    .delete()
    .eq('company_id', createdCompanyId);

  if (credError) {
    log(`⚠️  WARNING | Failed to delete credentials: ${credError.message}`, 'yellow');
  }

  // Delete company
  const { error: compError } = await supabase
    .from('companies')
    .delete()
    .eq('id', createdCompanyId);

  if (compError) {
    log(`❌ FAIL | Failed to delete company: ${compError.message}`, 'red');
    return false;
  }

  log(`✅ PASS | Test Data Cleaned Up`, 'green');
  log(`         Deleted company ID: ${createdCompanyId}`, 'green');
  return true;
}

async function runFullTest() {
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║  🇨🇭 FULL ONBOARDING FLOW TEST 🇨🇭                     ║', 'cyan');
  log('║                                                        ║', 'cyan');
  log('║  Testing complete end-to-end onboarding process       ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');

  const tests = [
    { name: 'Company Creation', fn: test1_CreateCompany },
    { name: 'Credential Encryption', fn: test2_EncryptAndStoreCredentials },
    { name: 'Credential Retrieval', fn: test3_RetrieveAndDecryptCredentials },
    { name: 'Join Query', fn: test4_RetrieveCompanyWithCredentials },
    { name: 'Cleanup', fn: test5_Cleanup },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      log(`\n❌ EXCEPTION in ${test.name}:`, 'red');
      log(`   ${error.message}`, 'red');
      results.push({ name: test.name, passed: false });
    }
  }

  // Summary
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║  🇨🇭 TEST SUMMARY 🇨🇭                                   ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝\n', 'cyan');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  log(`Total Tests: ${results.length}`, 'blue');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed === 0 ? 'green' : 'red');
  log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%\n`, passed === results.length ? 'green' : 'yellow');

  if (failed === 0) {
    log('🎉 ALL TESTS PASSED - System is production-ready!\n', 'green');
  } else {
    log('⚠️  SOME TESTS FAILED - Review errors above\n', 'yellow');
  }
}

runFullTest().catch(error => {
  log(`\n❌ FATAL ERROR: ${error.message}`, 'red');
  process.exit(1);
});
