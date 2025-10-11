import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from project root (override system env vars)
dotenv.config({ path: resolve(__dirname, '..', '.env.local'), override: true });

const testKey = process.env.GOOGLE_API_KEY ||
                process.env.GOOGLE_SPEED_KEY ||
                process.env.NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY;

console.log('🔍 Testing Google API Key Configuration\n');
console.log('Key being tested:', testKey.substring(0, 20) + '...\n');

// Test 1: PageSpeed Insights API
console.log('Test 1: PageSpeed Insights API');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
try {
  const response = await axios.get('https://www.googleapis.com/pagespeedonline/v5/runPagespeed', {
    params: {
      url: 'https://example.com',
      key: testKey,
      strategy: 'mobile',
    },
    timeout: 15000,
  });
  console.log('✅ SUCCESS - PageSpeed Insights API is working');
  console.log('   Performance Score:', Math.round(response.data.lighthouseResult.categories.performance.score * 100));
} catch (error) {
  console.log('❌ FAILED - PageSpeed Insights API');
  console.log('   Status:', error.response?.status, error.response?.statusText);
  console.log('   Error:', error.response?.data?.error?.message || error.message);
  console.log('   Code:', error.response?.data?.error?.code);
}

console.log('\nTest 2: Google Maps API (for local business data)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
try {
  const response = await axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
    params: {
      input: 'CARSI training',
      inputtype: 'textquery',
      key: testKey,
      fields: 'name,formatted_address',
    },
    timeout: 10000,
  });
  console.log('✅ SUCCESS - Google Maps/Places API is working');
  console.log('   Found:', response.data.candidates?.length || 0, 'places');
} catch (error) {
  console.log('❌ FAILED - Google Maps/Places API');
  console.log('   Status:', error.response?.status, error.response?.statusText);
  console.log('   Error:', error.response?.data?.error_message || error.message);
}

console.log('\n📊 Summary:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('This key is used for:');
console.log('1. PageSpeed Insights API (Lighthouse audits)');
console.log('2. Google Maps/Places API (business lookup)');
console.log('\nBoth APIs require the key to be:');
console.log('- Valid and not expired');
console.log('- Have appropriate APIs enabled in Google Cloud Console');
console.log('- Not restricted by IP/domain');
