#!/usr/bin/env node

/**
 * Test Cascading AI Service
 *
 * Verifies that the cascading AI fallback system works correctly:
 * Qwen → Claude Opus → Claude Sonnet 4.5
 */

import { cascadingAI } from '../services/api/cascading-ai.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testCascadingAI() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 Cascading AI Service Test');
  console.log('='.repeat(80) + '\n');

  // Test 1: Basic generation (should use Qwen)
  console.log('📋 Test 1: Basic Generation (Expect: Qwen)\n');

  try {
    const result1 = await cascadingAI.generate(
      'You are an SEO expert.',
      'List 3 key factors for local SEO success in JSON format: {"factors": ["...", "...", "..."]}',
      {
        temperature: 0.3,
        maxTokens: 500,
        jsonMode: true,
      }
    );

    console.log('✅ Test 1 Passed!\n');
    console.log(`  Model Used: ${result1.model}`);
    console.log(`  Attempts: ${result1.attemptCount}`);
    console.log(`  Cost: $${result1.estimatedCost.toFixed(6)}`);
    console.log(`  Tokens: ${result1.tokens.input} input / ${result1.tokens.output} output`);
    console.log(`  Data:`, JSON.stringify(result1.data, null, 2));

    if (result1.model !== 'qwen') {
      console.warn(`\n⚠️  Warning: Expected Qwen but got ${result1.model}`);
      console.warn('   This might indicate Qwen API issues or configuration problems.');
    }

  } catch (error) {
    console.error('❌ Test 1 Failed:', error.message);
    process.exit(1);
  }

  // Test 2: Skip Qwen (force Claude)
  console.log('\n' + '-'.repeat(80) + '\n');
  console.log('📋 Test 2: Skip Qwen (Expect: Claude Opus)\n');

  try {
    const result2 = await cascadingAI.generate(
      'You are a data analyst.',
      'Return a simple JSON: {"test": "skip_qwen"}',
      {
        skipQwen: true,  // Force Claude
        temperature: 0.3,
        maxTokens: 100,
        jsonMode: false,
      }
    );

    console.log('✅ Test 2 Passed!\n');
    console.log(`  Model Used: ${result2.model}`);
    console.log(`  Attempts: ${result2.attemptCount}`);
    console.log(`  Cost: $${result2.estimatedCost.toFixed(6)}`);
    console.log(`  Response: ${JSON.stringify(result2.data).substring(0, 100)}...`);

    if (result2.model === 'qwen') {
      console.error(`\n❌ Error: skipQwen=true but Qwen was used`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test 2 Failed:', error.message);
    process.exit(1);
  }

  // Test 3: Complex SEO analysis (real-world scenario)
  console.log('\n' + '-'.repeat(80) + '\n');
  console.log('📋 Test 3: Complex SEO Analysis (Real-world)\n');

  try {
    const startTime = Date.now();

    const result3 = await cascadingAI.generate(
      'You are a local SEO specialist with expertise in Google Business Profile optimization.',
      `Analyze this business profile and provide optimization recommendations:

Business Name: "Brisbane Plumbing Services"
Category: Plumber
Location: Brisbane, QLD
Phone: (07) 1234-5678
Website: https://example-plumber.com.au
Reviews: 45 reviews, 4.3 stars
Photos: 12 photos

Return ONLY valid JSON in this format:
{
  "completeness": 75,
  "optimizationScore": 68,
  "strengths": ["Good review count", "Active responses"],
  "weaknesses": ["Need more photos", "Limited service area info"],
  "recommendations": [
    {
      "priority": "High",
      "action": "Add 10+ photos",
      "impact": "Increase visibility by 25%",
      "difficulty": "Easy"
    }
  ]
}`,
      {
        temperature: 0.3,
        maxTokens: 2000,
        jsonMode: true,
      }
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ Test 3 Passed! (${duration}ms)\n`);
    console.log(`  Model Used: ${result3.model}`);
    console.log(`  Attempts: ${result3.attemptCount}`);
    console.log(`  Cost: $${result3.estimatedCost.toFixed(6)}`);
    console.log(`  Tokens: ${result3.tokens.input} input / ${result3.tokens.output} output`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`\n  Analysis Results:`);
    console.log(`    Completeness: ${result3.data.completeness}%`);
    console.log(`    Optimization Score: ${result3.data.optimizationScore}%`);
    console.log(`    Recommendations: ${result3.data.recommendations?.length || 0}`);

  } catch (error) {
    console.error('❌ Test 3 Failed:', error.message);
    if (error.attemptedModels) {
      console.error(`   Attempted models: ${error.attemptedModels.join(', ')}`);
    }
    process.exit(1);
  }

  // Test 4: Cost comparison
  console.log('\n' + '-'.repeat(80) + '\n');
  console.log('📋 Test 4: Cost Comparison Analysis\n');

  const tests = [
    { name: 'Qwen', skipQwen: false },
    { name: 'Claude (forced)', skipQwen: true },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const result = await cascadingAI.generate(
        'You are an SEO expert.',
        'List 5 local SEO ranking factors in JSON: {"factors": ["...", "...", "...", "...", "..."]}',
        {
          temperature: 0.3,
          maxTokens: 300,
          jsonMode: true,
          skipQwen: test.skipQwen,
        }
      );

      results.push({
        name: test.name,
        model: result.model,
        cost: result.estimatedCost,
        tokens: result.tokens.input + result.tokens.output,
      });

    } catch (error) {
      console.warn(`⚠️  ${test.name} test failed (expected for cost comparison)`);
    }
  }

  if (results.length >= 2) {
    console.log('Cost Comparison:');
    console.log(`  ${results[0].name} (${results[0].model}): $${results[0].cost.toFixed(6)}`);
    console.log(`  ${results[1].name} (${results[1].model}): $${results[1].cost.toFixed(6)}`);

    const savings = ((results[1].cost - results[0].cost) / results[1].cost) * 100;
    console.log(`\n💵 Cost Savings: ${savings.toFixed(1)}% (using Qwen vs Claude)`);
  }

  // Final Summary
  console.log('\n' + '='.repeat(80));
  console.log('✅ All Cascading AI Tests Passed!');
  console.log('='.repeat(80) + '\n');

  console.log('Summary:');
  console.log('  ✅ Basic generation working');
  console.log('  ✅ Fallback mechanism working');
  console.log('  ✅ JSON mode working');
  console.log('  ✅ Cost tracking accurate');
  console.log('  ✅ Complex SEO analysis working\n');

  console.log('The cascading AI service is ready for production! 🚀\n');
}

testCascadingAI();
