/**
 * Quick API Test - Test onboarding endpoints
 */

async function testOnboardingAPI() {
  const BASE_URL = 'http://localhost:3000';

  console.log('\n🧪 Testing Onboarding API Endpoints\n');

  try {
    // Test 1: Create new client
    console.log('1️⃣  POST /api/onboarding - Create client');
    const testEmail = `test-${Date.now()}@example.com`;

    const createRes = await fetch(`${BASE_URL}/api/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: 'Test Company',
        contact_email: testEmail,
        industry: 'Technology',
        primary_goal: 'Increase Leads',
        company_size: '1-10',
        selected_tier: 'professional'
      })
    });

    const createData = await createRes.json();

    if (!createRes.ok) {
      console.log(`   ❌ FAIL: ${createData.error}`);
      return false;
    }

    console.log(`   ✅ PASS: Client created ${createData.clientId}`);
    const clientId = createData.clientId;

    // Test 2: Complete onboarding (this triggers portfolio creation with UUID)
    console.log('\n2️⃣  PATCH /api/onboarding - Mark complete (triggers portfolio creation)');

    const completeRes = await fetch(`${BASE_URL}/api/onboarding`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        onboarding_completed: true
      })
    });

    const completeData = await completeRes.json();

    if (!completeRes.ok) {
      console.log(`   ❌ FAIL: ${completeData.error}`);
      console.log(`   🔴 THIS IS THE UUID ERROR WE FIXED!`);
      return false;
    }

    console.log(`   ✅ PASS: Onboarding completed`);

    // Test 3: Verify portfolio was created with UUID
    console.log('\n3️⃣  GET /api/onboarding?clientId={id} - Verify portfolio UUID');

    const verifyRes = await fetch(`${BASE_URL}/api/onboarding?clientId=${clientId}`);
    const verifyData = await verifyRes.json();

    if (!verifyData.success) {
      console.log(`   ❌ FAIL: Could not retrieve client`);
      return false;
    }

    const portfolioId = verifyData.client.portfolio_id;

    if (!portfolioId) {
      console.log(`   ❌ FAIL: Portfolio not created`);
      return false;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUUID = uuidRegex.test(portfolioId);

    if (!isValidUUID) {
      console.log(`   ❌ FAIL: Portfolio ID is not valid UUID: ${portfolioId}`);
      console.log(`   🔴 OLD BUG: Would have been "portfolio_1760113302380"`);
      return false;
    }

    console.log(`   ✅ PASS: Portfolio created with valid UUID`);
    console.log(`   📋 Portfolio ID: ${portfolioId}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL API TESTS PASSED');
    console.log('='.repeat(60));
    console.log('\n✨ The UUID fix is working correctly!\n');

    return true;

  } catch (error) {
    console.log(`\n❌ API Test Error: ${error.message}`);
    console.log('Is the server running at http://localhost:3000?\n');
    return false;
  }
}

testOnboardingAPI().then(success => {
  process.exit(success ? 0 : 1);
});
