#!/usr/bin/env node

/**
 * Comprehensive test of onboarding save/load functionality
 *
 * This script tests:
 * 1. Database connectivity
 * 2. saved_onboarding table existence
 * 3. POST /api/onboarding/save endpoint
 * 4. GET /api/onboarding/save endpoint
 * 5. Data persistence verification
 */

const http = require('http');
const Database = require('better-sqlite3');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: data ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      } : {}
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            body: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: responseData,
            parseError: true
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function runTests() {
  log('\n' + '='.repeat(70), colors.cyan);
  log('  ONBOARDING SAVE/LOAD COMPREHENSIVE TEST', colors.cyan + colors.bright);
  log('='.repeat(70) + '\n', colors.cyan);

  let passed = 0;
  let failed = 0;

  // Test 1: Database Connection
  log('Test 1: Database Connection', colors.blue + colors.bright);
  try {
    const dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');
    const db = new Database(dbPath);
    log('  ✓ Connected to SQLite database', colors.green);

    // Test 2: Table Existence
    log('\nTest 2: saved_onboarding Table Existence', colors.blue + colors.bright);
    const tableCheck = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='saved_onboarding'
    `).get();

    if (tableCheck) {
      log('  ✓ saved_onboarding table exists', colors.green);
      passed++;
    } else {
      log('  ✗ saved_onboarding table NOT found', colors.red);
      failed++;
    }

    // Show current record count
    const count = db.prepare(`SELECT COUNT(*) as count FROM saved_onboarding`).get();
    log(`  Current records in table: ${count.count}`, colors.cyan);

    db.close();
    passed++;
  } catch (error) {
    log(`  ✗ Database connection failed: ${error.message}`, colors.red);
    failed += 2;
  }

  // Test 3: Save API (POST)
  log('\nTest 3: POST /api/onboarding/save', colors.blue + colors.bright);
  try {
    const testData = {
      businessName: 'Complete Test Company',
      email: 'completetest@example.com',
      formData: {
        businessName: 'Complete Test Company',
        email: 'completetest@example.com',
        industry: 'Testing & QA',
        contactName: 'QA Tester',
        phone: '+1-555-TEST',
        address: '123 Test Street',
        website: 'https://test.example.com',
        hasExistingWebsite: true,
        websitePlatform: 'Next.js',
        primaryGoals: ['Increase organic traffic', 'Improve search rankings'],
        targetKeywords: ['test keyword 1', 'test keyword 2'],
        targetLocations: ['Test City, TC'],
        contentTypes: ['Blog posts', 'Landing pages'],
        contentFrequency: 'weekly',
        brandVoice: 'Professional and technical',
        competitors: ['competitor1.com', 'competitor2.com'],
        selectedServices: ['SEO Audit & Optimization', 'Content Creation'],
        budget: '1000-2500'
      },
      currentStep: 3
    };

    const response = await makeRequest(
      'POST',
      '/api/onboarding/save',
      JSON.stringify(testData)
    );

    if (response.statusCode === 200 && response.body.success) {
      log('  ✓ Save API returned success', colors.green);
      log(`  Response: ${JSON.stringify(response.body)}`, colors.cyan);
      passed++;
    } else {
      log(`  ✗ Save API failed (status: ${response.statusCode})`, colors.red);
      log(`  Response: ${JSON.stringify(response.body)}`, colors.red);
      failed++;
    }
  } catch (error) {
    log(`  ✗ Save API request failed: ${error.message}`, colors.red);
    failed++;
  }

  // Test 4: Load API (GET)
  log('\nTest 4: GET /api/onboarding/save', colors.blue + colors.bright);
  try {
    const response = await makeRequest(
      'GET',
      '/api/onboarding/save?businessName=Complete%20Test%20Company&email=completetest@example.com'
    );

    if (response.statusCode === 200 && response.body.found) {
      log('  ✓ Load API returned saved data', colors.green);
      log(`  Business: ${response.body.formData.businessName}`, colors.cyan);
      log(`  Email: ${response.body.formData.email}`, colors.cyan);
      log(`  Current Step: ${response.body.currentStep}`, colors.cyan);
      log(`  Last Saved: ${response.body.lastSaved}`, colors.cyan);
      passed++;
    } else {
      log(`  ✗ Load API failed (status: ${response.statusCode})`, colors.red);
      log(`  Response: ${JSON.stringify(response.body)}`, colors.red);
      failed++;
    }
  } catch (error) {
    log(`  ✗ Load API request failed: ${error.message}`, colors.red);
    failed++;
  }

  // Test 5: Database Verification
  log('\nTest 5: Database Persistence Verification', colors.blue + colors.bright);
  try {
    const dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');
    const db = new Database(dbPath);

    const saved = db.prepare(`
      SELECT * FROM saved_onboarding
      WHERE business_name = ? AND email = ?
    `).get('Complete Test Company', 'completetest@example.com');

    if (saved) {
      log('  ✓ Data verified in database', colors.green);
      log(`  ID: ${saved.id}`, colors.cyan);
      log(`  Business: ${saved.business_name}`, colors.cyan);
      log(`  Email: ${saved.email}`, colors.cyan);
      log(`  Step: ${saved.current_step}`, colors.cyan);

      const formData = JSON.parse(saved.form_data);
      log(`  Form Data Keys: ${Object.keys(formData).length} fields`, colors.cyan);
      passed++;
    } else {
      log('  ✗ No data found in database', colors.red);
      failed++;
    }

    // Show all records
    const allRecords = db.prepare(`SELECT COUNT(*) as count FROM saved_onboarding`).get();
    log(`\n  Total records in saved_onboarding: ${allRecords.count}`, colors.yellow);

    db.close();
  } catch (error) {
    log(`  ✗ Database verification failed: ${error.message}`, colors.red);
    failed++;
  }

  // Summary
  log('\n' + '='.repeat(70), colors.cyan);
  log('  TEST SUMMARY', colors.cyan + colors.bright);
  log('='.repeat(70), colors.cyan);
  log(`  Passed: ${passed}`, colors.green);
  log(`  Failed: ${failed}`, failed > 0 ? colors.red : colors.green);
  log('='.repeat(70) + '\n', colors.cyan);

  if (failed > 0) {
    log('❌ SOME TESTS FAILED', colors.red + colors.bright);
    log('\nTroubleshooting:', colors.yellow);
    log('  1. Ensure dev server is running on port 3000', colors.cyan);
    log('  2. Restart dev server after next.config.js changes', colors.cyan);
    log('  3. Check server console for errors', colors.cyan);
    log('  4. Run: npm run db:init to ensure tables exist', colors.cyan);
    process.exit(1);
  } else {
    log('✓ ALL TESTS PASSED!', colors.green + colors.bright);
    log('\nOnboarding save/load functionality is working correctly!', colors.cyan);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
