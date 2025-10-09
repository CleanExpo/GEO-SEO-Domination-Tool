import https from 'https';

console.log('🔍 Analyzing Onboarding Page...\n');

// Fetch the page
const fetchPage = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'geo-seo-domination-tool.vercel.app',
      path: '/onboarding/new',
      method: 'GET'
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ html: data, status: res.statusCode }));
    }).on('error', reject);
  });
};

try {
  console.log('📥 Fetching page...');
  const { html, status } = await fetchPage();
  console.log(`✅ Page fetched (${status}) - ${html.length} bytes\n`);

  console.log('=== ANALYZING HTML STRUCTURE ===\n');

  // Look for forms
  const formMatches = html.match(/<form[^>]*>/gi) || [];
  console.log(`Forms found: ${formMatches.length}`);
  formMatches.forEach(form => console.log(`  ${form.substring(0, 100)}...`));
  console.log('');

  // Look for inputs
  const inputMatches = html.match(/<input[^>]*>/gi) || [];
  console.log(`Input fields found: ${inputMatches.length}`);
  inputMatches.slice(0, 10).forEach(input => {
    const name = input.match(/name="([^"]+)"/)?.[1] || 'no-name';
    const type = input.match(/type="([^"]+)"/)?.[1] || 'text';
    const placeholder = input.match(/placeholder="([^"]+)"/)?.[1] || '';
    console.log(`  [${type}] name="${name}" placeholder="${placeholder}"`);
  });
  console.log('');

  // Look for buttons
  const buttonMatches = html.match(/<button[^>]*>.*?<\/button>/gi) || [];
  console.log(`Buttons found: ${buttonMatches.length}`);
  buttonMatches.slice(0, 10).forEach(btn => {
    const text = btn.replace(/<[^>]+>/g, '').trim();
    const type = btn.match(/type="([^"]+)"/)?.[1] || 'button';
    console.log(`  [${type}] "${text.substring(0, 50)}"`);
  });
  console.log('');

  // Look for API endpoints
  const apiEndpoints = [...new Set(html.match(/['"]\/api\/[^'"]+['"]/g) || [])];
  console.log(`API endpoints referenced: ${apiEndpoints.length}`);
  apiEndpoints.forEach(endpoint => console.log(`  ${endpoint.replace(/['"]/g, '')}`));
  console.log('');

  // Look for errors or warnings in embedded scripts
  console.log('=== CHECKING FOR JAVASCRIPT ERRORS ===');
  const errorPatterns = [
    /console\.(error|warn)\([^)]+\)/gi,
    /throw new Error\([^)]+\)/gi,
    /error:|warning:/gi
  ];

  let foundErrors = false;
  errorPatterns.forEach(pattern => {
    const matches = html.match(pattern) || [];
    if (matches.length > 0) {
      foundErrors = true;
      console.log(`Found ${matches.length} potential error patterns:`);
      matches.slice(0, 5).forEach(match => console.log(`  ${match.substring(0, 100)}`));
    }
  });

  if (!foundErrors) {
    console.log('No obvious JavaScript errors found in HTML\n');
  }

  // Check if it's a Next.js page
  console.log('=== FRAMEWORK DETECTION ===');
  console.log(`Next.js: ${html.includes('__NEXT_DATA__') ? '✅ Yes' : '❌ No'}`);
  console.log(`React: ${html.includes('react') || html.includes('React') ? '✅ Yes' : '❌ No'}`);
  console.log('');

  // Now test the actual API endpoint
  console.log('=== TESTING API ENDPOINT ===');
  console.log('POST /api/onboarding/save');

  const testData = JSON.stringify({
    businessName: 'Browser Scrape Test',
    email: 'scrape@example.com',
    formData: { step1: { businessName: 'Browser Scrape Test' } },
    currentStep: 1
  });

  const apiOptions = {
    hostname: 'geo-seo-domination-tool.vercel.app',
    path: '/api/onboarding/save',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testData)
    }
  };

  const apiRequest = new Promise((resolve, reject) => {
    const req = https.request(apiOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ data, status: res.statusCode }));
    });
    req.on('error', reject);
    req.write(testData);
    req.end();
  });

  const { data: apiData, status: apiStatus } = await apiRequest;
  console.log(`Status: ${apiStatus}`);
  console.log(`Response: ${apiData}`);
  console.log('');

  // Summary
  console.log('=== SUMMARY ===');
  const apiResponse = JSON.parse(apiData);
  if (apiResponse.success) {
    console.log('✅ API is working correctly!');
    console.log('   The backend can save onboarding progress.');
  } else {
    console.log('❌ API returned an error:');
    console.log(`   ${apiResponse.error || 'Unknown error'}`);
    if (apiResponse.details) {
      console.log(`   Details: ${apiResponse.details}`);
    }
  }

  console.log('');
  console.log('Frontend issues to check:');
  console.log('  - Are form fields properly bound to state?');
  console.log('  - Is the submit handler calling the API correctly?');
  console.log('  - Are there any client-side validation errors?');
  console.log('  - Check browser console for React/Next.js errors');

} catch (error) {
  console.error('Error analyzing page:', error.message);
  process.exit(1);
}
