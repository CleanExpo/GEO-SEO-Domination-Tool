#!/usr/bin/env node

/**
 * End-to-End Onboarding Test using Playwright
 *
 * This script autonomously tests the complete onboarding flow:
 * 1. Navigate to /onboarding/new
 * 2. Fill out all 5 steps
 * 3. Submit onboarding
 * 4. Capture any errors
 * 5. Generate comprehensive report
 */

import { chromium } from 'playwright';

const BASE_URL = 'https://geo-seo-domination-tool.vercel.app';

const testData = {
  // Step 1: Business Info
  businessName: 'E2E Test Company',
  industry: 'Technology',
  contactName: 'Test User',
  email: 'e2e-test@example.com',
  phone: '+1234567890',
  address: '123 Test Street',

  // Step 2: Website
  website: 'https://example.com',
  hasExistingWebsite: true,
  websitePlatform: 'WordPress',

  // Step 3: SEO Goals
  primaryGoals: ['Increase organic traffic', 'Improve search rankings'],
  targetKeywords: ['test keyword 1', 'test keyword 2'],
  targetLocations: ['Brisbane', 'Sydney'],

  // Step 4: Content
  contentTypes: ['Blog posts', 'Case studies'],
  contentFrequency: 'weekly',
  brandVoice: 'Professional and friendly',

  // Step 5: Services
  selectedServices: ['SEO Audit & Optimization', 'Content Creation'],
  budget: '$1,000 - $2,500/month'
};

