#!/usr/bin/env node

/**
 * Pre-Debug Checklist Script
 *
 * Run this BEFORE starting any debugging to verify the issue actually exists
 *
 * Usage:
 *   node scripts/pre-debug-check.js [issue-type]
 *
 * Issue types:
 *   - save          : Test save/onboarding endpoints
 *   - database      : Test database connections
 *   - api           : Test all API endpoints
 *   - frontend      : Check frontend build/hydration
 */

const https = require('https');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(color, symbol, message) {
  console.log(`${color}${symbol} ${message}${colors.reset}`);
}

function success(msg) { log(colors.green, '✅', msg); }
function error(msg) { log(colors.red, '❌', msg); }
function warning(msg) { log(colors.yellow, '⚠️ ', msg); }
function info(msg) { log(colors.cyan, 'ℹ️ ', msg); }
function header(msg) { log(colors.bold + colors.magenta, '\n📋', msg + '\n'); }

async function testEndpoint(name, url, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: body ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      } : {}
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = {
          name,
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 300,
          data: data ? JSON.parse(data) : null
        };

        if (result.ok) {
          success(`${name}: ${result.status} OK`);
          if (result.data) {
            console.log(`   Response: ${JSON.stringify(result.data).substring(0, 100)}`);
          }
        } else {
          error(`${name}: ${result.status} ${res.statusText}`);
          if (result.data) {
            console.log(`   Error: ${JSON.stringify(result.data)}`);
          }
        }

        resolve(result);
      });
    });

    req.on('error', (e) => {
      error(`${name}: ${e.message}`);
      resolve({ name, ok: false, error: e.message });
    });

    if (body) req.write(body);
    req.end();
  });
}

async function checkSaveEndpoints() {
  header('Testing Save/Onboarding Endpoints');

  const testData = JSON.stringify({
    businessName: 'Pre-Debug Check',
    email: 'check@example.com',
    formData: { test: true },
    currentStep: 0
  });

  const results = [
    await testEndpoint(
      'POST /api/onboarding/save',
      'https://geo-seo-domination-tool.vercel.app/api/onboarding/save',
      'POST',
      testData
    ),
    await testEndpoint(
      'GET /api/debug/db-config',
      'https://geo-seo-domination-tool.vercel.app/api/debug/db-config'
    )
  ];

  console.log('');

  const allOk = results.every(r => r.ok);
  if (allOk) {
    success('All save endpoints are working!');
    warning('If user reports "save not working", the issue is likely in the FRONTEND:');
    console.log('   1. Check browser console for errors (F12)');
    console.log('   2. Check Network tab to see if API is being called');
    console.log('   3. Check form submit handler and event binding');
    console.log('   4. DON\'T debug the backend - it\'s working!');
  } else {
    error('Some endpoints are failing!');
    warning('Now you can debug the backend - the issue is confirmed.');
  }
}

async function checkDatabase() {
  header('Testing Database Connection');

  try {
    info('Running direct database test...');
    const output = execSync('node scripts/test-db-direct.js', {
      encoding: 'utf8',
      timeout: 10000
    });

    if (output.includes('Query successful')) {
      success('Direct database connection works!');
      console.log(output);
    } else {
      error('Database test failed');
      console.log(output);
    }
  } catch (e) {
    error(`Database test error: ${e.message}`);
  }
}

async function checkAPI() {
  header('Testing All Critical API Endpoints');

  const endpoints = [
    { name: 'Health Check', url: 'https://geo-seo-domination-tool.vercel.app/api/health' },
    { name: 'DB Config', url: 'https://geo-seo-domination-tool.vercel.app/api/debug/db-config' },
    { name: 'Onboarding Save', url: 'https://geo-seo-domination-tool.vercel.app/api/onboarding/save', method: 'POST', body: JSON.stringify({ businessName: 'Test', email: 'test@test.com', formData: {}, currentStep: 0 }) }
  ];

  const results = [];
  for (const endpoint of endpoints) {
    results.push(await testEndpoint(endpoint.name, endpoint.url, endpoint.method, endpoint.body));
  }

  console.log('');
  const working = results.filter(r => r.ok).length;
  const total = results.length;

  info(`${working}/${total} endpoints working`);

  if (working === total) {
    success('All API endpoints are operational!');
  } else {
    warning(`${total - working} endpoint(s) failing`);
  }
}

function showReminder() {
  header('🚨 IMPORTANT REMINDER 🚨');

  console.log(`${colors.red}${colors.bold}BEFORE YOU DEBUG FOR HOURS:${colors.reset}\n`);
  console.log('1. Did you run the tests above? Are they passing?');
  console.log('2. If backend tests pass but user reports issues:');
  console.log('   → THE PROBLEM IS IN THE FRONTEND!');
  console.log('   → DON\'T debug the backend!');
  console.log('   → Check browser console and network tab!');
  console.log('');
  console.log('3. If backend tests fail:');
  console.log('   → NOW you can debug the backend');
  console.log('   → Check the actual error message from tests');
  console.log('   → Fix the specific failing endpoint');
  console.log('');
  warning('See TROUBLESHOOTING_CHECKLIST.md for full guidance');
  console.log('');
}

async function main() {
  const issueType = process.argv[2] || 'save';

  console.log(`\n${colors.bold}${colors.blue}=== Pre-Debug Check ===${colors.reset}`);
  console.log(`${colors.cyan}Issue Type: ${issueType}${colors.reset}\n`);

  switch (issueType) {
    case 'save':
      await checkSaveEndpoints();
      break;
    case 'database':
      await checkDatabase();
      break;
    case 'api':
      await checkAPI();
      break;
    case 'frontend':
      info('Frontend checks require browser DevTools');
      info('Open: https://geo-seo-domination-tool.vercel.app/onboarding/new');
      info('Press F12 → Console tab');
      info('Look for red errors or network failures');
      break;
    default:
      error(`Unknown issue type: ${issueType}`);
      info('Valid types: save, database, api, frontend');
      process.exit(1);
  }

  showReminder();
}

main().catch(console.error);
