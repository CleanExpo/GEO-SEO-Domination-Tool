/**
 * Test Business Lookup API
 */

async function testLookup(url, name) {
  console.log(`\n========== Testing: ${url || name} ==========`);

  try {
    const response = await fetch('http://localhost:3000/api/onboarding/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: url || name,
        searchBy: url ? 'url' : 'name'
      })
    });

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Found:', data.found);

    if (data.found) {
      console.log('Business Name:', data.businessName);
      console.log('Website:', data.website);
      console.log('Address:', data.address);
      console.log('Phone:', data.phone);
      console.log('Industry:', data.industry);
    } else {
      console.log('❌ Business not found');
      console.log('Error:', data.error || 'No error message');
    }

    if (data.details) {
      console.log('Details:', data.details);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test cases
await testLookup('https://www.carsi.com.au');
await testLookup('https://disasterrecovery.com.au');
await testLookup(null, 'Carsi Brisbane');
await testLookup(null, 'Disaster Recovery Queensland');
