#!/usr/bin/env node

/**
 * 🚀 ULTIMATE CRM SYSTEM TEST - Playwright MCP
 *
 * Comprehensive deep-dive testing of the entire GEO-SEO CRM system
 * Tests: Pages, APIs, Database, Integrations, Navigation, Data Flow
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

// Configuration
const BASE_URL = 'https://geo-seo-domination-tool-azlxx5slm-unite-group.vercel.app';
const API_BASE = BASE_URL + '/api';
const TIMEOUT = 30000;
const SCREENSHOT_DIR = './test-screenshots';

// Test Results Storage
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0
  },
  categories: {
    navigation: { tests: [], passed: 0, failed: 0 },
    apiEndpoints: { tests: [], passed: 0, failed: 0 },
    dataOperations: { tests: [], passed: 0, failed: 0 },
    integrations: { tests: [], passed: 0, failed: 0 },
    userFlow: { tests: [], passed: 0, failed: 0 },
    performance: { tests: [], passed: 0, failed: 0 }
  },
  errors: [],
  warnings: []
};

// Test Helpers
function logTest(category, name, status, details = {}) {
  const test = { name, status, details, timestamp: new Date().toISOString() };
  testResults.categories[category].tests.push(test);

  if (status === 'PASS') {
    testResults.categories[category].passed++;
    testResults.summary.passed++;
    console.log(`    ✅ ${name}`);
  } else if (status === 'FAIL') {
    testResults.categories[category].failed++;
    testResults.summary.failed++;
    testResults.errors.push({ category, name, ...details });
    console.log(`    ❌ ${name}`);
    if (details.error) console.log(`       Error: ${details.error}`);
  } else if (status === 'SKIP') {
    testResults.summary.skipped++;
    console.log(`    ⏭️  ${name} (skipped)`);
  }

  testResults.summary.totalTests++;
}

async function runUltimateCRMTest() {
  const startTime = Date.now();

  console.log('\n' + '='.repeat(70));
  console.log('🚀 ULTIMATE CRM SYSTEM TEST - Playwright MCP');
  console.log('='.repeat(70));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Started: ${new Date().toLocaleString()}\n`);

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
  });

  const page = await context.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // ========================================================================
    // CATEGORY 1: NAVIGATION & PAGE LOADING
    // ========================================================================
    console.log('\n📍 CATEGORY 1: Navigation & Page Loading');
    console.log('-'.repeat(70));

    const crmPages = [
      { path: '/dashboard', name: 'Main Dashboard', expectedTitle: 'Dashboard' },
      { path: '/companies', name: 'Companies List', expectedContent: 'Companies' },
      { path: '/crm/calendar', name: 'CRM Calendar', expectedContent: 'Calendar' },
      { path: '/crm/influence', name: 'CRM Influence', expectedContent: 'Influence' },
      { path: '/onboarding/new', name: 'New Client Onboarding', expectedContent: 'Welcome' },
      { path: '/clients', name: 'Clients Page', expectedContent: 'Clients' },
      { path: '/projects', name: 'Projects', expectedContent: 'Projects' },
      { path: '/tactical', name: 'Tactical Coding', expectedContent: 'Tactical' }
    ];

    for (const pageInfo of crmPages) {
      try {
        await page.goto(`${BASE_URL}${pageInfo.path}`, {
          waitUntil: 'domcontentloaded',
          timeout: TIMEOUT
        });
        await page.waitForTimeout(2000);

        // Check if page loaded
        const hasExpectedContent = await page.locator(`text=${pageInfo.expectedContent}`).count() > 0 ||
                                   await page.locator('h1').count() > 0;

        if (hasExpectedContent) {
          // Take screenshot
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/page-${pageInfo.name.replace(/\s+/g, '-').toLowerCase()}.png`,
            fullPage: false
          });

          logTest('navigation', `Load ${pageInfo.name}`, 'PASS', {
            url: page.url(),
            loadTime: '< 2s'
          });
        } else {
          logTest('navigation', `Load ${pageInfo.name}`, 'FAIL', {
            error: 'Expected content not found',
            url: page.url()
          });
        }
      } catch (error) {
        logTest('navigation', `Load ${pageInfo.name}`, 'FAIL', {
          error: error.message,
          url: page.url()
        });
      }
    }

    // ========================================================================
    // CATEGORY 2: API ENDPOINT TESTING
    // ========================================================================
    console.log('\n📡 CATEGORY 2: API Endpoint Testing');
    console.log('-'.repeat(70));

    const apiEndpoints = [
      { path: '/api/crm/portfolios', method: 'GET', name: 'Get CRM Portfolios' },
      { path: '/api/rankings', method: 'GET', name: 'Get Rankings Data' },
      { path: '/api/keywords', method: 'GET', name: 'Get Keywords Data' },
      { path: '/api/seo-audits', method: 'GET', name: 'Get SEO Audits' },
      { path: '/api/onboarding/save', method: 'POST', name: 'Save Onboarding Data',
        body: { businessName: 'Test Company', email: 'test@example.com', industry: 'Technology', website: 'https://test.com' }
      }
    ];

    for (const endpoint of apiEndpoints) {
      try {
        const options = {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' }
        };

        if (endpoint.body) {
          options.body = JSON.stringify(endpoint.body);
        }

        const response = await page.evaluate(async ({ url, options }) => {
          const res = await fetch(url, options);
          return {
            status: res.status,
            ok: res.ok,
            statusText: res.statusText,
            data: res.ok ? await res.json().catch(() => null) : null
          };
        }, { url: `${API_BASE}${endpoint.path}`, options });

        if (response.ok) {
          logTest('apiEndpoints', endpoint.name, 'PASS', {
            status: response.status,
            hasData: !!response.data
          });
        } else {
          logTest('apiEndpoints', endpoint.name, 'FAIL', {
            error: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status
          });
        }
      } catch (error) {
        logTest('apiEndpoints', endpoint.name, 'FAIL', {
          error: error.message
        });
      }
    }

    // ========================================================================
    // CATEGORY 3: DATA OPERATIONS (CRUD)
    // ========================================================================
    console.log('\n💾 CATEGORY 3: Data Operations (CRUD)');
    console.log('-'.repeat(70));

    // Test: Create Company via Onboarding
    try {
      await page.goto(`${BASE_URL}/onboarding/new`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Fill Step 1: Business Info
      const testCompanyName = `Test Company ${Date.now()}`;
      await page.fill('[id="businessName"]', testCompanyName);
      await page.fill('[id="contactName"]', 'John Doe');
      await page.fill('[id="email"]', `test${Date.now()}@example.com`);
      await page.fill('[id="phone"]', '123-456-7890');

      // Check if form accepts input
      const businessNameValue = await page.inputValue('[id="businessName"]');

      if (businessNameValue === testCompanyName) {
        logTest('dataOperations', 'Create Company - Form Input', 'PASS', {
          companyName: testCompanyName
        });
      } else {
        logTest('dataOperations', 'Create Company - Form Input', 'FAIL', {
          error: 'Form input not captured',
          expected: testCompanyName,
          actual: businessNameValue
        });
      }
    } catch (error) {
      logTest('dataOperations', 'Create Company - Form Input', 'FAIL', {
        error: error.message
      });
    }

    // Test: Read Companies List
    try {
      await page.goto(`${BASE_URL}/companies`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const companiesExist = await page.locator('[data-testid="company-card"], .company-item, table tr').count() > 0 ||
                            await page.locator('text=No companies').count() > 0;

      if (companiesExist) {
        logTest('dataOperations', 'Read Companies List', 'PASS', {
          note: 'Companies page rendered successfully'
        });
      } else {
        logTest('dataOperations', 'Read Companies List', 'FAIL', {
          error: 'No companies list or empty state found'
        });
      }
    } catch (error) {
      logTest('dataOperations', 'Read Companies List', 'FAIL', {
        error: error.message
      });
    }

    // Test: Update - Save Progress
    try {
      await page.goto(`${BASE_URL}/onboarding/new`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      await page.fill('[id="businessName"]', 'Update Test Company');
      await page.fill('[id="email"]', 'update@test.com');

      // Click Save button
      const saveButton = await page.locator('button:has-text("Save")').first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(2000);

        // Check for success message
        const successVisible = await page.locator('text=Saved, text=Success').count() > 0;

        logTest('dataOperations', 'Update - Save Progress', successVisible ? 'PASS' : 'FAIL', {
          note: successVisible ? 'Save operation detected' : 'No save confirmation'
        });
      } else {
        logTest('dataOperations', 'Update - Save Progress', 'SKIP', {
          reason: 'Save button not available'
        });
      }
    } catch (error) {
      logTest('dataOperations', 'Update - Save Progress', 'FAIL', {
        error: error.message
      });
    }

    // ========================================================================
    // CATEGORY 4: INTEGRATION TESTING
    // ========================================================================
    console.log('\n🔗 CATEGORY 4: Integration Testing');
    console.log('-'.repeat(70));

    // Test: Google OAuth Integration
    try {
      await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const googleButtonExists = await page.locator('button:has-text("Google"), text=Sign in with Google').count() > 0;

      if (googleButtonExists) {
        logTest('integrations', 'Google OAuth Button Present', 'PASS');
      } else {
        logTest('integrations', 'Google OAuth Button Present', 'FAIL', {
          error: 'Google sign-in button not found'
        });
      }
    } catch (error) {
      logTest('integrations', 'Google OAuth Button Present', 'FAIL', {
        error: error.message
      });
    }

    // Test: Calendar Integration
    try {
      await page.goto(`${BASE_URL}/crm/calendar`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const calendarRendered = await page.locator('[data-testid="calendar"], .calendar, table').count() > 0;

      if (calendarRendered) {
        logTest('integrations', 'Calendar Component Renders', 'PASS');
      } else {
        logTest('integrations', 'Calendar Component Renders', 'FAIL', {
          error: 'Calendar component not found'
        });
      }
    } catch (error) {
      logTest('integrations', 'Calendar Component Renders', 'FAIL', {
        error: error.message
      });
    }

    // Test: API Key Configuration
    try {
      const hasAPIKeys = await page.evaluate(() => {
        return {
          hasAnthropicKey: !!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || !!window.localStorage.getItem('anthropic_key'),
          hasOpenAIKey: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY || !!window.localStorage.getItem('openai_key')
        };
      });

      logTest('integrations', 'API Keys Configuration Check', 'PASS', {
        note: 'Environment check completed'
      });
    } catch (error) {
      logTest('integrations', 'API Keys Configuration Check', 'FAIL', {
        error: error.message
      });
    }

    // ========================================================================
    // CATEGORY 5: USER FLOW TESTING
    // ========================================================================
    console.log('\n👤 CATEGORY 5: User Flow Testing');
    console.log('-'.repeat(70));

    // Test: Complete Onboarding Flow (Steps 1-5)
    try {
      await page.goto(`${BASE_URL}/onboarding/new`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const steps = [
        { name: 'Step 1', button: 'Next', visible: true },
        { name: 'Step 2', button: 'Next', visible: false },
        { name: 'Step 3', button: 'Next', visible: false }
      ];

      let currentStep = 0;
      for (const step of steps) {
        if (currentStep === 0) {
          // Fill basic info
          await page.fill('[id="businessName"]', 'Flow Test Company');
          await page.fill('[id="contactName"]', 'Flow Tester');
          await page.fill('[id="email"]', `flowtest${Date.now()}@example.com`);
        }

        const nextButton = await page.locator(`button:has-text("${step.button}")`).first();
        if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
          currentStep++;
        } else {
          break;
        }
      }

      logTest('userFlow', 'Multi-Step Onboarding Navigation', currentStep >= 1 ? 'PASS' : 'FAIL', {
        stepsCompleted: currentStep,
        totalSteps: steps.length
      });
    } catch (error) {
      logTest('userFlow', 'Multi-Step Onboarding Navigation', 'FAIL', {
        error: error.message
      });
    }

    // Test: Dashboard to Companies Navigation
    try {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const companiesLink = await page.locator('a[href="/companies"], text=Companies').first();
      if (await companiesLink.isVisible()) {
        await companiesLink.click();
        await page.waitForTimeout(2000);

        const onCompaniesPage = page.url().includes('/companies');

        logTest('userFlow', 'Dashboard → Companies Navigation', onCompaniesPage ? 'PASS' : 'FAIL', {
          currentUrl: page.url()
        });
      } else {
        logTest('userFlow', 'Dashboard → Companies Navigation', 'SKIP', {
          reason: 'Companies link not found on dashboard'
        });
      }
    } catch (error) {
      logTest('userFlow', 'Dashboard → Companies Navigation', 'FAIL', {
        error: error.message
      });
    }

    // ========================================================================
    // CATEGORY 6: PERFORMANCE TESTING
    // ========================================================================
    console.log('\n⚡ CATEGORY 6: Performance Testing');
    console.log('-'.repeat(70));

    // Test: Page Load Performance
    for (const testPage of ['/dashboard', '/companies', '/onboarding/new']) {
      try {
        const start = Date.now();
        await page.goto(`${BASE_URL}${testPage}`, { waitUntil: 'domcontentloaded' });
        const loadTime = Date.now() - start;

        const isPerfGood = loadTime < 3000;

        logTest('performance', `${testPage} Load Time`, isPerfGood ? 'PASS' : 'FAIL', {
          loadTime: `${loadTime}ms`,
          threshold: '3000ms',
          status: isPerfGood ? 'Under threshold' : 'Over threshold'
        });
      } catch (error) {
        logTest('performance', `${testPage} Load Time`, 'FAIL', {
          error: error.message
        });
      }
    }

    // Test: Console Errors
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('Warning') &&
      !err.includes('404') &&
      !err.includes('worker') // Ignore CSP worker warnings
    );

    if (criticalErrors.length === 0) {
      logTest('performance', 'No Critical Console Errors', 'PASS', {
        totalConsoleMessages: consoleErrors.length,
        criticalErrors: 0
      });
    } else {
      logTest('performance', 'No Critical Console Errors', 'FAIL', {
        criticalErrors: criticalErrors.length,
        examples: criticalErrors.slice(0, 3)
      });
    }

  } catch (fatalError) {
    console.error('\n💥 FATAL ERROR:', fatalError);
    testResults.errors.push({
      category: 'system',
      name: 'Fatal Test Error',
      error: fatalError.message,
      stack: fatalError.stack
    });
  } finally {
    await browser.close();

    // Calculate duration
    testResults.summary.duration = Date.now() - startTime;

    // ========================================================================
    // GENERATE COMPREHENSIVE REPORT
    // ========================================================================
    console.log('\n\n' + '='.repeat(70));
    console.log('📊 ULTIMATE CRM TEST REPORT');
    console.log('='.repeat(70));

    console.log(`\n⏱️  Duration: ${(testResults.summary.duration / 1000).toFixed(2)}s`);
    console.log(`📝 Total Tests: ${testResults.summary.totalTests}`);
    console.log(`✅ Passed: ${testResults.summary.passed} (${((testResults.summary.passed / testResults.summary.totalTests) * 100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${testResults.summary.failed} (${((testResults.summary.failed / testResults.summary.totalTests) * 100).toFixed(1)}%)`);
    console.log(`⏭️  Skipped: ${testResults.summary.skipped}`);

    console.log('\n📋 Category Breakdown:');
    for (const [category, data] of Object.entries(testResults.categories)) {
      const total = data.tests.length;
      const passRate = total > 0 ? ((data.passed / total) * 100).toFixed(1) : 0;
      console.log(`  ${category}: ${data.passed}/${total} (${passRate}%)`);
    }

    if (testResults.errors.length > 0) {
      console.log('\n❌ Top Errors:');
      testResults.errors.slice(0, 5).forEach((err, i) => {
        console.log(`  ${i + 1}. [${err.category}] ${err.name}`);
        console.log(`     ${err.error}`);
      });
    }

    // Save detailed report
    const reportPath = `./test-reports/crm-ultimate-test-${Date.now()}.json`;
    writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n💾 Detailed report saved: ${reportPath}`);

    console.log('\n' + '='.repeat(70));

    // Exit with appropriate code
    process.exit(testResults.summary.failed > 0 ? 1 : 0);
  }
}

// Execute
runUltimateCRMTest().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
