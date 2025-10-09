const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Navigating to https://example.com...');
  await page.goto('https://example.com');

  console.log('Taking screenshot...');
  await page.screenshot({ path: 'example-com-screenshot.png', fullPage: true });

  console.log('Screenshot saved to: example-com-screenshot.png');
  await browser.close();
})();
