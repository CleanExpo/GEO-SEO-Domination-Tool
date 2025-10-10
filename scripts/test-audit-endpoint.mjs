/**
 * Test SEO Audit Endpoint
 */

const DEPLOYMENT_URL = 'https://geo-seo-domination-tool-lz2g095rm-unite-group.vercel.app';

async function testAudit() {
  console.log('🧪 Testing SEO Audit Endpoint\n');
  console.log('URL:', DEPLOYMENT_URL);
  console.log('─'.repeat(60), '\n');

  // Test: Run audit
  console.log('📝 Test: POST /api/seo-audits');

  const testData = {
    company_id: null, // No company ID for now
    url: 'https://example.com'
  };

  try {
    console.log('   Request:', testData);
    const startTime = Date.now();

    const response = await fetch(`${DEPLOYMENT_URL}/api/seo-audits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    });

    const duration = Date.now() - startTime;
    console.log('   Response time:', duration, 'ms');
    console.log('   Status:', response.status);

    const text = await response.text();

    if (response.status === 201) {
      try {
        const json = JSON.parse(text);
        console.log('   ✅ SUCCESS!');
        console.log('   Audit ID:', json.audit?.id);
        console.log('   Score:', json.audit?.overall_score);
        console.log('   Integrations:', json.integrations);
      } catch {
        console.log('   Response (text):', text.substring(0, 200));
      }
    } else {
      console.log('   ❌ FAILED');
      try {
        const json = JSON.parse(text);
        console.log('   Error:', json.error);
        console.log('   Details:', json.details);
      } catch {
        console.log('   Response:', text.substring(0, 500));
      }
    }
  } catch (error) {
    console.log('   ❌ ERROR:', error.message);
  }

  console.log('\n' + '─'.repeat(60));
}

testAudit().catch(console.error);
