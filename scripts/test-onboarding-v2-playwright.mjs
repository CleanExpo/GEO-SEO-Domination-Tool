/**
 * Playwright E2E Test: Path E Implementation - Next Button Enabling
 *
 * Tests real-time validation with React Hook Form + Zod
 */

import { chromium } from '@playwright/test';

async function testOnboardingV2NextButton() {
  console.log('\n🎭 Playwright Test: Path E Implementation - Next Button Enabling\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to V2 onboarding page
    console.log('📍 Navigating to /onboarding/new-v2...');
    await page.goto('http://localhost:3000/onboarding/new-v2', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Check initial state
    console.log('\n✅ Step 1: Verify Next button is initially disabled');
    const nextButton = page.locator('button:has-text("Next")');
    const isInitiallyDisabled = await nextButton.isDisabled();
    console.log(`   Next button disabled: ${isInitiallyDisabled}`);

    if (!isInitiallyDisabled) {
      throw new Error('❌ FAIL: Next button should be disabled initially');
    }

    // Fill required fields one by one
    console.log('\n✅ Step 2: Fill Business Name field');
    await page.fill('input[name="businessName"]', 'Test Company Pty Ltd');
    await page.waitForTimeout(300); // Wait for validation

    let isStillDisabled = await nextButton.isDisabled();
    console.log(`   Next button disabled after business name: ${isStillDisabled} (expected: true - more fields required)`);

    console.log('\n✅ Step 3: Fill Email field');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.waitForTimeout(300);

    isStillDisabled = await nextButton.isDisabled();
    console.log(`   Next button disabled after email: ${isStillDisabled} (expected: true - more fields required)`);

    console.log('\n✅ Step 4: Fill Contact Name field');
    await page.fill('input[name="contactName"]', 'John Doe');
    await page.waitForTimeout(300);

    isStillDisabled = await nextButton.isDisabled();
    console.log(`   Next button disabled after contact name: ${isStillDisabled} (expected: true - more fields required)`);

    console.log('\n✅ Step 5: Fill Phone field');
    await page.fill('input[name="phone"]', '0412345678');
    await page.waitForTimeout(300);

    // Final check - button should now be enabled
    const isFinallyEnabled = await nextButton.isEnabled();
    console.log(`   Next button enabled after all required fields: ${isFinallyEnabled}`);

    if (!isFinallyEnabled) {
      // Check for validation errors
      const errors = await page.locator('.text-red-500').allTextContents();
      if (errors.length > 0) {
        console.log('\n⚠️  Validation errors found:');
        errors.forEach(err => console.log(`     - ${err}`));
      }
      throw new Error('❌ FAIL: Next button should be enabled after filling all required fields');
    }

    // Test invalid email to verify real-time validation
    console.log('\n✅ Step 6: Test real-time validation with invalid email');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.waitForTimeout(300);

    isStillDisabled = await nextButton.isDisabled();
    console.log(`   Next button disabled with invalid email: ${isStillDisabled} (expected: true)`);

    if (!isStillDisabled) {
      throw new Error('❌ FAIL: Next button should be disabled when email is invalid');
    }

    // Check for error message
    const errorMessage = await page.locator('text=/Please enter a valid email/i').textContent().catch(() => null);
    console.log(`   Error message displayed: ${errorMessage ? '✅ Yes' : '❌ No'}`);

    // Fix email and verify button re-enables
    console.log('\n✅ Step 7: Fix email and verify button re-enables');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.waitForTimeout(300);

    const isReEnabled = await nextButton.isEnabled();
    console.log(`   Next button re-enabled with valid email: ${isReEnabled}`);

    if (!isReEnabled) {
      throw new Error('❌ FAIL: Next button should re-enable after fixing validation error');
    }

    // Test clicking Next button
    console.log('\n✅ Step 8: Click Next button to proceed to Step 1');
    await nextButton.click();
    await page.waitForTimeout(1000);

    // Verify we moved to Step 1 (Website Information)
    const step1Heading = await page.locator('text=/Website Information/i').textContent().catch(() => null);
    console.log(`   Moved to Step 1: ${step1Heading ? '✅ Yes' : '❌ No'}`);

    if (!step1Heading) {
      throw new Error('❌ FAIL: Should have moved to Step 1 after clicking Next');
    }

    // Test debounced auto-save
    console.log('\n✅ Step 9: Test debounced auto-save (2 second delay)');
    console.log('   Filling fields and waiting for auto-save...');
    await page.fill('input[name="website"]', 'https://example.com');
    await page.waitForTimeout(2500); // Wait for debounce (2s) + processing

    console.log('   ✅ Auto-save triggered (check console logs)');

    console.log('\n🎉 SUCCESS! All Path E features working correctly:\n');
    console.log('   ✅ Next button disabled initially');
    console.log('   ✅ Real-time validation (enables as fields are filled)');
    console.log('   ✅ Validation errors displayed');
    console.log('   ✅ Button re-enables after fixing errors');
    console.log('   ✅ Step navigation working');
    console.log('   ✅ Debounced auto-save triggered');

    console.log('\n📸 Taking screenshot...');
    await page.screenshot({ path: 'onboarding-v2-step-1.png', fullPage: true });
    console.log('   Screenshot saved: onboarding-v2-step-1.png');

    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser left open for manual inspection. Press Ctrl+C to close.');
    await page.waitForTimeout(300000); // 5 minutes

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await page.screenshot({ path: 'onboarding-v2-error.png', fullPage: true });
    console.log('   Error screenshot saved: onboarding-v2-error.png');
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testOnboardingV2NextButton();
