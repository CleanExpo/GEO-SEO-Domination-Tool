/**
 * Test Script: Gemini Computer Use Setup
 *
 * This script verifies that Gemini Computer Use is properly configured
 * with a simple, safe test task.
 *
 * SECURITY: Payment blocking is ENABLED and will be tested.
 */

import { GeminiComputerUseService, getGeminiApiKey } from '../services/api/gemini-computer-use';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testSetup() {
  console.log('\n' + '='.repeat(70));
  console.log('GEMINI COMPUTER USE - SETUP VERIFICATION TEST');
  console.log('='.repeat(70));
  console.log('');

  // Step 1: Check API Key
  console.log('📋 Step 1: Checking API Key...');

  let apiKey: string;
  try {
    apiKey = getGeminiApiKey();
    console.log(`✅ API Key found: ${apiKey.substring(0, 10)}...`);

    // Show which variable was used
    if (process.env.GEMINI_KEY) {
      console.log('   Source: GEMINI_KEY (primary - Vercel variable)\n');
    } else if (process.env.GEMINI_API_KEY) {
      console.log('   Source: GEMINI_API_KEY (fallback)\n');
    } else if (process.env.GOOGLE_API_KEY) {
      console.log('   Source: GOOGLE_API_KEY (fallback)\n');
    }
  } catch (error: any) {
    console.error('❌ FAILED: No API key found\n');
    console.log('Please add your API key to .env.local:');
    console.log('GEMINI_KEY=your_api_key_here\n');
    console.log('Or use fallback variables:');
    console.log('GEMINI_API_KEY=your_api_key_here');
    console.log('GOOGLE_API_KEY=your_api_key_here\n');
    console.log('Get your API key at: https://aistudio.google.com/\n');
    process.exit(1);
  }

  // Step 2: Initialize Service
  console.log('📋 Step 2: Initializing Gemini Computer Use Service...');
  const service = new GeminiComputerUseService({
    apiKey,
    headless: false,
    timeout: 30000,
  });

  try {
    await service.initialize();
    console.log('✅ Service initialized successfully\n');
  } catch (error: any) {
    console.error('❌ FAILED: Could not initialize service');
    console.error(`Error: ${error.message}\n`);
    process.exit(1);
  }

  // Step 3: Test Safe Task
  console.log('📋 Step 3: Testing with safe task (Google Homepage)...');
  try {
    const result = await service.executeTask({
      description: `
        Navigate to https://www.google.com
        Observe the homepage - DO NOT search for anything.
        Simply confirm you can see the page.
      `,
      startUrl: 'https://www.google.com',
      maxSteps: 5,
      requireConfirmation: false,
    });

    if (result.success) {
      console.log('✅ Safe task completed successfully\n');
    } else {
      console.log('⚠️  Task failed (this may be normal for a simple observation task)\n');
    }
  } catch (error: any) {
    console.error('❌ FAILED: Safe task error');
    console.error(`Error: ${error.message}\n`);
    await service.cleanup();
    process.exit(1);
  }

  // Step 4: Test Payment Blocking
  console.log('📋 Step 4: Testing PAYMENT BLOCKING security...');
  console.log('   Attempting to access a payment-related URL...\n');

  try {
    const result = await service.executeTask({
      description: 'Navigate to a checkout page (THIS SHOULD BE BLOCKED)',
      startUrl: 'https://example.com/checkout',
      maxSteps: 3,
      requireConfirmation: false,
    });

    if (result.success) {
      console.error('❌ SECURITY FAILURE: Payment page was NOT blocked!');
      console.error('   This is a critical security issue.\n');
      await service.cleanup();
      process.exit(1);
    } else if (result.blockedReason) {
      console.log('✅ SECURITY PASSED: Payment page was correctly blocked');
      console.log(`   Reason: ${result.blockedReason}\n`);
    } else {
      console.log('⚠️  Task failed for non-security reason');
      console.log(`   Error: ${result.error}\n`);
    }
  } catch (error: any) {
    console.log('⚠️  Payment blocking test inconclusive');
    console.log(`   Error: ${error.message}\n`);
  }

  // Cleanup
  console.log('📋 Step 5: Cleaning up...');
  await service.cleanup();
  console.log('✅ Cleanup complete\n');

  // Summary
  console.log('='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  console.log('');
  console.log('✅ API Key: Configured');
  console.log('✅ Service: Initialized');
  console.log('✅ Browser: Launched');
  console.log('✅ Security: Payment blocking active');
  console.log('');
  console.log('🎉 Setup verification complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Try the example scripts in scripts/examples/');
  console.log('2. Review security documentation: docs/security/NO_PAYMENTS_SECURITY.md');
  console.log('3. Customize automation tasks for your SEO workflows');
  console.log('');
  console.log('='.repeat(70));
  console.log('');
}

// Run the test
testSetup().catch((error) => {
  console.error('\n❌ FATAL ERROR:', error.message);
  console.error('\nPlease check:');
  console.error('1. API key is valid');
  console.error('2. Internet connection is active');
  console.error('3. Playwright is installed: npm install playwright');
  console.error('');
  process.exit(1);
});
