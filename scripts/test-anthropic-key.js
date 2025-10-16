import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.ANTHROPIC_API_KEY;

console.log('\n🔍 Testing Anthropic API Key...\n');
console.log('════════════════════════════════════════════════════════\n');

if (!apiKey) {
  console.error('❌ ERROR: ANTHROPIC_API_KEY not found in .env.local\n');
  console.error('Please add your API key to .env.local:');
  console.error('ANTHROPIC_API_KEY=sk-ant-your-key-here\n');
  console.error('Get a key from: https://console.anthropic.com/settings/keys\n');
  process.exit(1);
}

console.log('Key format:', apiKey.substring(0, 12) + '...' + apiKey.substring(apiKey.length - 8));
console.log('Key length:', apiKey.length);
console.log('Expected length: ~100-150 characters');
console.log('');

if (!apiKey.startsWith('sk-ant-')) {
  console.warn('⚠️  WARNING: API key should start with "sk-ant-"\n');
}

const anthropic = new Anthropic({ apiKey });

console.log('Testing with Claude Sonnet 4.5...\n');

(async () => {
  try {
    const startTime = Date.now();

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: 'Say "API key works!" and nothing else.'
      }]
    });

    const duration = Date.now() - startTime;

    console.log('✅ SUCCESS! API key is valid.\n');
    console.log('════════════════════════════════════════════════════════\n');
    console.log('Response:', response.content[0].text);
    console.log('Model:', response.model);
    console.log('Request ID:', response.id);
    console.log('Input tokens:', response.usage.input_tokens);
    console.log('Output tokens:', response.usage.output_tokens);
    console.log('Response time:', duration + 'ms');
    console.log('');
    console.log('✅ API key is working correctly!');
    console.log('You can now use the AI Credential Assistant.\n');

  } catch (error) {
    console.error('❌ FAILED! API key is invalid.\n');
    console.error('════════════════════════════════════════════════════════\n');
    console.error('Error:', error.message);

    if (error.status) {
      console.error('HTTP Status:', error.status);

      if (error.status === 401) {
        console.error('\n🔑 Authentication Error:');
        console.error('Your API key is invalid, expired, or revoked.\n');
        console.error('Solutions:');
        console.error('1. Check if key is correctly copied (no extra spaces)');
        console.error('2. Generate a new key at: https://console.anthropic.com/settings/keys');
        console.error('3. Check account billing: https://console.anthropic.com/settings/billing');
        console.error('4. Ensure account has sufficient credits\n');
      } else if (error.status === 429) {
        console.error('\n⏱️  Rate Limit Error:');
        console.error('You\'ve hit the API rate limit.\n');
        console.error('Solutions:');
        console.error('1. Wait a few minutes and try again');
        console.error('2. Upgrade to a higher tier at: https://console.anthropic.com/settings/billing\n');
      } else if (error.status === 500) {
        console.error('\n🔥 Server Error:');
        console.error('Anthropic\'s servers are experiencing issues.\n');
        console.error('Solution: Try again in a few minutes.\n');
      }
    }

    if (error.error) {
      console.error('Error details:', JSON.stringify(error.error, null, 2));
    }

    console.error('\n❌ Please fix the API key issue before using AI features.\n');
    process.exit(1);
  }
})();
