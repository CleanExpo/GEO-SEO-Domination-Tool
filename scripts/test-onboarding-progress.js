#!/usr/bin/env node

/**
 * Test Onboarding Progress API
 * Tests the GET /api/onboarding/[id] endpoint
 */

const BASE_URL = 'https://geo-seo-domination-tool.vercel.app';

async function testProgressRoute(onboardingId) {
  console.log(`\n🧪 Testing Onboarding Progress API`);
  console.log(`📍 URL: ${BASE_URL}`);
  console.log(`🆔 Onboarding ID: ${onboardingId}`);

  try {
    console.log(`\n📤 Fetching progress for ${onboardingId}...`);

    const response = await fetch(`${BASE_URL}/api/onboarding/${onboardingId}`);

    console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📊 Content-Type: ${response.headers.get('content-type')}`);

    const text = await response.text();

    console.log('\n📄 Raw Response Body:');
    console.log('─'.repeat(60));
    console.log(text.substring(0, 500)); // First 500 chars
    console.log('─'.repeat(60));

    try {
      const json = JSON.parse(text);
      console.log('\n✅ Parsed JSON Response:');
      console.log(JSON.stringify(json, null, 2));

      if (json.success) {
        console.log('\n🎉 SUCCESS! Progress retrieved');
        console.log(`   Status: ${json.progress?.status}`);
        console.log(`   Current Step: ${json.progress?.currentStep}`);
        console.log(`   Company ID: ${json.progress?.companyId || 'Not yet created'}`);
      } else {
        console.log('\n❌ API returned success=false');
        console.log(`   Error: ${json.error}`);
      }
    } catch (parseError) {
      console.log('\n❌ FAILED TO PARSE JSON');
      console.log('This means the API returned HTML instead of JSON (likely a 500 error)');
      console.log('Error:', parseError.message);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Get onboarding ID from command line or use a test one
const onboardingId = process.argv[2] || 'onboarding_1760118301726_6wpl3pws5';
testProgressRoute(onboardingId);
