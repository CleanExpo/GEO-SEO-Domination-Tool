import { test, expect } from '@playwright/test';

const PRODUCTION_URLS = {
  vercel: 'https://geo-seo-domination-tool.vercel.app',
  railway: process.env.RAILWAY_URL || 'https://stellar-kindness-production.up.railway.app',
  local: 'http://localhost:3000'
};

test.describe('Production Validation Tests', () => {

  test('Companies page should load without errors', async ({ page }) => {
    // Track console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Track failed network requests
    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
      failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Track API responses
    const apiResponses: { url: string; status: number; statusText: string }[] = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    // Navigate to companies page
    const testUrl = process.env.TEST_URL || PRODUCTION_URLS.local;
    await page.goto(`${testUrl}/companies`, { waitUntil: 'networkidle' });

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Check for 500 or 405 errors in API calls
    const badApiCalls = apiResponses.filter(r => r.status === 500 || r.status === 405);

    console.log('\n=== API Responses ===');
    apiResponses.forEach(r => {
      console.log(`${r.status} ${r.statusText} - ${r.url}`);
    });

    console.log('\n=== Console Errors ===');
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(err => console.log(err));
    } else {
      console.log('No console errors detected');
    }

    console.log('\n=== Failed Requests ===');
    if (failedRequests.length > 0) {
      failedRequests.forEach(req => console.log(req));
    } else {
      console.log('No failed requests');
    }

    // Take screenshot for visual verification
    await page.screenshot({ path: 'tests/screenshots/companies-page.png', fullPage: true });

    // Assertions
    expect(badApiCalls.length,
      `Found ${badApiCalls.length} API errors:\n${badApiCalls.map(r => `${r.status} ${r.url}`).join('\n')}`
    ).toBe(0);

    expect(consoleErrors.filter(e => e.includes('Failed to load resource')).length,
      'Found "Failed to load resource" errors in console'
    ).toBe(0);

    // Check that the page title is correct
    await expect(page).toHaveTitle(/Companies|GEO-SEO/);
  });

  test('API /companies endpoint should return 200', async ({ page }) => {
    const testUrl = process.env.TEST_URL || PRODUCTION_URLS.local;

    // Make direct API call
    const response = await page.request.get(`${testUrl}/api/companies`);

    console.log(`\n=== Direct API Test ===`);
    console.log(`URL: ${testUrl}/api/companies`);
    console.log(`Status: ${response.status()} ${response.statusText()}`);
    console.log(`Headers:`, await response.headers());

    const body = await response.text();
    console.log(`Body: ${body.substring(0, 200)}...`);

    expect(response.status()).toBe(200);

    // Parse response
    const json = JSON.parse(body);
    expect(json).toHaveProperty('companies');
    expect(Array.isArray(json.companies)).toBe(true);
  });

  test('API /companies-list endpoint should return 200', async ({ page }) => {
    const testUrl = process.env.TEST_URL || PRODUCTION_URLS.local;

    const response = await page.request.get(`${testUrl}/api/companies-list`);

    console.log(`\n=== New Endpoint Test ===`);
    console.log(`URL: ${testUrl}/api/companies-list`);
    console.log(`Status: ${response.status()} ${response.statusText()}`);

    expect(response.status()).toBe(200);
  });
});
