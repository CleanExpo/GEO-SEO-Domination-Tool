import axios from 'axios';

const key = process.env.GOOGLE_SPEED_KEY || process.env.GOOGLE_API_KEY;

if (!key) {
  console.error('❌ No Google API key found in environment');
  console.log('Looking for: GOOGLE_SPEED_KEY or GOOGLE_API_KEY');
  process.exit(1);
}

console.log('✓ API key found, testing Google PageSpeed API...\n');

try {
  const response = await axios.get('https://www.googleapis.com/pagespeedonline/v5/runPagespeed', {
    params: {
      url: 'https://www.carsi.com.au',
      key: key,
      strategy: 'mobile',
      category: ['performance', 'seo']
    }
  });

  const result = response.data.lighthouseResult;
  console.log('✅ SUCCESS!');
  console.log('Performance Score:', Math.round(result.categories.performance.score * 100));
  console.log('SEO Score:', Math.round(result.categories.seo.score * 100));
} catch (error) {
  console.error('❌ FAILED!');
  console.error('Status:', error.response?.status, error.response?.statusText);
  console.error('Error:', error.response?.data?.error?.message || error.message);

  if (error.response?.status === 403) {
    console.error('\n⚠️  403 Forbidden - Possible causes:');
    console.error('  1. API key is invalid or expired');
    console.error('  2. PageSpeed Insights API is not enabled in Google Cloud Console');
    console.error('  3. API key has IP restrictions that block Vercel');
    console.error('  4. Billing is not enabled for the project');
  }

  process.exit(1);
}
