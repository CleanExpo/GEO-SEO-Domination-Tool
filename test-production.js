/**
 * Production Deployment Test
 * Tests the main production deployment without Vercel protection
 */

import https from 'https';
import { URL } from 'url';

const PRODUCTION_URL = 'https://geo-seo-domination-tool.vercel.app';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testProduction() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  PRODUCTION DEPLOYMENT TEST');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Testing: ${PRODUCTION_URL}\n`);

  // Test home page
  console.log('Testing Home Page...');
  try {
    const response = await makeRequest(PRODUCTION_URL);
    console.log(`Status: ${response.statusCode}`);

    if (response.statusCode === 401) {
      console.log('❌ Production is ALSO protected by Vercel authentication');
      console.log('   This means deployment protection is enabled for all deployments\n');
      return false;
    } else if (response.statusCode === 200) {
      console.log('✅ Production is accessible!');
      console.log(`   Content-Type: ${response.headers['content-type']}`);

      // Check for Vercel auth page
      const isVercelAuth = response.body.includes('Vercel Authentication') ||
                          response.body.includes('vercel-user-meta');

      if (isVercelAuth) {
        console.log('❌ Still showing Vercel auth page\n');
        return false;
      }

      // Check for actual content
      const hasContent = response.body.includes('GEO') ||
                        response.body.includes('SEO') ||
                        response.body.length > 1000;

      if (hasContent) {
        console.log('✅ Real application content detected!');
        console.log(`   Page size: ${response.body.length} bytes\n`);
        return true;
      } else {
        console.log('⚠️  Page loads but content seems missing\n');
        return false;
      }
    } else {
      console.log(`⚠️  Unexpected status: ${response.statusCode}\n`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    return false;
  }
}

testProduction().then(success => {
  if (success) {
    console.log('✅ PRODUCTION DEPLOYMENT IS ACCESSIBLE');
    console.log('   Recommend running full test suite against production URL\n');
  } else {
    console.log('❌ PRODUCTION DEPLOYMENT IS NOT ACCESSIBLE');
    console.log('   Vercel deployment protection is enabled for all deployments\n');
    console.log('SOLUTION: Disable deployment protection in Vercel dashboard');
    console.log('   1. Go to Vercel Dashboard → Project Settings');
    console.log('   2. Click "Deployment Protection"');
    console.log('   3. Set to "Only Preview Comments" or "Public"\n');
  }
});
