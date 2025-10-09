#!/usr/bin/env node

/**
 * Test the Start Onboarding endpoint (without Bytebot)
 */

const VERCEL_URL = 'https://geo-seo-domination-tool.vercel.app';

const testData = {
  businessName: 'Test Onboarding Fix',
  industry: 'Technology',
  contactName: 'Test User',
  email: 'test-onboarding@example.com',
  phone: '+1234567890',
  address: '123 Test St',
  website: 'https://example.com',
  hasExistingWebsite: true,
  websitePlatform: 'WordPress',
  primaryGoals: ['Increase traffic', 'Improve rankings'],
  targetKeywords: ['test keyword 1', 'test keyword 2'],
  targetLocations: ['Test City'],
  monthlyTrafficGoal: 10000,
  contentTypes: ['Blog posts', 'Case studies'],
  contentFrequency: 'weekly',
  brandVoice: 'Professional',
  competitors: ['competitor1.com'],
  selectedServices: ['SEO Audit', 'Content Creation'],
  budget: '$1000-$5000'
};

async function testStartOnboarding() {
  console.log('🧪 Testing POST /api/onboarding/start (without Bytebot)');
  console.log(`📍 URL: ${VERCEL_URL}/api/onboarding/start\n`);

  console.log('📝 Test Data:');
  console.log(`   Business: ${testData.businessName}`);
  console.log(`   Email: ${testData.email}`);
  console.log(`   Contact: ${testData.contactName}\n`);

  try {
    const response = await fetch(`${VERCEL_URL}/api/onboarding/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const data = await response.json();

    console.log(`📊 Status Code: ${response.status}`);
    console.log(`📥 Response:`);
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log(`\n✅ Onboarding started successfully!`);
      console.log(`   Onboarding ID: ${data.onboardingId}`);
      console.log(`   Bytebot Task ID: ${data.bytebotTaskId || 'N/A (Bytebot unavailable)'}`);
      console.log(`   Message: ${data.message}`);
    } else {
      console.log(`\n❌ Endpoint returned error`);
      console.log(`   Error: ${data.error}`);
      console.log(`   Details: ${data.message || 'undefined'}`);
    }

  } catch (error) {
    console.error(`\n❌ Request failed:`, error.message);
  }
}

testStartOnboarding();
