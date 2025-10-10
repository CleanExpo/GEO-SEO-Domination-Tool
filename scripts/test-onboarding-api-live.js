/**
 * Test Live Onboarding API
 * Calls the actual production/dev API to see real errors
 */

const BASE_URL = process.env.TEST_URL || 'https://geo-seo-domination-tool.vercel.app';

async function testOnboardingAPI() {
  console.log('\n🧪 Testing Onboarding API');
  console.log(`📍 URL: ${BASE_URL}\n`);

  const testData = {
    businessName: 'Test Company',
    email: `test-${Date.now()}@example.com`,
    contactName: 'John Doe',
    phone: '555-0123',
    website: 'https://example.com',
    industry: 'Technology',
    primaryGoals: ['Increase organic traffic', 'Improve rankings'],
    targetKeywords: ['SEO', 'Marketing', 'Growth'],
    targetLocations: ['Brisbane, Australia'],
    contentTypes: ['blog', 'social'],
    contentFrequency: 'weekly',
    selectedServices: ['SEO Audit', 'Content Marketing'],
    monthlyBudget: '1000-5000'
  };

  console.log('📤 Sending request to /api/onboarding/start');
  console.log('📋 Data:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch(`${BASE_URL}/api/onboarding/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);
    console.log('📊 Content-Type:', response.headers.get('content-type'));

    const text = await response.text();
    console.log('\n📄 Raw Response Body:');
    console.log('─'.repeat(60));
    console.log(text);
    console.log('─'.repeat(60));

    // Try to parse as JSON
    try {
      const json = JSON.parse(text);
      console.log('\n✅ Parsed JSON Response:');
      console.log(JSON.stringify(json, null, 2));

      if (json.success) {
        console.log('\n🎉 SUCCESS! Onboarding ID:', json.onboardingId);
      } else {
        console.log('\n❌ FAILED:', json.error);
        if (json.message) console.log('   Message:', json.message);
        if (json.details) console.log('   Details:', json.details);
      }
    } catch (parseError) {
      console.log('\n❌ FAILED TO PARSE JSON');
      console.log('   This is the "Unexpected end of JSON input" error!');
      console.log('   Raw response:', text.substring(0, 500));
    }

  } catch (error) {
    console.log('\n💥 REQUEST FAILED');
    console.error(error);
  }
}

testOnboardingAPI();
