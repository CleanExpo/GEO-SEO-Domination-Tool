/**
 * Test if background worker is actually being triggered
 */

const BASE_URL = 'https://geo-seo-domination-tool.vercel.app';

async function testWorkerTrigger() {
  console.log('\n🧪 Testing Background Worker Trigger\n');

  // Step 1: Create onboarding session
  console.log('Step 1: Creating onboarding session...');
  const startResponse = await fetch(`${BASE_URL}/api/onboarding/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName: 'Worker Test Company',
      email: `test-${Date.now()}@example.com`,
      contactName: 'John Doe',
      primaryGoals: ['Test'],
      targetKeywords: ['test'],
      contentTypes: ['blog'],
      selectedServices: ['SEO']
    })
  });

  console.log(`Status: ${startResponse.status} ${startResponse.statusText}`);
  const startData = await startResponse.json();
  console.log('Response:', JSON.stringify(startData, null, 2));

  const onboardingId = startData.onboardingId;
  console.log(`\n✅ Created: ${onboardingId}`);

  // Step 2: Immediately check progress
  console.log('\nStep 2: Checking progress immediately...');
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s

  const progressResponse = await fetch(`${BASE_URL}/api/onboarding/${onboardingId}`);
  const progressData = await progressResponse.json();

  console.log('Progress Status:', progressData.progress?.status);
  console.log('Current Step:', progressData.progress?.currentStep);
  console.log('Company ID:', progressData.progress?.companyId || 'NOT CREATED');

  if (progressData.progress?.status === 'pending') {
    console.log('\n❌ PROBLEM: Still pending - worker did NOT run!');

    // Manually trigger worker to test it
    console.log('\nStep 3: Manually triggering worker...');
    const workerResponse = await fetch(`${BASE_URL}/api/onboarding/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onboardingId })
    });

    console.log(`Worker Response: ${workerResponse.status}`);
    const workerData = await workerResponse.json();
    console.log('Worker Result:', JSON.stringify(workerData, null, 2));

    // Check progress again
    console.log('\nStep 4: Checking progress after manual trigger...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const progress2Response = await fetch(`${BASE_URL}/api/onboarding/${onboardingId}`);
    const progress2Data = await progress2Response.json();

    console.log('Updated Status:', progress2Data.progress?.status);
    console.log('Updated Company ID:', progress2Data.progress?.companyId || 'STILL NOT CREATED');

    if (progress2Data.progress?.status === 'completed') {
      console.log('\n✅ Worker works when called manually!');
      console.log('❌ Problem: /api/onboarding/start is NOT triggering the worker');
    }
  } else {
    console.log('\n✅ Worker was triggered automatically!');
  }
}

testWorkerTrigger().catch(console.error);
