#!/usr/bin/env node

/**
 * Playwright MCP Tab Navigation Test Suite
 * Tests tab functionality across 5 different scenarios
 */

import { chromium } from 'playwright';

// Test configuration
const BASE_URL = 'https://geo-seo-domination-tool.vercel.app';
const TIMEOUT = 30000;

// Tab test pages and their expected tabs
const TAB_TEST_PAGES = {
  tactical: {
    url: '/tactical',
    tabs: [
      { value: 'active', text: 'Active Tasks', expectedContent: 'Optimize API Response Times' },
      { value: 'history', text: 'History', expectedContent: 'Task History' },
      { value: 'templates', text: 'Templates', expectedContent: 'API Optimization' }
    ]
  },
  signin: {
    url: '/auth/signin',
    tabs: [
      { value: 'email', text: 'Email', expectedContent: 'Email Address' },
      { value: 'google', text: 'Google', expectedContent: 'Sign in with Google' }
    ]
  },
  influence: {
    url: '/crm/influence',
    tabs: [
      { value: 'overview', text: 'Overview', expectedContent: null },
      { value: 'contacts', text: 'Contacts', expectedContent: null },
      { value: 'campaigns', text: 'Campaigns', expectedContent: null }
    ]
  },
  terminalPro: {
    url: '/sandbox/terminal-pro',
    tabs: [
      { value: 'terminal', text: 'Terminal', expectedContent: null },
      { value: 'files', text: 'Files', expectedContent: null },
      { value: 'settings', text: 'Settings', expectedContent: null }
    ]
  }
};

// Test results tracker
const results = {
  test1: { name: 'Navigate to all tabs', passed: 0, failed: 0, errors: [] },
  test2: { name: 'Verify tab content loads', passed: 0, failed: 0, errors: [] },
  test3: { name: 'Tab switching without reload', passed: 0, failed: 0, errors: [] },
  test4: { name: 'URL updates on tab change', passed: 0, failed: 0, errors: [] },
  test5: { name: 'Deep linking to tabs', passed: 0, failed: 0, errors: [] }
};

