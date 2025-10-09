/**
 * Production Save Functionality Test
 * Tests the Vercel production deployment to identify save failures
 */

const { chromium } = require('playwright');

const PRODUCTION_URL = 'https://geo-seo-domination-tool-l74q66vr7-unite-group.vercel.app';

async function testProductionSave() {
  console.log('🚀 Starting Production Save Test...\n');
  console.log(`Testing: ${PRODUCTION_URL}/onboarding/new\n`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
  });

  // Capture network errors
  const networkErrors = [];
  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      failure: request.failure().errorText,
      timestamp: new Date().toISOString()
    });
  });

  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });

  try {
    console.log('📄 Navigating to onboarding page...');
    await page.goto(`${PRODUCTION_URL}/onboarding/new`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Page loaded\n');

    // Wait for form to be visible
    console.log('⏳ Waiting for form...');
    await page.waitForSelector('form', { timeout: 10000 });
    console.log('✅ Form found\n');

    // Fill out test data
    console.log('📝 Filling form with test data...');

    // Try to find and fill company name
    const companyNameInput = await page.locator('input[name="companyName"], input[placeholder*="company" i], input[placeholder*="business" i]').first();
    if (await companyNameInput.count() > 0) {
      await companyNameInput.fill('Test Company Production');
      console.log('✅ Filled company name');
    }

    // Try to find and fill email
    const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.count() > 0) {
      await emailInput.fill('test@production.com');
      console.log('✅ Filled email');
    }

    // Look for Save button
    console.log('\n🔍 Looking for Save button...');
    const saveButton = await page.locator('button:has-text("Save"), button:has-text("save")').first();

    if (await saveButton.count() === 0) {
      console.log('❌ Save button not found!');
      console.log('\nAvailable buttons:');
      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        const text = await button.textContent();
        console.log(`  - "${text}"`);
      }
    } else {
      console.log('✅ Save button found');

      // Click Save
      console.log('\n💾 Clicking Save button...');
      await saveButton.click();

      // Wait for response
      console.log('⏳ Waiting for save response...');
      await page.waitForTimeout(3000);

      // Check for success/error messages
      const errorMessages = await page.locator('[role="alert"], .error, .text-red-500').allTextContents();
      const successMessages = await page.locator('.success, .text-green-500, [role="status"]').allTextContents();

      if (errorMessages.length > 0) {
        console.log('\n❌ Error messages found:');
        errorMessages.forEach(msg => console.log(`  - ${msg}`));
      }

      if (successMessages.length > 0) {
        console.log('\n✅ Success messages found:');
        successMessages.forEach(msg => console.log(`  - ${msg}`));
      }

      if (errorMessages.length === 0 && successMessages.length === 0) {
        console.log('\n⚠️  No success or error messages found');
      }
    }

    // Check for JavaScript errors in console
    console.log('\n📊 Console Logs Analysis:');
    const errors = consoleLogs.filter(log => log.type === 'error');
    const warnings = consoleLogs.filter(log => log.type === 'warning');

    if (errors.length > 0) {
      console.log(`\n❌ ${errors.length} Console Errors:`);
      errors.slice(0, 10).forEach(err => {
        console.log(`  [${err.timestamp}] ${err.text}`);
      });
    } else {
      console.log('✅ No console errors');
    }

    if (warnings.length > 0) {
      console.log(`\n⚠️  ${warnings.length} Console Warnings:`);
      warnings.slice(0, 5).forEach(warn => {
        console.log(`  [${warn.timestamp}] ${warn.text}`);
      });
    }

    // Check for network errors
    if (networkErrors.length > 0) {
      console.log(`\n❌ ${networkErrors.length} Network Errors:`);
      networkErrors.forEach(err => {
        console.log(`  ${err.url}: ${err.failure}`);
      });
    } else {
      console.log('\n✅ No network errors');
    }

    // Check for page errors
    if (pageErrors.length > 0) {
      console.log(`\n❌ ${pageErrors.length} Page Errors:`);
      pageErrors.forEach(err => {
        console.log(`  ${err.message}`);
        if (err.stack) {
          console.log(`    ${err.stack.split('\n')[0]}`);
        }
      });
    } else {
      console.log('✅ No page errors');
    }

    // Take screenshot
    const screenshotPath = 'd:\\GEO_SEO_Domination-Tool\\production-save-test.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n📸 Screenshot saved: ${screenshotPath}`);

    // Wait for user to inspect
    console.log('\n⏸️  Browser will stay open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('\n✅ Test complete');
  }
}

// Run the test
testProductionSave().catch(console.error);
