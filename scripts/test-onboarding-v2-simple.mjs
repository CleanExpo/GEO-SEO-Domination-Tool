/**
 * Simple Playwright Test: Just 3 Required Fields
 */

import { chromium } from '@playwright/test';

async function testSimple() {
  console.log('\n🎭 Testing Path E - Simple (3 Required Fields Only)\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Log console messages from the browser
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[Browser ${type.toUpperCase()}]:`, msg.text());
    }
  });

  try {
    console.log('📍 Navigating to /onboarding/new-v2...');
    await page.goto('http://localhost:3000/onboarding/new-v2', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Check initial button state
    const nextButton = page.locator('button:has-text("Next")');
    console.log('\n✅ Initial state: Next button disabled:', await nextButton.isDisabled());

    // Fill ONLY the 3 required fields
    console.log('\n📝 Filling required fields:');

    console.log('   1. Business Name...');
    await page.fill('input[name="businessName"]', 'Test Company');
    await page.waitForTimeout(500);
    console.log('      Button disabled:', await nextButton.isDisabled());

    console.log('   2. Contact Name...');
    await page.fill('input[name="contactName"]', 'John Doe');
    await page.waitForTimeout(500);
    console.log('      Button disabled:', await nextButton.isDisabled());

    console.log('   3. Email...');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.waitForTimeout(500);

    const finalState = await nextButton.isDisabled();
    console.log('      Button disabled:', finalState);

    if (finalState) {
      console.log('\n⚠️  Button still disabled! Checking for validation errors...');

      // Get all error messages
      const errorElements = await page.locator('.text-red-500').all();
      console.log(`   Found ${errorElements.length} error elements`);

      for (let i = 0; i < errorElements.length; i++) {
        const text = await errorElements[i].textContent();
        console.log(`   Error ${i + 1}: ${text}`);
      }

      // Check form validation state via debug info
      const debugInfo = await page.locator('details:has-text("Debug Info")').textContent().catch(() => null);
      if (debugInfo) {
        console.log('\n📊 Debug Info:', debugInfo);
      }

      // Try to find the actual form state
      const formData = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[name]');
        const data = {};
        inputs.forEach(input => {
          data[input.getAttribute('name')] = input.value;
        });
        return data;
      });
      console.log('\n📋 Form Data:', JSON.stringify(formData, null, 2));

      throw new Error('❌ FAIL: Button should be enabled after filling 3 required fields');
    }

    console.log('\n🎉 SUCCESS! Next button enabled correctly!');

    // Take screenshot
    await page.screenshot({ path: 'onboarding-v2-success.png', fullPage: true });
    console.log('📸 Screenshot saved: onboarding-v2-success.png');

    // Keep browser open
    console.log('\n⏸️  Browser left open. Press Ctrl+C to close.');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: 'onboarding-v2-error-simple.png', fullPage: true });
    console.log('📸 Error screenshot: onboarding-v2-error-simple.png');
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testSimple();
