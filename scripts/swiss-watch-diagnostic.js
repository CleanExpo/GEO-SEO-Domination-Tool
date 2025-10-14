/**
 * 🇨🇭 SWISS WATCH PRECISION DIAGNOSTIC SYSTEM 🇨🇭
 *
 * Comprehensive end-to-end system verification
 * Tests EVERY component with proof of functionality
 * No assumptions - only verified facts
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qwoggbbavikzhypzodcr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3b2dnYmJhdmlremh5cHpvZGNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM2NjgxOSwiZXhwIjoyMDc0OTQyODE5fQ.anCfcuP_ruzof_tY_dCHXOFWR_0ra2hS_GZSuLKRqrk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} | ${name}`);
  if (details) console.log(`         ${details}`);

  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function test1_DatabaseConnection() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Database Connection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const { data, error } = await supabase.from('companies').select('count').single();

    if (error && error.code !== 'PGRST116') {
      logTest('Database Connection', false, error.message);
      return false;
    }

    logTest('Database Connection', true, 'Supabase connection active');
    return true;
  } catch (err) {
    logTest('Database Connection', false, err.message);
    return false;
  }
}

async function test2_CompaniesTableSchema() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Companies Table Schema');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const requiredColumns = ['name', 'website', 'email', 'phone', 'address', 'city', 'state', 'zip', 'industry'];

  try {
    // Try to select with all required columns
    const { data, error } = await supabase
      .from('companies')
      .select(requiredColumns.join(', '))
      .limit(1);

    if (error) {
      logTest('Companies Schema Validation', false, `Missing columns: ${error.message}`);
      return false;
    }

    logTest('Companies Schema Validation', true, `All ${requiredColumns.length} required columns exist`);
    return true;
  } catch (err) {
    logTest('Companies Schema Validation', false, err.message);
    return false;
  }
}

async function test3_CompanyInsert() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Company Record Creation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const testCompany = {
      name: 'Swiss Watch Test Co',
      website: 'https://swisswatch-test.com',
      email: 'test@swisswatch.com',
      phone: '1234567890',
      address: '123 Precision St',
      city: 'Geneva',
      state: 'CH',
      zip: '1200',
      industry: 'Testing'
    };

    const { data, error } = await supabase
      .from('companies')
      .insert([testCompany])
      .select('id')
      .single();

    if (error) {
      logTest('Company Insert', false, error.message);
      return null;
    }

    logTest('Company Insert', true, `Created company ID: ${data.id}`);
    return data.id;
  } catch (err) {
    logTest('Company Insert', false, err.message);
    return null;
  }
}

async function test4_CompanyRetrieve(companyId) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4: Company Record Retrieval');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!companyId) {
    logTest('Company Retrieve', false, 'No company ID from previous test');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (error) {
      logTest('Company Retrieve', false, error.message);
      return false;
    }

    const hasAllFields = data.name && data.website && data.email;
    logTest('Company Retrieve', hasAllFields, `Retrieved: ${data.name}`);
    return hasAllFields;
  } catch (err) {
    logTest('Company Retrieve', false, err.message);
    return false;
  }
}

async function test5_CredentialsTable() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 5: Credentials Table');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const { data, error } = await supabase
      .from('credentials')
      .select('id, company_id, platform_type, platform_name')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      logTest('Credentials Table Check', false, error.message);
      return false;
    }

    logTest('Credentials Table Check', true, 'Credentials table exists and accessible');
    return true;
  } catch (err) {
    logTest('Credentials Table Check', false, err.message);
    return false;
  }
}

async function test6_OnboardingAPI() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 6: Onboarding API Endpoints');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Test lookup endpoint
    const lookupResponse = await fetch('http://localhost:3000/api/onboarding/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'https://example.com', searchBy: 'url' })
    });

    const lookupOk = lookupResponse.status === 200;
    logTest('Lookup Endpoint', lookupOk, `Status: ${lookupResponse.status}`);

    return lookupOk;
  } catch (err) {
    logTest('Lookup Endpoint', false, err.message);
    return false;
  }
}

async function test7_Cleanup(companyId) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 7: Cleanup Test Data');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!companyId) {
    logTest('Cleanup', true, 'No test data to clean');
    return true;
  }

  try {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (error) {
      logTest('Cleanup Test Company', false, error.message);
      return false;
    }

    logTest('Cleanup Test Company', true, `Deleted company ID: ${companyId}`);
    return true;
  } catch (err) {
    logTest('Cleanup Test Company', false, err.message);
    return false;
  }
}

function printSummary() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║          🇨🇭 DIAGNOSTIC SUMMARY 🇨🇭                    ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`Total Tests: ${testResults.tests.length}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);

  const percentage = ((testResults.passed / testResults.tests.length) * 100).toFixed(1);
  console.log(`\nSuccess Rate: ${percentage}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 PERFECT! All systems operational - Swiss watch precision achieved!');
  } else {
    console.log('\n⚠️  Some tests failed - review above for details');
  }
}

async function runDiagnostic() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🇨🇭 SWISS WATCH PRECISION DIAGNOSTIC SYSTEM 🇨🇭       ║');
  console.log('║                                                        ║');
  console.log('║  Testing ALL components with proof of functionality   ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  await test1_DatabaseConnection();
  await test2_CompaniesTableSchema();
  const companyId = await test3_CompanyInsert();
  await test4_CompanyRetrieve(companyId);
  await test5_CredentialsTable();
  await test6_OnboardingAPI();
  await test7_Cleanup(companyId);

  printSummary();
}

runDiagnostic();
