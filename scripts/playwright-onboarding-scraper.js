const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('📍 Navigating to onboarding page...');
  await page.goto('https://geo-seo-domination-tool.vercel.app/onboarding/new', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  console.log('✅ Page loaded');
  console.log('');

  // Get page title and URL
  const title = await page.title();
  const url = page.url();
  console.log('Page Title:', title);
  console.log('Current URL:', url);
  console.log('');

  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  // Collect network errors
  const failedRequests = [];
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText
    });
  });

  // Collect API responses
  const apiResponses = [];
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('onboarding')) {
      try {
        const body = await response.text().catch(() => '');
        apiResponses.push({
          url,
          status: response.status(),
          statusText: response.statusText(),
          body: body.substring(0, 500)
        });
      } catch (e) {
        apiResponses.push({
          url,
          status: response.status(),
          statusText: response.statusText(),
          error: e.message
        });
      }
    }
  });

  // Wait for any async operations
  await page.waitForTimeout(3000);

  // Get page structure
  const pageInfo = await page.evaluate(() => {
    return {
      hasForm: !!document.querySelector('form'),
      formCount: document.querySelectorAll('form').length,
      inputFields: Array.from(document.querySelectorAll('input')).map(input => ({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        required: input.required,
        value: input.value ? '[HAS_VALUE]' : '[EMPTY]'
      })),
      buttons: Array.from(document.querySelectorAll('button')).map(btn => ({
        text: btn.textContent?.trim().substring(0, 50),
        type: btn.type,
        disabled: btn.disabled,
        className: btn.className
      })),
      heading: document.querySelector('h1')?.textContent || document.querySelector('h2')?.textContent,
      errors: Array.from(document.querySelectorAll('[class*="error"], [role="alert"], .text-red-500, .text-red-600')).map(el => ({
        text: el.textContent?.trim(),
        class: el.className
      })),
      hasReact: !!window.React || !!document.querySelector('[data-reactroot]') || !!document.querySelector('#__next'),
      hasNextJS: !!window.__NEXT_DATA__,
      bodyText: document.body.innerText?.substring(0, 500)
    };
  });

  console.log('=== PAGE STRUCTURE ===');
  console.log(JSON.stringify(pageInfo, null, 2));
  console.log('');

  // If there's a form, try to test it
  if (pageInfo.hasForm) {
    console.log('=== TESTING FORM INTERACTION ===');

    try {
      // Find and fill business name
      const businessInput = await page.locator('input[name="businessName"], input[placeholder*="business" i]').first();
      if (await businessInput.count() > 0) {
        await businessInput.fill('Test Scrape Business');
        console.log('✅ Filled business name');
      }

      // Find and fill email
      const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
      if (await emailInput.count() > 0) {
        await emailInput.fill('scrape-test@example.com');
        console.log('✅ Filled email');
      }

      await page.waitForTimeout(1000);

      // Try to find save button
      const saveButton = await page.locator('button:has-text("Save"), button:has-text("Continue"), button:has-text("Next"), button[type="submit"]').first();

      if (await saveButton.count() > 0) {
        console.log('📤 Clicking save button...');
        await saveButton.click();

        // Wait for network activity
        await page.waitForTimeout(3000);

        // Check for messages after submission
        const afterSubmit = await page.evaluate(() => ({
          errors: Array.from(document.querySelectorAll('[class*="error"], [role="alert"]')).map(el => el.textContent?.trim()),
          success: Array.from(document.querySelectorAll('[class*="success"]')).map(el => el.textContent?.trim()),
          currentUrl: window.location.href
        }));

        console.log('');
        console.log('=== AFTER SUBMISSION ===');
        console.log(JSON.stringify(afterSubmit, null, 2));
      } else {
        console.log('⚠️  No save button found');
      }

    } catch (error) {
      console.log('❌ Form test error:', error.message);
    }
  }

  console.log('');
  console.log('=== CONSOLE MESSAGES ===');
  if (consoleMessages.length === 0) {
    console.log('(No console messages)');
  } else {
    consoleMessages.forEach(msg => {
      console.log(`[${msg.type.toUpperCase()}]`, msg.text);
    });
  }

  console.log('');
  console.log('=== FAILED REQUESTS ===');
  if (failedRequests.length === 0) {
    console.log('(No failed requests)');
  } else {
    failedRequests.forEach(req => {
      console.log(`[${req.method}] ${req.url}`);
      console.log(`   Error: ${req.failure}`);
    });
  }

  console.log('');
  console.log('=== API RESPONSES ===');
  if (apiResponses.length === 0) {
    console.log('(No API calls detected)');
  } else {
    apiResponses.forEach(resp => {
      console.log(`[${resp.status}] ${resp.url}`);
      if (resp.body) console.log(`   Body: ${resp.body.substring(0, 200)}`);
    });
  }

  await browser.close();
  console.log('');
  console.log('✅ Analysis complete');
})().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
