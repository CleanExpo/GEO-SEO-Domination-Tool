/**
 * Example: SEO Competitor Analysis
 *
 * This script demonstrates how to use Gemini Computer Use to automatically
 * analyze a competitor's website for SEO insights.
 *
 * SECURITY: Payment blocking is ENABLED - no payment pages will be accessed.
 */

import { GeminiComputerUseService } from '../../services/api/gemini-computer-use';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function analyzeCompetitor() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: GEMINI_API_KEY or GOOGLE_API_KEY not found in .env.local');
    console.log('\nPlease add your API key to .env.local:');
    console.log('GEMINI_API_KEY=your_api_key_here');
    process.exit(1);
  }

  console.log('🚀 Starting SEO Competitor Analysis Example\n');
  console.log('='.repeat(60));
  console.log('SECURITY: Payment blocking is ENABLED');
  console.log('='.repeat(60));
  console.log('');

  // Initialize service
  const service = new GeminiComputerUseService({
    apiKey,
    headless: false, // Set to true to hide browser
    timeout: 30000,
  });

  try {
    // Initialize browser
    await service.initialize();

    // Define competitor analysis task
    const result = await service.executeTask({
      description: `
        Visit https://example.com (replace with competitor URL) and analyze:
        1. Extract all H1, H2, H3 headings
        2. Identify the main topic/focus of the homepage
        3. Count the number of service offerings mentioned
        4. Check if they have a blog or resources section
        5. Note any call-to-action buttons

        DO NOT click any "Buy", "Purchase", or "Checkout" buttons.
        DO NOT enter any payment information.
        Simply observe and report what you see.
      `,
      startUrl: 'https://example.com', // Replace with actual competitor
      maxSteps: 10,
      requireConfirmation: false,
    });

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('RESULTS');
    console.log('='.repeat(60));
    console.log('');

    if (result.success) {
      console.log('✅ Analysis completed successfully!\n');
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
    } else {
      console.log('❌ Analysis failed\n');
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

// Run the analysis
analyzeCompetitor().catch(console.error);
