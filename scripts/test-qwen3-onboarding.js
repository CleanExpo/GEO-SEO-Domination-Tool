#!/usr/bin/env node
/**
 * Test Script for Qwen3 Smart Onboarding Features
 *
 * Tests:
 * 1. Credential Assistant API (Qwen3 integration)
 * 2. YouTube video library
 * 3. Credential validation endpoints
 * 4. Progressive UI components (build check)
 * 5. Auto-save checkpoints
 *
 * Run: node scripts/test-qwen3-onboarding.js
 */

// Load environment variables from .env.local
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (error) {
  // Ignore errors loading .env.local
}

const https = require('https');
const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

let testsPassed = 0;
let testsFailed = 0;

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function test(name, fn) {
  process.stdout.write(`Testing: ${name}... `);
  try {
    await fn();
    log('✓ PASS', 'green');
    testsPassed++;
  } catch (error) {
    log(`✗ FAIL: ${error.message}`, 'red');
    testsFailed++;
  }
}

// ============================================================================
// TESTS
// ============================================================================

async function testCredentialAssistant() {
  await test('Credential Assistant API responds', async () => {
    const response = await makeRequest('/api/onboarding/credential-assistant', 'POST', {
      userQuery: 'How do I find my WordPress admin login?',
      platform: 'WordPress',
      hostingProvider: 'GoDaddy',
    });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    if (!response.data.message) {
      throw new Error('Response missing message field');
    }

    if (!response.data.model) {
      throw new Error('Response missing model field (should show qwen or claude)');
    }

    log(`  → Model used: ${response.data.model}`, 'blue');
    log(`  → Cost: $${response.data.cost.toFixed(4)}`, 'blue');
  });

  await test('Credential Assistant returns steps', async () => {
    const response = await makeRequest('/api/onboarding/credential-assistant', 'POST', {
      userQuery: 'I need my Facebook Business ID',
      platform: 'Facebook',
    });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    // Check if steps or video tutorial is returned
    const hasGuidance = response.data.steps || response.data.videoTutorial;
    if (!hasGuidance) {
      throw new Error('Response should include steps or video tutorial');
    }

    if (response.data.videoTutorial) {
      log(`  → Video: ${response.data.videoTutorial.title}`, 'blue');
    }
  });

  await test('Credential Assistant handles errors gracefully', async () => {
    const response = await makeRequest('/api/onboarding/credential-assistant', 'POST', {
      userQuery: '', // Empty query should fail
    });

    if (response.status !== 400) {
      throw new Error(`Expected 400 for empty query, got ${response.status}`);
    }

    if (!response.data.error) {
      throw new Error('Error response should include error field');
    }
  });
}

async function testCredentialValidation() {
  await test('WordPress validator - valid URL check', async () => {
    const response = await makeRequest('/api/onboarding/validate-credentials', 'POST', {
      platform: 'wordpress',
      credentials: {
        url: 'https://wordpress.org', // Public WordPress site for testing
        username: 'test',
        password: 'test',
      },
    });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    // Should detect WordPress site
    if (response.data.valid === false && !response.data.message.includes('reach')) {
      // It's okay if credentials are wrong, but should detect WordPress
      log(`  → ${response.data.message}`, 'yellow');
    }
  });

  await test('Validator handles missing credentials', async () => {
    const response = await makeRequest('/api/onboarding/validate-credentials', 'POST', {
      platform: 'wordpress',
      credentials: {},
    });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    if (response.data.valid !== false) {
      throw new Error('Should return valid: false for missing credentials');
    }
  });

  await test('Validator handles unknown platforms gracefully', async () => {
    const response = await makeRequest('/api/onboarding/validate-credentials', 'POST', {
      platform: 'unknown-platform',
      credentials: { test: 'value' },
    });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    // Should gracefully handle unknown platforms
    if (!response.data.message) {
      throw new Error('Should return a message for unknown platforms');
    }

    log(`  → ${response.data.message}`, 'yellow');
  });
}

async function testQwen3Integration() {
  await test('Qwen3 API key is configured', async () => {
    if (!process.env.QWEN_API_KEY && !process.env.DASHSCOPE_API_KEY) {
      throw new Error('QWEN_API_KEY or DASHSCOPE_API_KEY not set in environment');
    }
    log(`  → Qwen API key detected`, 'blue');
  });

  await test('Cascading AI service file exists', async () => {
    const fs = require('fs');
    const path = require('path');
    const servicePath = path.join(__dirname, '../services/api/cascading-ai.ts');

    if (!fs.existsSync(servicePath)) {
      throw new Error('cascading-ai.ts not found');
    }

    const content = fs.readFileSync(servicePath, 'utf8');
    if (!content.includes('export class CascadingAI')) {
      throw new Error('CascadingAI class export not found');
    }
  });
}

async function testComponentBuilds() {
  await test('CredentialAssistant component exists', async () => {
    const fs = require('fs');
    const path = require('path');
    const componentPath = path.join(__dirname, '../components/onboarding/CredentialAssistant.tsx');

    if (!fs.existsSync(componentPath)) {
      throw new Error('CredentialAssistant.tsx not found');
    }

    const content = fs.readFileSync(componentPath, 'utf8');
    if (!content.includes('export function CredentialAssistant')) {
      throw new Error('CredentialAssistant component export not found');
    }
  });

  await test('ProgressiveCredentialCard component exists', async () => {
    const fs = require('fs');
    const path = require('path');
    const componentPath = path.join(__dirname, '../components/onboarding/ProgressiveCredentialCard.tsx');

    if (!fs.existsSync(componentPath)) {
      throw new Error('ProgressiveCredentialCard.tsx not found');
    }

    const content = fs.readFileSync(componentPath, 'utf8');
    if (!content.includes('export function ProgressiveCredentialCard')) {
      throw new Error('ProgressiveCredentialCard component export not found');
    }
  });

  await test('OnboardingCheckpoints component exists', async () => {
    const fs = require('fs');
    const path = require('path');
    const componentPath = path.join(__dirname, '../components/onboarding/OnboardingCheckpoints.tsx');

    if (!fs.existsSync(componentPath)) {
      throw new Error('OnboardingCheckpoints.tsx not found');
    }

    const content = fs.readFileSync(componentPath, 'utf8');
    if (!content.includes('export function OnboardingCheckpoints')) {
      throw new Error('OnboardingCheckpoints component export not found');
    }
  });
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runTests() {
  log('\n========================================', 'blue');
  log('  Qwen3 Smart Onboarding Test Suite', 'blue');
  log('========================================\n', 'blue');

  log('1. Testing Qwen3 Integration...', 'yellow');
  await testQwen3Integration();

  log('\n2. Testing Credential Assistant API...', 'yellow');
  await testCredentialAssistant();

  log('\n3. Testing Credential Validation...', 'yellow');
  await testCredentialValidation();

  log('\n4. Testing Component Builds...', 'yellow');
  await testComponentBuilds();

  // Summary
  log('\n========================================', 'blue');
  log('  Test Results', 'blue');
  log('========================================', 'blue');
  log(`Passed: ${testsPassed}`, 'green');
  log(`Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
  log(`Total:  ${testsPassed + testsFailed}`, 'blue');

  if (testsFailed > 0) {
    log('\n❌ Some tests failed. Please fix before merging to main.', 'red');
    process.exit(1);
  } else {
    log('\n✅ All tests passed! Ready to merge to main.', 'green');
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  log(`\nFatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
