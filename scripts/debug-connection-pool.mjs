/**
 * Debug Connection Pool Exhaustion Issue
 * Tests the onboarding endpoint and monitors connection behavior
 */

const PRODUCTION_URL = 'https://geo-seo-domination-tool-c9zk94zwn-unite-group.vercel.app';

async function debugConnectionPool() {
  console.log('🔍 Debugging Connection Pool Exhaustion\n');
  console.log('Testing URL:', PRODUCTION_URL);
  console.log('─'.repeat(60), '\n');

  // Test 1: Simple health check
  console.log('📝 Test 1: Check API health');
  try {
    const healthResponse = await fetch(`${PRODUCTION_URL}/api/health`);
    console.log('   Status:', healthResponse.status);
    const healthData = await healthResponse.json();
    console.log('   Response:', healthData);
  } catch (error) {
    console.log('   ❌ Health check failed:', error.message);
  }

  console.log('\n' + '─'.repeat(60), '\n');

  // Test 2: Try to start onboarding
  console.log('📝 Test 2: Start onboarding (this is where it fails)');

  const testData = {
    businessName: 'Debug Test Company',
    website: 'https://example.com',
    industry: 'Technology',
    goals: 'Test connection pool'
  };

  try {
    console.log('   Request payload:', JSON.stringify(testData, null, 2));

    const startTime = Date.now();
    const startResponse = await fetch(`${PRODUCTION_URL}/api/onboarding/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const duration = Date.now() - startTime;
    console.log('   Response time:', duration, 'ms');
    console.log('   Status:', startResponse.status);

    const responseText = await startResponse.text();
    console.log('   Response body:', responseText);

    if (!startResponse.ok) {
      console.log('   ❌ FAILED - Status:', startResponse.status);

      // Try to parse as JSON
      try {
        const errorData = JSON.parse(responseText);
        console.log('   Error details:', JSON.stringify(errorData, null, 2));
      } catch {
        console.log('   Raw error:', responseText);
      }
    } else {
      console.log('   ✅ SUCCESS');
      const result = JSON.parse(responseText);
      console.log('   Onboarding ID:', result.onboardingId);
    }

  } catch (error) {
    console.log('   ❌ Request failed:', error.message);
    console.log('   Error details:', error);
  }

  console.log('\n' + '─'.repeat(60), '\n');

  // Test 3: Check if connections are being properly released
  console.log('📝 Test 3: Multiple rapid requests (stress test)');
  console.log('   This will reveal if connections are leaking...\n');

  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      fetch(`${PRODUCTION_URL}/api/onboarding/saved`)
        .then(res => {
          console.log(`   Request ${i + 1}: Status ${res.status}`);
          return res.json();
        })
        .catch(err => {
          console.log(`   Request ${i + 1}: FAILED - ${err.message}`);
        })
    );
  }

  await Promise.all(promises);

  console.log('\n' + '─'.repeat(60), '\n');
  console.log('✅ Debug complete\n');
}

// Run the debug
debugConnectionPool().catch(console.error);
