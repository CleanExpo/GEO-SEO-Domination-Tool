#!/usr/bin/env node

/**
 * Test Qwen API Integration
 *
 * Verifies that Qwen (Alibaba Cloud Model Studio) is configured correctly
 * and can successfully make API calls.
 */

import { createQwenClient, getQwenModelName, getQwenConfig, isQwenAvailable } from '../lib/qwen-config.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testQwen() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 Qwen API Integration Test');
  console.log('='.repeat(80) + '\n');

  // Step 1: Check configuration
  console.log('📋 Step 1: Check Configuration\n');

  const config = getQwenConfig();
  console.log('Configuration:');
  console.log(`  Provider: ${config.provider}`);
  console.log(`  Model: ${config.model}`);
  console.log(`  Region: ${config.region}`);
  console.log(`  Base URL: ${config.baseURL}`);
  console.log(`  Available: ${config.available ? '✅' : '❌'}`);
  console.log(`  Has Key: ${config.hasKey ? '✅' : '❌'}\n`);

  if (!isQwenAvailable()) {
    console.error('❌ QWEN_API_KEY or DASHSCOPE_API_KEY not found in environment variables');
    console.error('\nTo fix this:');
    console.error('1. Get API key from: https://modelstudio.console.alibabacloud.com/?tab=model#/api-key');
    console.error('2. Add to .env.local: QWEN_API_KEY=sk-xxx...');
    console.error('3. For Vercel: Add to environment variables in dashboard\n');
    process.exit(1);
  }

  // Step 2: Test connection
  console.log('🔌 Step 2: Test Connection\n');

  try {
    const qwen = createQwenClient();
    const model = getQwenModelName();

    console.log(`Testing model: ${model}...`);

    const startTime = Date.now();

    const response = await qwen.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello from Qwen!" and nothing else.' }
      ],
      temperature: 0.3,
      max_tokens: 50,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    const content = response.choices[0]?.message?.content || '';
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;

    console.log(`\n✅ Connection successful! (${duration}ms)\n`);

    // Step 3: Verify response
    console.log('📝 Step 3: Verify Response\n');
    console.log(`Response: "${content}"`);
    console.log(`\nToken Usage:`);
    console.log(`  Input:  ${inputTokens} tokens`);
    console.log(`  Output: ${outputTokens} tokens`);
    console.log(`  Total:  ${inputTokens + outputTokens} tokens`);

    // Step 4: Calculate cost
    console.log('\n💰 Step 4: Cost Analysis\n');

    const inputCost = (inputTokens / 1_000_000) * 0.40;
    const outputCost = (outputTokens / 1_000_000) * 1.20;
    const totalCost = inputCost + outputCost;

    console.log(`Cost Breakdown:`);
    console.log(`  Input:  $${inputCost.toFixed(6)} (${inputTokens} tokens @ $0.40/1M)`);
    console.log(`  Output: $${outputCost.toFixed(6)} (${outputTokens} tokens @ $1.20/1M)`);
    console.log(`  Total:  $${totalCost.toFixed(6)}`);

    // Compare with Claude costs
    const claudeOpusCost =
      (inputTokens / 1_000_000) * 15.0 +
      (outputTokens / 1_000_000) * 75.0;
    const claudeSonnetCost =
      (inputTokens / 1_000_000) * 3.0 +
      (outputTokens / 1_000_000) * 15.0;

    console.log(`\nCost Comparison:`);
    console.log(`  Qwen:          $${totalCost.toFixed(6)}`);
    console.log(`  Claude Opus:   $${claudeOpusCost.toFixed(6)} (${(claudeOpusCost / totalCost).toFixed(1)}x more expensive)`);
    console.log(`  Claude Sonnet: $${claudeSonnetCost.toFixed(6)} (${(claudeSonnetCost / totalCost).toFixed(1)}x more expensive)`);

    const savingsVsOpus = ((claudeOpusCost - totalCost) / claudeOpusCost) * 100;
    const savingsVsSonnet = ((claudeSonnetCost - totalCost) / claudeSonnetCost) * 100;

    console.log(`\n💵 Savings:`);
    console.log(`  vs Claude Opus:   ${savingsVsOpus.toFixed(1)}%`);
    console.log(`  vs Claude Sonnet: ${savingsVsSonnet.toFixed(1)}%`);

    // Step 5: JSON mode test
    console.log('\n🧪 Step 5: JSON Mode Test\n');

    const jsonResponse = await qwen.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a data extraction specialist.' },
        { role: 'user', content: 'Return JSON with three SEO factors: {"factors": ["factor1", "factor2", "factor3"]}' }
      ],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const jsonContent = jsonResponse.choices[0]?.message?.content || '{}';
    const parsedJson = JSON.parse(jsonContent);

    console.log('JSON Response:', JSON.stringify(parsedJson, null, 2));
    console.log(`\n✅ JSON mode working correctly!`);

    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('✅ All Tests Passed!');
    console.log('='.repeat(80) + '\n');

    console.log('Qwen is ready for production use! 🚀\n');

  } catch (error) {
    console.error('\n❌ Test Failed!\n');
    console.error('Error:', error.message);

    if (error.response) {
      console.error('\nAPI Response:');
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }

    console.error('\nTroubleshooting:');
    console.error('1. Verify API key is correct');
    console.error('2. Check API key has not expired');
    console.error('3. Ensure API key has access to qwen-plus model');
    console.error('4. Verify network connectivity to Alibaba Cloud\n');

    process.exit(1);
  }
}

testQwen();
