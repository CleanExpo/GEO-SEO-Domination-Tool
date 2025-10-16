import { cascadingAI } from '../services/api/cascading-ai.ts';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('\n🧪 Testing Cascading AI Service...\n');
console.log('════════════════════════════════════════════════════════\n');

console.log('Environment Variables:');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY?.substring(0, 12) + '...');
console.log('QWEN_API_KEY:', process.env.QWEN_API_KEY?.substring(0, 12) + '...');
console.log('');

(async () => {
  try {
    console.log('Attempting to generate with cascading fallback...\n');

    const result = await cascadingAI.generate(
      'You are a helpful assistant.',
      'Say "Cascading AI works!" and nothing else.',
      {
        skipQwen: false, // Try Qwen first
        maxTokens: 100,
        timeout: 30000
      }
    );

    console.log('✅ SUCCESS!\n');
    console.log('════════════════════════════════════════════════════════\n');
    console.log('Response:', result.data);
    console.log('Model used:', result.model);
    console.log('Estimated cost: $' + result.estimatedCost.toFixed(4));
    console.log('Attempts:', result.attemptCount);
    console.log('Input tokens:', result.tokens.input);
    console.log('Output tokens:', result.tokens.output);
    console.log('');
    console.log('✅ Cascading AI is working correctly!\n');

  } catch (error) {
    console.error('❌ FAILED!\n');
    console.error('════════════════════════════════════════════════════════\n');
    console.error('Error message:', error.message);
    console.error('Attempted models:', error.attemptedModels);
    console.error('');

    if (error.lastError) {
      console.error('Last error:', error.lastError.message);

      if (error.lastError.status) {
        console.error('HTTP Status:', error.lastError.status);
      }

      if (error.lastError.error) {
        console.error('Error details:', JSON.stringify(error.lastError.error, null, 2));
      }
    }

    console.error('\n❌ All AI models failed. Please check:');
    console.error('1. ANTHROPIC_API_KEY is valid');
    console.error('2. QWEN_API_KEY is configured (optional)');
    console.error('3. Account has sufficient credits\n');
    process.exit(1);
  }
})();
