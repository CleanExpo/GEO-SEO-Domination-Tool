#!/usr/bin/env node

/**
 * Test Onboarding Process Worker
 */

const BASE_URL = 'https://geo-seo-domination-tool.vercel.app';

async function testProcessWorker(onboardingId) {
  console.log(`\n🧪 Testing Onboarding Process Worker`);
  console.log(`📍 URL: ${BASE_URL}`);
  console.log(`🆔 Onboarding ID: ${onboardingId}`);

  try {
    console.log(`\n📤 Triggering background worker...`);

    const response = await fetch(`${BASE_URL}/api/onboarding/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onboardingId })
    });

    console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📊 Content-Type: ${response.headers.get('content-type')}`);

    const text = await response.text();
    console.log('\n📄 Raw Response Body:');
    console.log('─'.repeat(60));
    console.log(text);
    console.log('─'.repeat(60));

    try {
      const json = JSON.parse(text);
      console.log('\n✅ Parsed JSON Response:');
      console.log(JSON.stringify(json, null, 2));

      if (json.success) {
        console.log('\n🎉 SUCCESS! Worker completed');
        console.log(`   Company ID: ${json.companyId}`);
      } else {
        console.log('\n❌ Worker failed');
        console.log(`   Error: ${json.error}`);
        console.log(`   Message: ${json.message}`);
      }
    } catch (parseError) {
      console.log('\n❌ FAILED TO PARSE JSON');
      console.log('Error:', parseError.message);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
  }
}

const onboardingId = process.argv[2] || 'onboarding_1760118700160_znlonqmju';
testProcessWorker(onboardingId);
