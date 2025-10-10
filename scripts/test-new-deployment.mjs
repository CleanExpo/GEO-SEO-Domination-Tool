/**
 * Test New Vercel Deployment
 */

const NEW_DEPLOYMENT_URL = 'https://geo-seo-domination-tool-lz2g095rm-unite-group.vercel.app';

async function testDeployment() {
  console.log('🧪 Testing New Deployment\n');
  console.log('URL:', NEW_DEPLOYMENT_URL);
  console.log('─'.repeat(60), '\n');

  // Test onboarding start
  console.log('📝 Test: POST /api/onboarding/start');

  const testData = {
    businessName: 'Test Company',
    contactName: 'John Doe',
    email: 'test@example.com',
    phone: '555-1234',
    website: 'https://example.com',
    industry: 'Technology',
    primaryGoals: ['Increase organic traffic', 'Improve local rankings'],
    targetKeywords: ['seo services', 'local seo'],
    contentTypes: ['blog', 'landing-pages'],
    selectedServices: ['seo-audit', 'content-strategy']
  };

  try {
    const response = await fetch(`${NEW_DEPLOYMENT_URL}/api/onboarding/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    });

    console.log('   Status:', response.status);
    const text = await response.text();

    if (response.status === 200 || response.status === 201) {
      try {
        const json = JSON.parse(text);
        console.log('   ✅ SUCCESS!');
        console.log('   Response:', JSON.stringify(json, null, 2));
      } catch {
        console.log('   Response (text):', text.substring(0, 200));
      }
    } else {
      console.log('   ❌ FAILED');
      console.log('   Response:', text.substring(0, 500));
    }
  } catch (error) {
    console.log('   ❌ ERROR:', error.message);
  }

  console.log('\n' + '─'.repeat(60));
}

testDeployment().catch(console.error);
