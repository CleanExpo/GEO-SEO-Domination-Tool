#!/usr/bin/env node

/**
 * Test the save API endpoint directly by importing and calling it
 */

const http = require('http');

async function testSaveAPI() {
  console.log('Testing /api/onboarding/save endpoint...\n');

  const data = JSON.stringify({
    businessName: 'Direct Test Company',
    email: 'directtest@example.com',
    formData: {
      businessName: 'Direct Test Company',
      email: 'directtest@example.com',
      industry: 'Technology',
      contactName: 'Test User',
      phone: '',
      address: '',
      website: '',
      hasExistingWebsite: true,
      primaryGoals: [],
      targetKeywords: [],
      targetLocations: [],
      contentTypes: [],
      contentFrequency: 'weekly',
      brandVoice: '',
      competitors: [],
      selectedServices: [],
      budget: ''
    },
    currentStep: 2
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/onboarding/save',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log('Response Status:', res.statusCode);
        console.log('Response Headers:', res.headers);
        console.log('Response Body:', responseData);
        console.log('');

        try {
          const parsed = JSON.parse(responseData);
          console.log('Parsed Response:', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('Could not parse response as JSON');
        }

        resolve({
          statusCode: res.statusCode,
          body: responseData
        });
      });
    });

    req.on('error', (error) => {
      console.error('Request Error:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Run the test
testSaveAPI()
  .then((result) => {
    if (result.statusCode === 200) {
      console.log('\n✓ Save API test PASSED!');
    } else {
      console.log('\n❌ Save API test FAILED with status:', result.statusCode);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Test error:', error);
    process.exit(1);
  });
