/**
 * Example: AI Search Visibility Tracking
 *
 * This script demonstrates how to use Gemini Computer Use to automatically
 * track your website's visibility in AI search engines (Perplexity, ChatGPT, etc.)
 *
 * SECURITY: Payment blocking is ENABLED - no payment pages will be accessed.
 */

import { GeminiComputerUseService } from '../../services/api/gemini-computer-use';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function trackAISearchVisibility() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: GEMINI_API_KEY or GOOGLE_API_KEY not found in .env.local');
    console.log('\nPlease add your API key to .env.local:');
    console.log('GEMINI_API_KEY=your_api_key_here');
    process.exit(1);
  }

  console.log('🚀 Starting AI Search Visibility Tracking Example\n');
  console.log('='.repeat(60));
  console.log('SECURITY: Payment blocking is ENABLED');
  console.log('='.repeat(60));
  console.log('');

  // Configuration
  const targetDomain = 'example.com'; // Replace with your domain
  const searchQuery = 'best SEO tools for local businesses'; // Replace with your target query

  // Initialize service
  const service = new GeminiComputerUseService({
    apiKey,
    headless: false, // Set to true to hide browser
    timeout: 30000,
  });

  try {
    // Initialize browser
    await service.initialize();

    // Define AI search visibility tracking task
    const result = await service.executeTask({
      description: `
        Query "${searchQuery}" on Perplexity AI and check for citations.

        Steps:
        1. Navigate to https://www.perplexity.ai
        2. Enter the search query: "${searchQuery}"
        3. Wait for the AI response to complete
        4. Check if ${targetDomain} is cited in the response
        5. Extract:
           - Position/rank if cited (e.g., citation #1, #2, #3)
           - Context of the citation
           - Total number of citations

        DO NOT click on any subscription or payment prompts.
        DO NOT sign up for premium features.
        Simply observe the free search results.
      `,
      startUrl: 'https://www.perplexity.ai',
      maxSteps: 15,
      requireConfirmation: false,
    });

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('AI SEARCH VISIBILITY RESULTS');
    console.log('='.repeat(60));
    console.log('');
    console.log(`Platform: Perplexity AI`);
    console.log(`Query: ${searchQuery}`);
    console.log(`Target Domain: ${targetDomain}`);
    console.log('');

    if (result.success) {
      console.log('✅ Visibility check completed successfully!\n');
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
      console.log('- Repeat for ChatGPT, Claude.ai, Google AI');
      console.log('- Implement OCR or screenshot analysis to extract citations');
      console.log('- Track changes over time in database');
      console.log('- Generate AI Search Visibility Score reports');
    } else {
      console.log('❌ Visibility check failed\n');
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
trackAISearchVisibility().catch(console.error);
