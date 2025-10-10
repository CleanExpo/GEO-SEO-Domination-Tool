/**
 * Verify: Run Audit Button Fix
 *
 * Tests that both issues are resolved:
 * 1. URL auto-populates (company API working)
 * 2. Run Audit creates AND displays results (audit GET working)
 */

import { chromium } from '@playwright/test';

const PRODUCTION_URL = 'https://geo-seo-domination-tool.vercel.app';
const COMPANY_ID = '43ad70bb-eaf5-4f63-b2dc-f447be94de07';
const TEST_URL = `${PRODUCTION_URL}/companies/${COMPANY_ID}/seo-audit`;

async function verifyFix() {
  console.log('\n🔍 VERIFYING RUN AUDIT FIX\n');
  console.log(`Testing: ${TEST_URL}\n`);

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    urlAutoPopulates: false,
    companyApiWorks: false,
    auditCreated: false,
    auditDisplayed: false
  };

  // Monitor network
  page.on('response', async res => {
    if (res.url().includes('/api/companies/')) {
      const status = res.status();
      console.log(`📡 Company API: ${status} ${res.url()}`);
      if (status === 200) {
        results.companyApiWorks = true;
        try {
          const json = await res.json();
          if (json.company?.website) {
            console.log(`   ✅ Company data: ${json.company.name} - ${json.company.website}`);
          }
        } catch (e) {}
      } else if (status >= 400) {
        console.log(`   ❌ ERROR`);
        try {
          const text = await res.text();
          console.log(`   ${text}`);
        } catch (e) {}
      }
    }

    if (res.url().includes('/api/seo-audits')) {
      const status = res.status();
      const method = res.request().method();
      console.log(`📡 Audit API ${method}: ${status}`);

      if (method === 'POST' && (status === 200 || status === 201)) {
        results.auditCreated = true;
        console.log(`   ✅ Audit created`);
      }

      if (method === 'GET' && status === 200) {
        try {
          const json = await res.json();
          if (json.audits && json.audits.length > 0) {
            results.auditDisplayed = true;
            console.log(`   ✅ Found ${json.audits.length} audit(s)`);
          } else {
            console.log(`   ⚠️  Audits array is empty`);
          }
        } catch (e) {}
      }
    }
  });

  try {
    console.log('1️⃣ Loading page...\n');
    await page.goto(TEST_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    console.log('\n2️⃣ Checking if URL auto-populated...\n');

    const urlInput = page.locator('input[type="url"]');
    const urlValue = await urlInput.inputValue();

    console.log(`   URL Input Value: "${urlValue}"`);

    if (urlValue && urlValue.trim() !== '') {
      results.urlAutoPopulates = true;
      console.log('   ✅ URL AUTO-POPULATED! (Fix #1 working)\n');
    } else {
      console.log('   ❌ URL is still empty (Fix #1 not working)\n');
      console.log('   Manually entering URL...');
      await urlInput.fill('https://example.com');
      await page.waitForTimeout(500);
    }

    console.log('\n3️⃣ Clicking "Run Audit" button...\n');

    const runButton = page.locator('button:has-text("Run Audit")');
    await runButton.click();

    console.log('   Waiting 20 seconds for audit to complete...\n');
    await page.waitForTimeout(20000);

    console.log('\n4️⃣ Checking if audit appeared on page...\n');

    const auditScoreElements = await page.locator('.text-4xl.font-bold').count();
    console.log(`   Found ${auditScoreElements} score elements`);

    if (auditScoreElements > 0) {
      console.log('   ✅ AUDIT DISPLAYED! (Fix #2 working)\n');

      // Get the score values
      const scores = await page.locator('.text-4xl.font-bold').allTextContents();
      console.log(`   Scores: ${scores.join(', ')}`);
    } else {
      console.log('   ❌ No audit displayed (Fix #2 not working)\n');
    }

    // Take screenshot
    console.log('\n📸 Taking screenshot...');
    await page.screenshot({ path: 'verify-fix-result.png', fullPage: true });
    console.log('   Saved: verify-fix-result.png\n');

    // Final results
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎯 VERIFICATION RESULTS:\n');
    console.log(`   ✅ Fix #1 - URL Auto-Populates:       ${results.urlAutoPopulates ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Fix #1 - Company API Works:        ${results.companyApiWorks ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Fix #2 - Audit Created:            ${results.auditCreated ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Fix #2 - Audit Displayed:          ${results.auditDisplayed ? 'PASS' : 'FAIL'}`);

    const allPassed = Object.values(results).every(v => v === true);

    if (allPassed) {
      console.log('\n🎉 ALL FIXES VERIFIED! Run Audit button is fully working!\n');
    } else {
      console.log('\n⚠️  SOME ISSUES REMAIN:\n');
      if (!results.urlAutoPopulates || !results.companyApiWorks) {
        console.log('   - Company API still has RLS issues');
      }
      if (!results.auditCreated) {
        console.log('   - Audit POST endpoint failing');
      }
      if (!results.auditDisplayed) {
        console.log('   - Audit GET endpoint returning empty or failing');
      }
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⏸️  Browser left open. Press Ctrl+C to close.');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error.message);
    await page.screenshot({ path: 'verify-fix-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

verifyFix();
