#!/usr/bin/env node

/**
 * Test loading the Disaster Recovery saved data
 */

const VERCEL_URL = 'https://geo-seo-domination-tool.vercel.app';

async function testLoad() {
  const businessName = 'Disaster Recovery ';  // Note the trailing space!
  const email = 'phill@disasterrecovery.com.au';

  console.log('🧪 Testing GET /api/onboarding/save (Load Disaster Recovery data)');
  console.log(`📍 URL: ${VERCEL_URL}/api/onboarding/save`);
  console.log(`📝 Business Name: "${businessName}"`);
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
        console.log(`\n📋 Form Data Structure:`);
        console.log(`   businessName: ${data.formData.businessName}`);
        console.log(`   contactName: ${data.formData.contactName}`);
        console.log(`   email: ${data.formData.email}`);
        console.log(`   phone: ${data.formData.phone}`);
        console.log(`   industry: ${data.formData.industry}`);
        console.log(`   address: ${data.formData.address}`);
      } else {
        console.log(`❌ No saved data found`);
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
