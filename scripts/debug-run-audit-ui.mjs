/**
 * Debug: Run Audit Button - Browser Console Monitoring
 *
 * Opens the SEO Audit page and monitors console for errors
 */

import { chromium } from '@playwright/test';

const PRODUCTION_URL = 'https://geo-seo-domination-tool-77475khvq-unite-group.vercel.app';

async function debugRunAudit() {
  console.log('\n🔍 DEBUG: Run Audit Button - Browser Console Monitoring\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture ALL console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text, timestamp: new Date().toISOString() });

    const icon = {
      error: '❌',
      warning: '⚠️ ',
      info: 'ℹ️ ',
      log: '📝',
      debug: '🐛'
    }[type] || '  ';

    console.log(`${icon} [${type}] ${text}`);
  });

  // Capture network requests
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log(`🌐 REQUEST: ${request.method()} ${request.url()}`);
      if (request.postDataJSON()) {
        console.log(`   Body:`, JSON.stringify(request.postDataJSON()));
      }
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      const status = response.status();
      const icon = status === 200 ? '✅' : status >= 400 ? '❌' : '⚠️ ';
      console.log(`${icon} RESPONSE: ${status} ${response.url()}`);

      try {
        const body = await response.text();
        if (body && body.length < 500) {
          console.log(`   Response: ${body}`);
        } else if (body) {
          console.log(`   Response: ${body.substring(0, 200)}...`);
        }
      } catch (e) {
        // Some responses can't be read
      }
    }
  });

  try {
    // Step 1: Try to find a company
    console.log('\n1️⃣ Navigating to companies page to find a test company...');
    await page.goto(`${PRODUCTION_URL}/companies`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check if there are any companies listed
    const companyLinks = await page.locator('a[href*="/companies/"]').all();

    if (companyLinks.length === 0) {
      console.log('\n❌ No companies found on the page.');
      console.log('   You need to create a company first through the onboarding flow.');
      console.log('\n📸 Taking screenshot...');
      await page.screenshot({ path: 'debug-no-companies.png', fullPage: true });
      console.log('   Saved: debug-no-companies.png\n');

      console.log('⏸️  Browser left open. Go to /onboarding/new-v2 to create a company.');
      console.log('   Then we can test the Run Audit button.');
      await page.waitForTimeout(300000); // 5 minutes
      return;
    }

    console.log(`✅ Found ${companyLinks.length} companies on the page\n`);

    // Click the first company's SEO Audit link
    const firstCompanyHref = await companyLinks[0].getAttribute('href');
    console.log(`2️⃣ Opening first company: ${firstCompanyHref}`);

    // Navigate to SEO Audit page
    const auditUrl = `${PRODUCTION_URL}${firstCompanyHref}/seo-audit`;
    console.log(`   Navigating to: ${auditUrl}\n`);

    await page.goto(auditUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('3️⃣ Page loaded. Checking for "Run Audit" button...\n');

    // Find the URL input and Run Audit button
    const urlInput = page.locator('input[type="url"]');
    const runButton = page.locator('button:has-text("Run Audit")');

    const urlValue = await urlInput.inputValue();
    const isDisabled = await runButton.isDisabled();

    console.log(`   URL Input: "${urlValue}"`);
    console.log(`   Button Disabled: ${isDisabled}\n`);

    if (isDisabled) {
      console.log('⚠️  Run Audit button is DISABLED.');
      console.log('   Entering a test URL...\n');
      await urlInput.fill('https://example.com');
      await page.waitForTimeout(500);

      const stillDisabled = await runButton.isDisabled();
      console.log(`   Button Disabled after entering URL: ${stillDisabled}\n`);
    }

    console.log('4️⃣ Clicking "Run Audit" button...\n');

    await runButton.click();

    console.log('   Button clicked. Waiting for response...\n');

    // Wait for either success or error
    await page.waitForTimeout(20000); // 20 seconds

    console.log('\n📸 Taking screenshot of result...');
    await page.screenshot({ path: 'debug-run-audit-result.png', fullPage: true });
    console.log('   Saved: debug-run-audit-result.png\n');

    // Check if audit appeared
    const auditCards = await page.locator('.bg-white.rounded-lg.shadow-md').count();
    console.log(`   Found ${auditCards} audit cards on the page`);

    if (auditCards > 1) { // First card is the "Run New Audit" section
      console.log('   ✅ New audit appeared!\n');
    } else {
      console.log('   ❌ No new audit appeared. Check console messages above.\n');
    }

    console.log('📊 CONSOLE SUMMARY:\n');
    const errors = consoleMessages.filter(m => m.type === 'error');
    const warnings = consoleMessages.filter(m => m.type === 'warning');

    console.log(`   Errors: ${errors.length}`);
    if (errors.length > 0) {
      errors.forEach(e => console.log(`     - ${e.text}`));
    }

    console.log(`   Warnings: ${warnings.length}`);
    if (warnings.length > 0 && warnings.length < 5) {
      warnings.forEach(w => console.log(`     - ${w.text}`));
    }

    console.log('\n⏸️  Browser left open for inspection. Press Ctrl+C to close.');
    await page.waitForTimeout(300000); // 5 minutes

  } catch (error) {
    console.error('\n❌ DEBUG FAILED:', error.message);
    await page.screenshot({ path: 'debug-run-audit-error.png', fullPage: true });
    console.log('📸 Error screenshot: debug-run-audit-error.png');
  } finally {
    await browser.close();
  }
}

debugRunAudit();
