/**
 * Check Application for Errors
 *
 * Uses Playwright to check for console errors, network failures,
 * and UI issues on the homepage and key pages
 */

const { chromium } = require('playwright');

async function checkPage(page, url, name) {
  console.log(`\n🔍 Checking ${name}...`);
  console.log(`   URL: ${url}`);

  const errors = [];
  const warnings = [];
  const networkErrors = [];

  // Listen for console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      errors.push({ type: 'console', message: text });
      console.log(`   ❌ Console Error: ${text}`);
    } else if (type === 'warning') {
      warnings.push({ type: 'console', message: text });
      console.log(`   ⚠️  Console Warning: ${text}`);
    }
  });

  // Listen for page errors
  page.on('pageerror', error => {
    errors.push({ type: 'page', message: error.message, stack: error.stack });
    console.log(`   ❌ Page Error: ${error.message}`);
  });

  // Listen for failed requests
  page.on('requestfailed', request => {
    const failure = request.failure();
    networkErrors.push({
      url: request.url(),
      method: request.method(),
      error: failure ? failure.errorText : 'Unknown error'
    });
    console.log(`   ❌ Request Failed: ${request.method()} ${request.url()}`);
  });

  try {
    // Navigate to page
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    if (!response) {
      errors.push({ type: 'navigation', message: 'No response received' });
      console.log(`   ❌ Navigation failed: No response`);
    } else if (!response.ok()) {
      errors.push({
        type: 'navigation',
        message: `HTTP ${response.status()} ${response.statusText()}`
      });
      console.log(`   ❌ Navigation failed: ${response.status()} ${response.statusText()}`);
    } else {
      console.log(`   ✅ Navigation successful (${response.status()})`);
    }

    // Wait a bit for any async errors
    await page.waitForTimeout(2000);

    // Check for common error indicators
    const errorElements = await page.locator('text=/error|failed|cannot|refused/i').count();
    if (errorElements > 0) {
      console.log(`   ⚠️  Found ${errorElements} error-related text elements`);
    }

    // Take screenshot
    const screenshotPath = `./scripts/screenshots/${name.replace(/\s+/g, '-').toLowerCase()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`   📸 Screenshot saved: ${screenshotPath}`);

  } catch (error) {
    errors.push({ type: 'test', message: error.message, stack: error.stack });
    console.log(`   ❌ Test Error: ${error.message}`);
  }

  return { errors, warnings, networkErrors };
}

async function main() {
  console.log('🚀 Starting Application Error Check');
  console.log('═'.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  const results = [];

  // Check homepage
  results.push({
    name: 'Homepage',
    ...(await checkPage(page, 'http://localhost:3000', 'Homepage'))
  });

  // Check auth page
  results.push({
    name: 'Sign In',
    ...(await checkPage(page, 'http://localhost:3000/auth/signin', 'Sign In'))
  });

  // Check dashboard (might redirect to auth)
  results.push({
    name: 'Dashboard',
    ...(await checkPage(page, 'http://localhost:3000/dashboard', 'Dashboard'))
  });

  await browser.close();

  // Summary
  console.log('\n📊 Summary');
  console.log('═'.repeat(60));

  let totalErrors = 0;
  let totalWarnings = 0;
  let totalNetworkErrors = 0;

  results.forEach(result => {
    const errorCount = result.errors.length;
    const warningCount = result.warnings.length;
    const networkErrorCount = result.networkErrors.length;

    totalErrors += errorCount;
    totalWarnings += warningCount;
    totalNetworkErrors += networkErrorCount;

    const status = errorCount === 0 ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${errorCount} errors, ${warningCount} warnings, ${networkErrorCount} network errors`);
  });

  console.log('\n' + '─'.repeat(60));
  console.log(`Total: ${totalErrors} errors, ${totalWarnings} warnings, ${totalNetworkErrors} network errors`);

  if (totalErrors === 0 && totalNetworkErrors === 0) {
    console.log('\n✅ No critical errors found!');
  } else {
    console.log('\n❌ Issues found. Check logs above for details.');
  }

  // Detailed error report
  if (totalErrors > 0) {
    console.log('\n🔍 Detailed Error Report');
    console.log('═'.repeat(60));
    results.forEach(result => {
      if (result.errors.length > 0) {
        console.log(`\n${result.name}:`);
        result.errors.forEach((error, i) => {
          console.log(`  ${i + 1}. [${error.type}] ${error.message}`);
          if (error.stack) {
            console.log(`     ${error.stack.split('\n')[0]}`);
          }
        });
      }
    });
  }

  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('\n❌ Test suite error:', error);
  process.exit(1);
});
