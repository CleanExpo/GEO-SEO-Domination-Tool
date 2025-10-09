#!/usr/bin/env node

/**
 * Test the Load functionality for saved onboarding progress
 */

const VERCEL_URL = 'https://geo-seo-domination-tool.vercel.app';

async function testLoad() {
  const businessName = 'Test Business';
  const email = 'test@example.com';

  console.log('🧪 Testing GET /api/onboarding/save (Load functionality)');
  console.log(`📍 URL: ${VERCEL_URL}/api/onboarding/save`);
  console.log(`📝 Business Name: ${businessName}`);
  console.log(`📧 Email: ${email}\n`);

  try {
    const url = `${VERCEL_URL}/api/onboarding/save?businessName=${encodeURIComponent(businessName)}&email=${encodeURIComponent(email)}`;

    const response = await fetch(url);
    const data = await response.json();

    console.log(`📊 Status Code: ${response.status}`);
    console.log(`📥 Response:`);
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log(`\n✅ Load endpoint is working`);
      if (data.found) {
        console.log(`✅ Found saved data`);
        console.log(`   Current Step: ${data.currentStep}`);
        console.log(`   Last Saved: ${data.lastSaved}`);
      } else {
        console.log(`ℹ️  No saved data found for this business/email`);
      }
    } else {
      console.log(`\n❌ Endpoint returned error`);
      console.log(`Error: ${data.error}`);
      console.log(`Details: ${data.details || 'undefined'}`);
    }

  } catch (error) {
    console.error(`\n❌ Request failed:`, error.message);
  }
}

testLoad();
