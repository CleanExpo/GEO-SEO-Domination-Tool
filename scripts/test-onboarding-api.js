#!/usr/bin/env node

/**
 * Test Production Onboarding API
 * Directly tests the /api/onboarding/save endpoint that's failing
 */

const https = require('https');

const testData = {
  businessName: 'Test Business',
  email: 'test@example.com',
  formData: {
    step1: {
      businessName: 'Test Business',
      industry: 'Technology',
      email: 'test@example.com',
      phone: '1234567890'
    }
  },
  currentStep: 1
};

console.log('🧪 Testing Production Onboarding Save API\n');
console.log('📍 Endpoint: POST /api/onboarding/save');
console.log('🌐 Host: geo-seo-domination-tool.vercel.app\n');

const postData = JSON.stringify(testData);

const options = {
  hostname: 'geo-seo-domination-tool.vercel.app',
  port: 443,
  path: '/api/onboarding/save',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'Production-API-Tester/1.0'
  }
};

const req = https.request(options, (res) => {
  console.log(`📊 Status Code: ${res.statusCode}`);
  console.log(`📋 Headers:`, JSON.stringify(res.headers, null, 2));
  console.log('');

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📥 Response Body:');
    console.log('─'.repeat(60));

    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));

      if (res.statusCode === 200) {
        console.log('\n✅ API endpoint is working!');
      } else if (res.statusCode === 500) {
        console.log('\n❌ 500 Internal Server Error detected!');
        console.log('🔍 This confirms the missing database table issue.');
      } else {
        console.log(`\n⚠️  Unexpected status code: ${res.statusCode}`);
      }
    } catch (e) {
      console.log(data);
      if (res.statusCode === 500) {
        console.log('\n❌ 500 Internal Server Error with non-JSON response');
      }
    }

    console.log('─'.repeat(60));
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error);
  process.exit(1);
});

// Send the request
console.log('📤 Sending test request...\n');
req.write(postData);
req.end();
