/**
 * Example: Local Pack Tracking
 *
 * This script demonstrates how to use Gemini Computer Use to automatically
 * track Google Maps local pack rankings for specific keywords.
 *
 * SECURITY: Payment blocking is ENABLED - no payment pages will be accessed.
 */

import { GeminiComputerUseService } from '../../services/api/gemini-computer-use';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function trackLocalPack() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: GEMINI_API_KEY or GOOGLE_API_KEY not found in .env.local');
    console.log('\nPlease add your API key to .env.local:');
    console.log('GEMINI_API_KEY=your_api_key_here');
    process.exit(1);
  }

  console.log('🚀 Starting Local Pack Tracking Example\n');
  console.log('='.repeat(60));
  console.log('SECURITY: Payment blocking is ENABLED');
  console.log('='.repeat(60));
  console.log('');

  // Configuration
  const keyword = 'plumber brisbane'; // Change to your target keyword
  const location = 'Brisbane, Queensland, Australia'; // Change to your target location

  // Initialize service
  const service = new GeminiComputerUseService({
    apiKey,
    headless: false, // Set to true to hide browser
    timeout: 30000,
  });

  try {
    // Initialize browser
    await service.initialize();

    // Define local pack tracking task
    const result = await service.executeTask({
      description: `
        Search for "${keyword}" on Google Maps and extract the local pack results.

        Steps:
        1. Navigate to https://www.google.com/maps
        2. Enter "${keyword}" in the search box
        3. Wait for results to load
        4. Identify the top 3 businesses in the local pack
        5. For each business, extract:
           - Business name
           - Star rating
           - Number of reviews
           - Address (if visible)

        DO NOT click on any ads.
        DO NOT interact with any payment or booking features.
        Simply observe and extract the ranking information.
      `,
      startUrl: 'https://www.google.com/maps',
      maxSteps: 15,
      requireConfirmation: false,
    });

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('LOCAL PACK TRACKING RESULTS');
    console.log('='.repeat(60));
    console.log('');
    console.log(`Keyword: ${keyword}`);
    console.log(`Location: ${location}`);
    console.log('');

    if (result.success) {
      console.log('✅ Tracking completed successfully!\n');
      console.log(`Total steps executed: ${result.steps.length}\n`);

      // Show each step
      result.steps.forEach((step, index) => {
        console.log(`Step ${step.stepNumber}:`);
        console.log(`  Action: ${step.action}`);
        console.log(`  Time: ${step.timestamp.toLocaleTimeString()}`);
        if (step.blocked) {
          console.log(`  🚨 BLOCKED: ${step.blockReason}`);
        }
        console.log('');
      });

      console.log('\n💡 Next steps:');
      console.log('- Implement data extraction from screenshots');
      console.log('- Store results in database for historical tracking');
      console.log('- Create automated reports for Share of Local Voice (SoLV)');
    } else {
      console.log('❌ Tracking failed\n');
      console.log(`Error: ${result.error}`);
      if (result.blockedReason) {
        console.log(`🚨 Blocked: ${result.blockedReason}`);
      }
    }

    // Cleanup
    await service.cleanup();
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    await service.cleanup();
    process.exit(1);
  }
}

// Run the tracker
trackLocalPack().catch(console.error);
