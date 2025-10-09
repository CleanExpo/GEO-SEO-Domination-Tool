/**
 * My Custom SEO Automation
 *
 * Replace the task below with your own automation needs!
 */

import { GeminiComputerUseService, getGeminiApiKey } from '../services/api/gemini-computer-use';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function myAutomation() {
  console.log('🚀 Starting My Custom SEO Automation\n');

  const service = new GeminiComputerUseService({
    apiKey: getGeminiApiKey(),
    headless: false, // Set to true to hide browser
    timeout: 30000,
  });

  try {
    await service.initialize();

    // ========================================
    // CUSTOMIZE THIS SECTION FOR YOUR NEEDS
    // ========================================

    const result = await service.executeTask({
      description: `
        YOUR TASK HERE - Examples:

        - "Visit competitor.com and check if they have a blog"
        - "Search 'plumber Brisbane' on Google and tell me the top 3 results"
        - "Go to example.com and extract all their service page titles"
        - "Check if mysite.com loads correctly on mobile view"

        Replace this with your actual task!
      `,
      startUrl: 'https://example.com', // ← Change this URL
      maxSteps: 15, // ← Adjust if needed
      requireConfirmation: false,
    });

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('RESULTS');
    console.log('='.repeat(60));

    if (result.success) {
      console.log('✅ Task completed!\n');
      console.log(`Steps executed: ${result.steps.length}\n`);

      result.steps.forEach((step) => {
        console.log(`Step ${step.stepNumber}: ${step.action}`);
        if (step.blocked) {
          console.log(`  🚨 BLOCKED: ${step.blockReason}`);
        }
      });
    } else {
      console.log('❌ Task failed\n');
      console.log(`Error: ${result.error}`);
      if (result.blockedReason) {
        console.log(`🚨 Blocked: ${result.blockedReason}`);
      }
    }

    await service.cleanup();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await service.cleanup();
    process.exit(1);
  }
}

// Run it!
myAutomation().catch(console.error);
