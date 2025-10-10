/**
 * Debug: User's Specific Audit Page
 *
 * Tests the exact page the user is on
 */

import { chromium } from '@playwright/test';

const USER_URL = 'https://geo-seo-domination-tool.vercel.app/companies/43ad70bb-eaf5-4f63-b2dc-f447be94de07/seo-audit';

async function debugUserPage() {
  console.log('\n🔍 DEBUGGING USER\'S AUDIT PAGE\n');
  console.log(`URL: ${USER_URL}\n`);

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = {
    console: [],
    network: [],
    errors: []
  };

  // Console monitoring
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    logs.console.push({ type, text });

    const icons = { error: '❌', warning: '⚠️ ', info: 'ℹ️ ', log: '📝' };
    console.log(`${icons[type] || '  '} [Console ${type}] ${text}`);
  });

  // Network monitoring
  page.on('request', req => {
    if (req.url().includes('/api/')) {
      const info = `${req.method()} ${req.url()}`;
      logs.network.push({ type: 'request', info });
      console.log(`🌐 REQUEST: ${info}`);

      if (req.postDataJSON()) {
        console.log(`   Body:`, req.postDataJSON());
      }
    }
  });

  page.on('response', async res => {
    if (res.url().includes('/api/')) {
      const status = res.status();
      const info = `${status} ${res.url()}`;
      logs.network.push({ type: 'response', info, status });

      const icon = status === 200 ? '✅' : status >= 400 ? '❌' : '⚠️ ';
      console.log(`${icon} RESPONSE: ${info}`);

      try {
        const text = await res.text();
        if (text.length < 500) {
          console.log(`   Body: ${text}`);
        }
      } catch (e) {
        // Can't read body
      }
    }
  });

  // Error monitoring
  page.on('pageerror', error => {
    logs.errors.push(error.message);
    console.log(`❌ PAGE ERROR: ${error.message}`);
  });

  try {
    console.log('1️⃣ Loading page...\n');
    await page.goto(USER_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    console.log('\n2️⃣ Checking page elements...\n');

    // Check if page loaded
    const title = await page.locator('h1').textContent().catch(() => 'NOT FOUND');
    console.log(`   Page Title: ${title}`);

    // Check for URL input
    const urlInput = page.locator('input[type="url"]');
    const urlExists = await urlInput.count();
    console.log(`   URL Input: ${urlExists > 0 ? '✅ Found' : '❌ Not Found'}`);

    if (urlExists > 0) {
      const urlValue = await urlInput.inputValue();
      console.log(`   URL Value: "${urlValue}"`);

      if (!urlValue || urlValue.trim() === '') {
        console.log(`   ⚠️  URL is EMPTY - This is why it's not auto-populated!`);
      }
    }

    // Check for Run Audit button
    const runButton = page.locator('button:has-text("Run Audit")');
    const buttonExists = await runButton.count();
    console.log(`   Run Audit Button: ${buttonExists > 0 ? '✅ Found' : '❌ Not Found'}`);

    if (buttonExists > 0) {
      const isDisabled = await runButton.isDisabled();
      console.log(`   Button Disabled: ${isDisabled}`);
    }

    console.log('\n3️⃣ Checking company data from API...\n');

    // Check what the API returns for this company
    const companyId = '43ad70bb-eaf5-4f63-b2dc-f447be94de07';
    const companyApiUrl = `https://geo-seo-domination-tool.vercel.app/api/companies/${companyId}`;

    console.log(`   Fetching: ${companyApiUrl}`);

    const apiResponse = await page.evaluate(async (url) => {
      try {
        const res = await fetch(url);
        const text = await res.text();
        return { ok: res.ok, status: res.status, text };
      } catch (error) {
        return { error: error.message };
      }
    }, companyApiUrl);

    console.log(`   Status: ${apiResponse.status}`);
    console.log(`   Body: ${apiResponse.text}`);

    if (!apiResponse.ok) {
      console.log(`\n❌ PROBLEM FOUND: Company API is returning error!`);
      console.log(`   This is why the URL doesn't auto-populate.`);
      console.log(`   The fetchCompany() function at line 50 is failing.`);
    }

    console.log('\n4️⃣ Manually entering URL and testing Run Audit...\n');

    // Fill URL manually
    console.log('   Filling URL: https://example.com');
    await urlInput.fill('https://example.com');
    await page.waitForTimeout(500);

    // Check if button enabled
    const nowEnabled = !(await runButton.isDisabled());
    console.log(`   Button Enabled: ${nowEnabled}`);

    if (!nowEnabled) {
      console.log(`   ⚠️  Button still disabled - checking why...`);
      const placeholder = await urlInput.getAttribute('placeholder');
      const value = await urlInput.inputValue();
      console.log(`      Placeholder: ${placeholder}`);
      console.log(`      Actual value: ${value}`);
    }

    console.log('\n   Clicking "Run Audit"...');
    await runButton.click();

    console.log('   Waiting 15 seconds for response...\n');
    await page.waitForTimeout(15000);

    // Check if audit appeared
    const auditScores = await page.locator('.text-4xl.font-bold').count();
    console.log(`   Audit score elements found: ${auditScores}`);

    if (auditScores > 0) {
      console.log('   ✅ Audit seems to have run!\n');
    } else {
      console.log('   ❌ No audit appeared\n');
    }

    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'debug-user-audit-page.png', fullPage: true });
    console.log('   Saved: debug-user-audit-page.png\n');

    console.log('📊 DIAGNOSIS SUMMARY:\n');

    const consoleErrors = logs.console.filter(l => l.type === 'error');
    const apiErrors = logs.network.filter(l => l.type === 'response' && l.status >= 400);

    console.log(`   Console Errors: ${consoleErrors.length}`);
    consoleErrors.forEach(e => console.log(`     - ${e.text}`));

    console.log(`   API Errors: ${apiErrors.length}`);
    apiErrors.forEach(e => console.log(`     - ${e.info}`));

    console.log(`   Page Errors: ${logs.errors.length}`);
    logs.errors.forEach(e => console.log(`     - ${e}`));

    if (consoleErrors.length === 0 && apiErrors.length === 0 && logs.errors.length === 0) {
      console.log('\n✅ No obvious errors detected.');
      console.log('   Check screenshot for UI state.\n');
    } else {
      console.log('\n❌ Errors detected. See details above.\n');
    }

    console.log('⏸️  Browser left open. Press Ctrl+C to close.');
    await page.waitForTimeout(300000);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await page.screenshot({ path: 'debug-user-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

debugUserPage();
