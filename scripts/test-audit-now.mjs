/**
 * Test SEO Audit Endpoint with Service Role Key
 */

const DEPLOYMENT_URL = 'https://geo-seo-domination-tool-1u91u0rcd-unite-group.vercel.app';

async function testAudit() {
  console.log('🧪 Testing SEO Audit with Service Role Key\n');
  console.log('URL:', DEPLOYMENT_URL);
  console.log('─'.repeat(60), '\n');

  const testData = {
    company_id: null,
    url: 'https://example.com'
  };

  try {
    console.log('   Sending POST /api/seo-audits...');
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
      const json = JSON.parse(text);
      console.log('\n   ✅ SUCCESS! Audit created!\n');
      console.log('   Audit ID:', json.audit?.id);
      console.log('   Overall Score:', json.audit?.overall_score);
      console.log('   Performance:', json.audit?.performance_score);
      console.log('   SEO:', json.audit?.seo_score);
      console.log('   Accessibility:', json.audit?.accessibility_score);
      console.log('\n   Integrations:');
      console.log('     Lighthouse:', json.integrations?.lighthouse ? '✅' : '❌');
      console.log('     Firecrawl:', json.integrations?.firecrawl ? '✅' : '❌');
      return true;
    } else {
      console.log('\n   ❌ FAILED\n');
      try {
        const json = JSON.parse(text);
        console.log('   Error:', json.error);
        console.log('   Details:', json.details);
      } catch {
        console.log('   Response:', text.substring(0, 500));
      }
      return false;
    }
  } catch (error) {
    console.log('\n   ❌ ERROR:', error.message);
    return false;
  }
}

testAudit()
  .then(success => {
    console.log('\n' + '─'.repeat(60));
    if (success) {
      console.log('✅ AUDIT SYSTEM WORKING!');
      process.exit(0);
    } else {
      console.log('❌ AUDIT SYSTEM STILL BROKEN');
      process.exit(1);
    }
  })
  .catch(console.error);
