/**
 * Test the SEO audit endpoint with the new Google API key
 * This simulates what happens when a user triggers an audit in the app
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

console.log('🧪 Testing SEO Audit Endpoint\n');

async function testAudit() {
  try {
    console.log('1️⃣ Testing audit creation...');
    console.log('URL: POST /api/seo-audits');
    console.log('Body: { url: "https://example.com" }\n');

    const response = await axios.post(`${BASE_URL}/api/seo-audits`, {
      url: 'https://example.com',
      company_id: null,
    }, {
      timeout: 60000,
    });

    console.log('✅ SUCCESS - Audit completed!');
    console.log('\n📊 Results:');
    console.log('─────────────────────────────────────');
    console.log(`Overall Score: ${response.data.audit.overall_score}`);
    console.log(`SEO Score: ${response.data.audit.seo_score}`);
    console.log(`Performance Score: ${response.data.audit.performance_score}`);
    console.log(`Accessibility Score: ${response.data.audit.accessibility_score}`);
    console.log(`\nTitle: ${response.data.audit.metadata?.title || 'N/A'}`);
    console.log(`Meta Description: ${response.data.audit.metadata?.meta_description || 'N/A'}`);

    console.log('\n🔌 API Integration Status:');
    console.log(`Lighthouse: ${response.data.integrations?.lighthouse ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`Firecrawl: ${response.data.integrations?.firecrawl ? '✅ Enabled' : '❌ Disabled'}`);

    if (response.data.audit.metadata?.api_status) {
      console.log('\n📡 API Call Results:');
      const status = response.data.audit.metadata.api_status;
      console.log(`Lighthouse: ${status.lighthouse || 'unknown'}`);
      console.log(`Firecrawl: ${status.firecrawl || 'unknown'}`);
    }

    console.log('\n─────────────────────────────────────');
    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.log('❌ FAILED - Audit test failed');
    console.log(`Status: ${error.response?.status} ${error.response?.statusText}`);
    console.log(`Error: ${error.response?.data?.error || error.message}`);

    if (error.response?.data?.details) {
      console.log(`Details: ${error.response.data.details}`);
    }

    console.log('\n🔍 Troubleshooting:');
    console.log('1. Is dev server running? (npm run dev)');
    console.log('2. Check server logs for detailed error messages');
    console.log('3. Verify Google API key is correct');
  }
}

testAudit();
