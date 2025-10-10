#!/usr/bin/env node
/**
 * API Routes Verification Script
 *
 * Tests all critical API endpoints to verify they're accessible
 * and returning expected responses (not 404).
 */

import fetch from 'node-fetch';

// Test both local and production
const BASE_URLS = {
  local: 'http://localhost:3000',
  production: 'https://geo-seo-domination-tool-azlxx5slm-unite-group.vercel.app'
};

// API routes to test (grouped by category)
const API_ROUTES = {
  'CRM': [
    { method: 'GET', path: '/api/crm/portfolios' },
    { method: 'GET', path: '/api/crm/calendar' },
    { method: 'GET', path: '/api/crm/influence' },
    { method: 'GET', path: '/api/crm/trends' }
  ],
  'Companies': [
    { method: 'GET', path: '/api/companies' }
  ],
  'Onboarding': [
    { method: 'POST', path: '/api/onboarding/save', body: { sessionId: 'test', step: 'test' } },
    { method: 'POST', path: '/api/onboarding/start', body: {} },
    { method: 'POST', path: '/api/onboarding/lookup', body: { businessName: 'Test' } }
  ],
  'Rankings': [
    { method: 'GET', path: '/api/rankings' }
  ],
  'Keywords': [
    { method: 'GET', path: '/api/keywords' }
  ],
  'SEO Audits': [
    { method: 'GET', path: '/api/seo-audits' }
  ]
};

async function testRoute(baseUrl, category, route) {
  const url = `${baseUrl}${route.path}`;
  const options = {
    method: route.method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (route.body) {
    options.body = JSON.stringify(route.body);
  }

  try {
    const response = await fetch(url, options);
    const status = response.status;
    const statusText = response.statusText;

    // Get response body (truncated)
    let body = '';
    try {
      const text = await response.text();
      body = text.substring(0, 100);
    } catch (e) {
      body = '[Unable to read body]';
    }

    const is404 = status === 404;
    const isSuccess = status >= 200 && status < 300;
    const isError = status >= 400;

    const statusSymbol = is404 ? '❌ 404' : isSuccess ? '✅' : isError ? '⚠️' : 'ℹ️';

    console.log(`  ${statusSymbol} ${route.method} ${route.path}`);
    console.log(`     Status: ${status} ${statusText}`);
    if (body) {
      console.log(`     Response: ${body}${body.length >= 100 ? '...' : ''}`);
    }

    return {
      category,
      route: route.path,
      method: route.method,
      status,
      is404,
      isSuccess,
      baseUrl: baseUrl === BASE_URLS.local ? 'local' : 'production'
    };
  } catch (error) {
    console.log(`  ❌ ${route.method} ${route.path}`);
    console.log(`     Error: ${error.message}`);
    return {
      category,
      route: route.path,
      method: route.method,
      status: 'ERROR',
      error: error.message,
      baseUrl: baseUrl === BASE_URLS.local ? 'local' : 'production'
    };
  }
}

async function main() {
  console.log('\n🔍 API Routes Verification\n');
  console.log('=' .repeat(60));

  const results = {
    local: [],
    production: []
  };

  // Test each environment
  for (const [envName, baseUrl] of Object.entries(BASE_URLS)) {
    console.log(`\n📍 Testing ${envName.toUpperCase()}: ${baseUrl}\n`);

    for (const [category, routes] of Object.entries(API_ROUTES)) {
      console.log(`\n${category}:`);

      for (const route of routes) {
        const result = await testRoute(baseUrl, category, route);
        results[envName].push(result);
        await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
      }
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 SUMMARY\n');

  for (const [envName, envResults] of Object.entries(results)) {
    const total = envResults.length;
    const found404 = envResults.filter(r => r.is404).length;
    const success = envResults.filter(r => r.isSuccess).length;
    const errors = envResults.filter(r => r.status === 'ERROR').length;

    console.log(`${envName.toUpperCase()}:`);
    console.log(`  Total Tests: ${total}`);
    console.log(`  ✅ Success: ${success} (${((success/total)*100).toFixed(1)}%)`);
    console.log(`  ❌ 404 Not Found: ${found404} (${((found404/total)*100).toFixed(1)}%)`);
    console.log(`  ⚠️  Errors: ${errors} (${((errors/total)*100).toFixed(1)}%)`);

    if (found404 > 0) {
      console.log(`\n  Routes returning 404 in ${envName}:`);
      envResults.filter(r => r.is404).forEach(r => {
        console.log(`    - ${r.method} ${r.route}`);
      });
    }
  }

  console.log('\n' + '='.repeat(60));

  // Check if local dev server needs to be running
  const localErrors = results.local.filter(r => r.status === 'ERROR').length;
  if (localErrors > 0) {
    console.log('\n⚠️  NOTE: Make sure local dev server is running: npm run dev');
  }

  // Exit code based on production results
  const production404s = results.production.filter(r => r.is404).length;
  if (production404s > 0) {
    console.log('\n❌ PRODUCTION API ROUTES FAILING - Investigation Required\n');
    process.exit(1);
  } else {
    console.log('\n✅ All production API routes accessible\n');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
