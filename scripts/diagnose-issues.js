/**
 * Comprehensive Diagnostic Script
 * Tests all reported issues:
 * 1. Company save data not persisting
 * 2. Add new company not working
 * 3. QWEN3 AI Companion integration
 */

console.log('🔍 Starting Comprehensive Diagnostic...\n');

// Test 1: Onboarding Save/Load
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 1: Onboarding Save/Load');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testOnboardingSave() {
  try {
    const saveData = {
      businessName: 'Diagnostic Test Company',
      email: 'diagnostic@test.com',
      formData: {
        businessName: 'Diagnostic Test Company',
        email: 'diagnostic@test.com',
        phone: '555-9999',
        industry: 'Testing',
        website: 'https://diagnostic-test.com'
      },
      currentStep: 2
    };

    console.log('📝 Saving onboarding data...');
    const saveResponse = await fetch('http://localhost:3000/api/onboarding/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saveData)
    });

    if (!saveResponse.ok) {
      const error = await saveResponse.json();
      console.log('❌ Save FAILED:', saveResponse.status, error);
      return false;
    }

    const saveResult = await saveResponse.json();
    console.log('✅ Save SUCCESS:', saveResult);

    // Now test loading
    console.log('\n📖 Loading saved data...');
    const loadResponse = await fetch(
      `http://localhost:3000/api/onboarding/save?businessName=${encodeURIComponent('Diagnostic Test Company')}&email=${encodeURIComponent('diagnostic@test.com')}`
    );

    if (!loadResponse.ok) {
      console.log('❌ Load FAILED:', loadResponse.status);
      return false;
    }

    const loadResult = await loadResponse.json();
    console.log('✅ Load SUCCESS:', loadResult);

    if (!loadResult.found) {
      console.log('❌ Data NOT FOUND in database');
      return false;
    }

    if (loadResult.currentStep !== 2) {
      console.log('❌ Current step mismatch:', loadResult.currentStep, 'expected', 2);
      return false;
    }

    console.log('✅ ALL CHECKS PASSED - Save/Load working correctly!\n');
    return true;
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    return false;
  }
}

// Test 2: Add New Company
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 2: Add New Company (Requires Auth)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testAddCompany() {
  try {
    const companyData = {
      name: 'Test Company ABC',
      website: 'https://test-abc.com',
      industry: 'Technology',
      location: 'San Francisco, CA'
    };

    console.log('📝 Creating new company (without auth)...');
    const response = await fetch('http://localhost:3000/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyData)
    });

    const status = response.status;
    const result = await response.json();

    if (status === 401) {
      console.log('⚠️  Expected: Requires authentication');
      console.log('   Response:', result);
      console.log('   NOTE: This endpoint requires user login');
      console.log('   To test: Login to app, then try creating company from UI\n');
      return 'auth_required';
    }

    if (status === 500) {
      console.log('❌ Server Error:', result.error);
      console.log('   This might be a database or auth config issue\n');
      return false;
    }

    if (response.ok) {
      console.log('✅ Company created successfully:', result);
      return true;
    }

    console.log('❌ Unexpected response:', status, result);
    return false;
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    return false;
  }
}

// Test 3: AI Credential Assistant
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 3: QWEN3 AI Credential Assistant');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testAIAssistant() {
  try {
    console.log('🤖 Testing AI Credential Assistant...');
    const testQuery = {
      userQuery: 'How do I find my WordPress admin password?',
      platform: 'WordPress',
      hostingProvider: 'Generic'
    };

    console.log('   Query:', testQuery.userQuery);
    console.log('   Waiting for AI response (may take 10-20 seconds)...\n');

    const startTime = Date.now();
    const response = await fetch('http://localhost:3000/api/onboarding/credential-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testQuery)
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok) {
      const error = await response.json();
      console.log('❌ AI Assistant FAILED:', response.status);
      console.log('   Error:', error);
      return false;
    }

    const result = await response.json();
    console.log(`✅ AI Assistant SUCCESS (${elapsed}s)`);
    console.log('   Model:', result.model);
    console.log('   Cost:', `$${result.cost.toFixed(4)}`);

    if (result.message) {
      console.log('   Message preview:', result.message.substring(0, 100) + '...');
    }

    if (result.steps && result.steps.length > 0) {
      console.log('   Steps provided:', result.steps.length);
    }

    if (result.videoTutorial) {
      console.log('   Video tutorial:', result.videoTutorial.title);
    }

    console.log('\n');
    return true;
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    return false;
  }
}

// Run all tests
(async () => {
  const results = {
    onboardingSaveLoad: await testOnboardingSave(),
    addCompany: await testAddCompany(),
    aiAssistant: await testAIAssistant()
  };

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('1. Onboarding Save/Load:', results.onboardingSaveLoad ? '✅ WORKING' : '❌ BROKEN');
  console.log('2. Add New Company:',
    results.addCompany === true ? '✅ WORKING' :
    results.addCompany === 'auth_required' ? '⚠️  REQUIRES AUTH (normal)' :
    '❌ BROKEN'
  );
  console.log('3. AI Credential Assistant:', results.aiAssistant ? '✅ WORKING' : '❌ BROKEN');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('RECOMMENDATIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!results.onboardingSaveLoad) {
    console.log('❌ ISSUE: Onboarding save/load not working');
    console.log('   - Check Supabase connection');
    console.log('   - Verify saved_onboarding table exists');
    console.log('   - Check database permissions\n');
  }

  if (results.addCompany === false) {
    console.log('❌ ISSUE: Add company endpoint broken');
    console.log('   - Check authentication middleware');
    console.log('   - Verify organisation_id configuration');
    console.log('   - Check companies table schema\n');
  }

  if (results.addCompany === 'auth_required') {
    console.log('ℹ️  INFO: Add company requires authentication');
    console.log('   - This is expected behavior');
    console.log('   - Test by logging into the app first');
    console.log('   - Then try creating a company from /companies page\n');
  }

  if (!results.aiAssistant) {
    console.log('❌ ISSUE: AI Credential Assistant not working');
    console.log('   - Check ANTHROPIC_API_KEY in environment');
    console.log('   - Verify Claude Opus account is active');
    console.log('   - Check cascading-ai.ts service\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
})();