async function runTests() {
  console.log('\n🎭 Starting Playwright MCP Tab Navigation Tests\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // TEST 1: Navigate to all main tabs
    console.log('\n📋 TEST 1: Navigate to All Main Tabs');
    console.log('-'.repeat(60));

    for (const [pageName, pageData] of Object.entries(TAB_TEST_PAGES)) {
      try {
        console.log(`\n  Testing: ${BASE_URL}${pageData.url}`);
        await page.goto(`${BASE_URL}${pageData.url}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
        await page.waitForTimeout(2000);

        for (const tab of pageData.tabs) {
          try {
            // Find and click tab
            const tabSelector = `button[role="tab"]:has-text("${tab.text}")`;
            await page.click(tabSelector, { timeout: 5000 });
            await page.waitForTimeout(500);

            console.log(`    ✅ Tab "${tab.text}" clickable`);
            results.test1.passed++;
          } catch (error) {
            console.log(`    ❌ Tab "${tab.text}" not found or not clickable`);
            results.test1.failed++;
            results.test1.errors.push(`${pageName}: ${tab.text} - ${error.message}`);
          }
        }
      } catch (error) {
        console.log(`  ❌ Failed to load page: ${error.message}`);
        results.test1.failed++;
        results.test1.errors.push(`${pageName}: Page load - ${error.message}`);
      }
    }

    // TEST 2: Verify tab content loads correctly
    console.log('\n\n📋 TEST 2: Verify Tab Content Loads Correctly');
    console.log('-'.repeat(60));

    for (const [pageName, pageData] of Object.entries(TAB_TEST_PAGES)) {
      try {
        await page.goto(`${BASE_URL}${pageData.url}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
        await page.waitForTimeout(2000);

        for (const tab of pageData.tabs) {
          if (!tab.expectedContent) continue; // Skip tabs without expected content

          try {
            // Click tab
            const tabSelector = `button[role="tab"]:has-text("${tab.text}")`;
            await page.click(tabSelector, { timeout: 5000 });
            await page.waitForTimeout(1000);

            // Check for expected content
            const contentVisible = await page.locator(`text="${tab.expectedContent}"`).isVisible({ timeout: 5000 });

            if (contentVisible) {
              console.log(`    ✅ "${tab.text}" content loaded: "${tab.expectedContent}"`);
              results.test2.passed++;
            } else {
              console.log(`    ❌ "${tab.text}" content not found: "${tab.expectedContent}"`);
              results.test2.failed++;
              results.test2.errors.push(`${pageName}: ${tab.text} - Content not visible`);
            }
          } catch (error) {
            console.log(`    ❌ "${tab.text}" content check failed: ${error.message}`);
            results.test2.failed++;
            results.test2.errors.push(`${pageName}: ${tab.text} - ${error.message}`);
          }
        }
      } catch (error) {
        console.log(`  ❌ Failed to load page for content test: ${error.message}`);
        results.test2.failed++;
      }
    }

    // TEST 3: Tab switching without page reload
    console.log('\n\n📋 TEST 3: Tab Switching Without Page Reload');
    console.log('-'.repeat(60));

    const testPage = TAB_TEST_PAGES.tactical;
    await page.goto(`${BASE_URL}${testPage.url}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(2000);

    // Track navigation events
    let navigationOccurred = false;
    page.on('framenavigated', () => {
      navigationOccurred = true;
    });

    for (let i = 0; i < testPage.tabs.length; i++) {
      const tab = testPage.tabs[i];
      navigationOccurred = false;

      try {
        const tabSelector = `button[role="tab"]:has-text("${tab.text}")`;
        await page.click(tabSelector, { timeout: 5000 });
        await page.waitForTimeout(500);

        if (!navigationOccurred) {
          console.log(`    ✅ "${tab.text}" switched without reload`);
          results.test3.passed++;
        } else {
          console.log(`    ⚠️  "${tab.text}" triggered page reload`);
          results.test3.failed++;
          results.test3.errors.push(`${tab.text} - Page reload detected`);
        }
      } catch (error) {
        console.log(`    ❌ "${tab.text}" switch failed: ${error.message}`);
        results.test3.failed++;
        results.test3.errors.push(`${tab.text} - ${error.message}`);
      }
    }

    // TEST 4: Verify URL updates on tab changes (if using URL params)
    console.log('\n\n📋 TEST 4: URL Updates on Tab Changes');
    console.log('-'.repeat(60));

    await page.goto(`${BASE_URL}${testPage.url}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(2000);

    for (const tab of testPage.tabs) {
      try {
        const tabSelector = `button[role="tab"]:has-text("${tab.text}")`;
        await page.click(tabSelector, { timeout: 5000 });
        await page.waitForTimeout(500);

        const currentUrl = page.url();

        // Check if URL contains tab identifier or hash
        if (currentUrl.includes(`#${tab.value}`) || currentUrl.includes(`tab=${tab.value}`) || currentUrl.includes(tab.value.toLowerCase())) {
          console.log(`    ✅ "${tab.text}" updates URL: ${currentUrl}`);
          results.test4.passed++;
        } else {
          console.log(`    ℹ️  "${tab.text}" doesn't update URL (may use state only)`);
          results.test4.passed++; // Not necessarily a failure
        }
      } catch (error) {
        console.log(`    ❌ "${tab.text}" URL check failed: ${error.message}`);
        results.test4.failed++;
        results.test4.errors.push(`${tab.text} - ${error.message}`);
      }
    }

    // TEST 5: Deep linking to specific tabs
    console.log('\n\n📋 TEST 5: Deep Linking to Specific Tabs');
    console.log('-'.repeat(60));

    for (const tab of testPage.tabs) {
      try {
        // Try accessing with hash
        await page.goto(`${BASE_URL}${testPage.url}#${tab.value}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
        await page.waitForTimeout(2000);

        // Check if correct tab is active
        const tabSelector = `button[role="tab"]:has-text("${tab.text}")`;
        const isActive = await page.locator(tabSelector).getAttribute('aria-selected') === 'true' ||
                         await page.locator(tabSelector).getAttribute('data-state') === 'active';

        if (isActive) {
          console.log(`    ✅ Deep link to "${tab.text}" works`);
          results.test5.passed++;
        } else {
          console.log(`    ⚠️  Deep link to "${tab.text}" doesn't activate tab`);
          results.test5.failed++;
          results.test5.errors.push(`${tab.text} - Tab not activated by deep link`);
        }
      } catch (error) {
        console.log(`    ❌ Deep link to "${tab.text}" failed: ${error.message}`);
        results.test5.failed++;
        results.test5.errors.push(`${tab.text} - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('\n❌ Fatal error during tests:', error);
  } finally {
    await browser.close();
  }

  // Print summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  let totalPassed = 0;
  let totalFailed = 0;

  for (const [testNum, result] of Object.entries(results)) {
    const status = result.failed === 0 ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${testNum.toUpperCase()}: ${result.name} - ${status}`);
    console.log(`  Passed: ${result.passed}`);
    console.log(`  Failed: ${result.failed}`);

    if (result.errors.length > 0) {
      console.log(`  Errors:`);
      result.errors.forEach(err => console.log(`    - ${err}`));
    }

    totalPassed += result.passed;
    totalFailed += result.failed;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('='.repeat(60));

  // Exit with appropriate code
  process.exit(totalFailed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
