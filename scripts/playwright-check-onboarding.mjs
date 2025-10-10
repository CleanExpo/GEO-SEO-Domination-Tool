/**
 * Playwright script to check onboarding progress page
 * Usage: node scripts/playwright-check-onboarding.mjs <onboarding-id>
 */

import { chromium } from 'playwright';

const onboardingId = process.argv[2] || 'onboarding_1760120721883_x5s1uvj2f';
const baseUrl = 'https://geo-seo-domination-tool.vercel.app';

(async () => {
  console.log('\n🎭 Starting Playwright Browser...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen to console messages
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE ${msg.type()}]:`, msg.text());
  });

  // Listen to network requests
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log(`[REQUEST] ${request.method()} ${request.url()}`);
    }
  });

  // Listen to network responses
  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
      try {
        const body = await response.text();
        console.log(`[RESPONSE BODY]:`, body.substring(0, 200));
      } catch (e) {
        // Some responses can't be read
      }
    }
  });

  try {
    console.log(`📍 Navigating to: ${baseUrl}/onboarding/${onboardingId}\n`);
    await page.goto(`${baseUrl}/onboarding/${onboardingId}`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Get page title
    const title = await page.title();
    console.log(`\n📄 Page Title: ${title}`);

    // Check for error messages
    const errorText = await page.locator('text=/error|failed/i').first().textContent().catch(() => null);
    if (errorText) {
      console.log(`\n❌ Error found on page: ${errorText}`);
    }

    // Get progress status
    const statusText = await page.locator('text=/pending|in_progress|completed/i').first().textContent().catch(() => 'Not found');
    console.log(`\n📊 Status Text: ${statusText}`);

    // Get overall progress percentage
    const progressText = await page.locator('text=/Overall Progress/i').first().textContent().catch(() => null);
    if (progressText) {
      console.log(`\n📈 Progress: ${progressText}`);
    }

    // Get all step statuses
    console.log('\n📋 Onboarding Steps:');
    const steps = await page.locator('[class*="step"], [class*="Step"]').all();
    for (let i = 0; i < steps.length; i++) {
      const stepText = await steps[i].textContent();
      console.log(`  Step ${i + 1}: ${stepText?.trim()}`);
    }

    // Screenshot
    await page.screenshot({ path: 'onboarding-status.png', fullPage: true });
    console.log('\n📸 Screenshot saved to: onboarding-status.png');

    // Check network activity
    console.log('\n🌐 Waiting 5 seconds to observe network activity...');
    await page.waitForTimeout(5000);

    console.log('\n✅ Investigation complete!');

  } catch (error) {
    console.error('\n❌ Error during investigation:', error.message);
  } finally {
    await browser.close();
  }
})();
