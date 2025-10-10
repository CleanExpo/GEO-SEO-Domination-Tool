/**
 * Production Test: Path E Implementation on Vercel
 *
 * Tests that the React Hook Form + real-time validation works in production
 */

import { chromium } from '@playwright/test';

const PRODUCTION_URL = 'https://geo-seo-domination-tool-77475khvq-unite-group.vercel.app';

async function testProduction() {
  console.log('\n🚀 PRODUCTION TEST: Path E Implementation\n');
  console.log(`URL: ${PRODUCTION_URL}/onboarding/new-v2\n`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Log errors
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error') {
      console.log(`[Browser ERROR]:`, msg.text());
    }
  });

  try {
    console.log('📍 Navigating to production URL...');
    await page.goto(`${PRODUCTION_URL}/onboarding/new-v2`, {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    await page.waitForTimeout(2000);

    console.log('✅ Page loaded successfully\n');

    // Verify page title
    const title = await page.locator('h1').textContent();
    console.log(`📄 Page Title: ${title}`);

    const subtitle = await page.locator('text=/Path E Implementation/i').textContent().catch(() => null);
    if (subtitle) {
      console.log(`   Subtitle: ${subtitle}`);
    }

    // Check initial button state
    console.log('\n🔘 Testing Next Button Validation:\n');
    const nextButton = page.locator('button:has-text("Next")');

    const initialState = await nextButton.isDisabled();
    console.log(`   1. Initial state: ${initialState ? '❌ Disabled (correct)' : '✅ Enabled (wrong!)'}`);

    if (!initialState) {
      throw new Error('FAIL: Button should be disabled initially');
    }

    // Fill required fields one by one
    console.log('\n   2. Filling required fields:');

    console.log('      • Business Name: "Test Company Pty Ltd"');
    await page.fill('input[name="businessName"]', 'Test Company Pty Ltd');
    await page.waitForTimeout(500);
    let currentState = await nextButton.isDisabled();
    console.log(`        Button: ${currentState ? '❌ Still disabled' : '✅ Enabled'}`);

    console.log('      • Contact Name: "John Doe"');
    await page.fill('input[name="contactName"]', 'John Doe');
    await page.waitForTimeout(500);
    currentState = await nextButton.isDisabled();
    console.log(`        Button: ${currentState ? '❌ Still disabled' : '✅ Enabled'}`);

    console.log('      • Email: "test@example.com"');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.waitForTimeout(500);

    const finalState = await nextButton.isDisabled();
    console.log(`        Button: ${finalState ? '❌ Disabled' : '✅ Enabled'}\n`);

    if (finalState) {
      // Check for errors
      const errors = await page.locator('.text-red-500').allTextContents();
      if (errors.length > 0) {
        console.log('   ⚠️  Validation errors found:');
        errors.forEach(err => console.log(`      - ${err}`));
      }
      throw new Error('FAIL: Button should be enabled after filling 3 required fields');
    }

    console.log('✅ SUCCESS: Real-time validation working in production!\n');

    // Test navigation
    console.log('🎬 Testing Step Navigation:\n');
    console.log('   Clicking Next button...');
    await nextButton.click();
    await page.waitForTimeout(1500);

    const step1Title = await page.locator('text=/Website/i').textContent().catch(() => null);
    if (step1Title) {
      console.log(`   ✅ Navigated to Step 2: ${step1Title}`);
    } else {
      throw new Error('FAIL: Should have moved to Step 2');
    }

    // Test back button
    console.log('\n   Clicking Back button...');
    const backButton = page.locator('button:has-text("Back")');
    await backButton.click();
    await page.waitForTimeout(1000);

    const backToStep0 = await page.locator('text=/Business Info/i').textContent();
    console.log(`   ✅ Navigated back to Step 1: ${backToStep0}`);

    // Take screenshots
    console.log('\n📸 Taking screenshots...');
    await page.screenshot({ path: 'production-path-e-step0.png', fullPage: true });
    console.log('   Saved: production-path-e-step0.png');

    await nextButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'production-path-e-step1.png', fullPage: true });
    console.log('   Saved: production-path-e-step1.png');

    console.log('\n🎉 PRODUCTION TEST PASSED!\n');
    console.log('Summary:');
    console.log('  ✅ Page loads correctly');
    console.log('  ✅ Next button disabled initially');
    console.log('  ✅ Real-time validation enables button');
    console.log('  ✅ Step navigation working');
    console.log('  ✅ Back button working');

    console.log('\n⏸️  Browser left open. Press Ctrl+C to close.');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('\n❌ PRODUCTION TEST FAILED:', error.message);
    await page.screenshot({ path: 'production-path-e-error.png', fullPage: true });
    console.log('📸 Error screenshot: production-path-e-error.png');
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testProduction();
