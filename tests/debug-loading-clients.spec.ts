import { test, expect } from '@playwright/test';

test.describe('Debug: Loading Saved Clients Spinner', () => {
  test('investigate loading saved clients spinner issue', async ({ page }) => {
    // Set longer timeout for debugging
    test.setTimeout(60000);

    // Enable console logging
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    // Enable request logging
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log('REQUEST:', request.method(), request.url());
      }
    });

    // Enable response logging
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log('RESPONSE:', response.status(), response.url());
      }
    });

    // Navigate to onboarding page
    console.log('Navigating to onboarding page...');
    await page.goto('https://geo-seo-domination-tool-qybjjcrlj-unite-group.vercel.app/onboarding/new');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    await page.screenshot({ path: '.tom/debug-onboarding-initial.png', fullPage: true });
    console.log('Screenshot saved: debug-onboarding-initial.png');

    // Check if "Loading saved clients..." text is present
    const loadingText = page.locator('text=/Loading saved clients/i');
    const isLoadingVisible = await loadingText.isVisible().catch(() => false);

    if (isLoadingVisible) {
      console.log('✅ Found "Loading saved clients..." spinner');

      // Wait up to 10 seconds to see if it resolves
      console.log('Waiting 10 seconds to see if spinner resolves...');
      await page.waitForTimeout(10000);

      // Check if still visible
      const stillVisible = await loadingText.isVisible().catch(() => false);
      if (stillVisible) {
        console.log('❌ ISSUE CONFIRMED: Spinner still visible after 10 seconds');

        // Take screenshot of stuck state
        await page.screenshot({ path: '.tom/debug-onboarding-stuck.png', fullPage: true });
        console.log('Screenshot saved: debug-onboarding-stuck.png');

        // Check network requests
        console.log('\n=== CHECKING FOR PENDING REQUESTS ===');

        // Get all network activity
        const allRequests = [];
        page.on('request', req => allRequests.push(req));

        await page.waitForTimeout(2000);

        // Check browser console errors
        const consoleLogs = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleLogs.push(msg.text());
          }
        });

        console.log('Console errors:', consoleLogs);
      } else {
        console.log('✅ Spinner resolved successfully');
      }
    } else {
      console.log('❌ "Loading saved clients..." spinner not found');
    }

    // Check what API endpoint is being called
    console.log('\n=== CHECKING API ENDPOINTS ===');

    // Look for the LoadClientDropdown component
    const dropdown = page.locator('[class*="LoadClient"]').first();
    if (await dropdown.isVisible().catch(() => false)) {
      console.log('✅ LoadClientDropdown component found');

      // Try to find the actual endpoint being called
      const html = await page.content();
      console.log('Page loaded successfully');
    }

    // Get page HTML for analysis
    const pageContent = await page.content();
    console.log('\n=== SEARCHING FOR FETCH CALLS IN PAGE ===');

    // Check if there are any failed requests
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure()
      });
    });

    await page.waitForTimeout(2000);

    if (failedRequests.length > 0) {
      console.log('❌ FAILED REQUESTS:', failedRequests);
    } else {
      console.log('✅ No failed requests detected');
    }

    // Final screenshot
    await page.screenshot({ path: '.tom/debug-onboarding-final.png', fullPage: true });
    console.log('\n=== INVESTIGATION COMPLETE ===');
  });
});