async function runE2ETest() {
  console.log('🚀 Starting End-to-End Onboarding Test\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const errors = [];
  const screenshots = [];

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('❌ Browser Console Error:', msg.text());
      errors.push({ type: 'console', message: msg.text() });
    }
  });

  // Capture network errors
  page.on('response', response => {
    if (response.status() >= 400) {
      console.error(`❌ HTTP Error: ${response.status()} ${response.url()}`);
      errors.push({
        type: 'http',
        status: response.status(),
        url: response.url()
      });
    }
  });

  try {
    // Navigate to onboarding page
    console.log('📍 Navigating to /onboarding/new...');
    await page.goto(`${BASE_URL}/onboarding/new`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'onboarding-step-0.png' });
    screenshots.push('onboarding-step-0.png');
    console.log('✅ Page loaded\n');

    // Step 1: Business Info
    console.log('📝 Step 1: Business Info');
    await page.fill('[id="businessName"]', testData.businessName);
    await page.fill('[id="industry"]', testData.industry);
    await page.fill('[id="contactName"]', testData.contactName);
    await page.fill('[id="email"]', testData.email);
    await page.fill('[id="phone"]', testData.phone);
    await page.fill('[id="address"]', testData.address);
    await page.screenshot({ path: 'onboarding-step-1.png' });
    screenshots.push('onboarding-step-1.png');
    console.log('✅ Business info filled');

    // Click Next
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    console.log('✅ Moved to Step 2\n');

    // Step 2: Website
    console.log('📝 Step 2: Website Details');
    await page.fill('[id="website"]', testData.website);
    await page.fill('[id="platform"]', testData.websitePlatform);
    await page.screenshot({ path: 'onboarding-step-2.png' });
    screenshots.push('onboarding-step-2.png');
    console.log('✅ Website details filled');

    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    console.log('✅ Moved to Step 3\n');

    // Step 3: SEO Goals
    console.log('📝 Step 3: SEO Goals');

    // Check primary goals (checkboxes) - Click labels for shadcn/ui components
    for (const goal of testData.primaryGoals) {
      try {
        await page.click(`label:has-text("${goal}")`);
        await page.waitForTimeout(300); // Wait for React state update
        console.log(`   ✓ Checked: ${goal}`);
      } catch (e) {
        console.warn(`   ⚠️  Could not find checkbox for: ${goal}`);
      }
    }

    // Add keywords - Type and press Enter for each
    const keywordPlaceholder = 'digital marketing services';
    for (const keyword of testData.targetKeywords) {
      try {
        await page.fill(`[placeholder*="${keywordPlaceholder}"]`, keyword);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300); // Wait for state update
        console.log(`   ✓ Added keyword: ${keyword}`);
      } catch (e) {
        console.warn(`   ⚠️  Could not add keyword: ${keyword}`);
      }
    }

    // Wait for validation to complete after all inputs
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'onboarding-step-3.png' });
    screenshots.push('onboarding-step-3.png');
    console.log('✅ SEO goals filled');

    // Wait for Next button to be enabled before clicking
    await page.waitForSelector('button:has-text("Next"):not([disabled])', { timeout: 5000 });
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    console.log('✅ Moved to Step 4\n');

    // Step 4: Content
    console.log('📝 Step 4: Content Strategy');

    // Check content types - Click labels for shadcn/ui components
    for (const type of testData.contentTypes) {
      try {
        await page.click(`label:has-text("${type}")`);
        console.log(`   ✓ Checked: ${type}`);
      } catch (e) {
        console.warn(`   ⚠️  Could not find checkbox for: ${type}`);
      }
    }

    // Fill brand voice (textarea)
    try {
      const brandVoiceInput = await page.$('textarea');
      if (brandVoiceInput) {
        await brandVoiceInput.fill(testData.brandVoice);
        console.log(`   ✓ Filled brand voice`);
      }
    } catch (e) {
      console.warn(`   ⚠️  Could not fill brand voice`);
    }

    await page.screenshot({ path: 'onboarding-step-4.png' });
    screenshots.push('onboarding-step-4.png');
    console.log('✅ Content strategy filled');

    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    console.log('✅ Moved to Step 5\n');

    // Step 5: Services
    console.log('📝 Step 5: Services & Budget');

    // Click service cards (services are clickable Cards)
    for (const service of testData.selectedServices) {
      try {
        // Try clicking the Card by finding text within it
        await page.locator('div[role="button"]', { hasText: service }).click();
        await page.waitForTimeout(200);
        console.log(`   ✓ Selected service: ${service}`);
      } catch (e1) {
        try {
          // Fallback: try clicking any element with the service text
          await page.click(`text="${service}"`);
          await page.waitForTimeout(200);
          console.log(`   ✓ Selected service: ${service}`);
        } catch (e2) {
          console.warn(`   ⚠️  Could not find service: ${service}`);
        }
      }
    }

    // Select budget - Click label for radio button
    try {
      await page.click(`label:has-text("${testData.budget}")`);
      console.log(`   ✓ Selected budget: ${testData.budget}`);
    } catch (e) {
      console.warn(`   ⚠️  Could not select budget: ${testData.budget}`);
    }

    await page.screenshot({ path: 'onboarding-step-5.png' });
    screenshots.push('onboarding-step-5.png');
    console.log('✅ Services & budget filled\n');

    // Submit
    console.log('🚀 Submitting onboarding...');

    // Wait for navigation or response
    try {
      const [response] = await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/api/onboarding/start'), { timeout: 30000 }),
        page.click('button:has-text("Start Onboarding")')
      ]);

      const responseData = await response.json();
      console.log('\n📊 API Response:');
      console.log(JSON.stringify(responseData, null, 2));

      if (response.status() === 201 || response.ok()) {
        console.log('\n✅ ONBOARDING SUCCESSFUL!');
        console.log(`   Onboarding ID: ${responseData.onboardingId || responseData.success}`);
      } else {
        console.log('\n❌ ONBOARDING FAILED!');
        console.log(`   Status: ${response.status()}`);
        errors.push({
          type: 'onboarding',
          status: response.status(),
          data: responseData
        });
      }
    } catch (submitError) {
      console.error('\n❌ Submit Error:', submitError.message);
      errors.push({
        type: 'submit',
        message: submitError.message
      });
    }

    await page.screenshot({ path: 'onboarding-result.png' });
    screenshots.push('onboarding-result.png');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    errors.push({ type: 'test', message: error.message, stack: error.stack });
    await page.screenshot({ path: 'onboarding-error.png' });
    screenshots.push('onboarding-error.png');
  } finally {
    await browser.close();
  }

  // Generate Report
  console.log('\n' + '='.repeat(60));
  console.log('📋 END-TO-END TEST REPORT');
  console.log('='.repeat(60));

  console.log('\n📸 Screenshots captured:');
  screenshots.forEach(s => console.log(`   - ${s}`));

  if (errors.length === 0) {
    console.log('\n✅ NO ERRORS DETECTED');
    console.log('\n🎉 Onboarding flow is working perfectly!');
  } else {
    console.log(`\n❌ ${errors.length} ERRORS DETECTED:\n`);
    errors.forEach((err, i) => {
      console.log(`   ${i + 1}. [${err.type.toUpperCase()}]`);
      if (err.message) console.log(`      Message: ${err.message}`);
      if (err.status) console.log(`      Status: ${err.status}`);
      if (err.url) console.log(`      URL: ${err.url}`);
      if (err.data) console.log(`      Data: ${JSON.stringify(err.data, null, 2)}`);
      console.log('');
    });

    console.log('⚠️  ISSUES FOUND - Review errors above and fix database/code');
  }

  console.log('='.repeat(60));

  // Exit with error code if errors found
  process.exit(errors.length > 0 ? 1 : 0);
}

runE2ETest();
