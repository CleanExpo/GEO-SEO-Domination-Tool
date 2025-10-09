#!/usr/bin/env node

/**
 * Test the Load API with flexible case/whitespace matching
 */

const VERCEL_URL = 'https://geo-seo-domination-tool.vercel.app';

async function testLoad(businessName, email, description) {
  console.log(`\n🧪 Test: ${description}`);
  console.log(`📝 Business: "${businessName}"`);
  console.log(`📧 Email: "${email}"`);

  try {
    const url = `${VERCEL_URL}/api/onboarding/save?businessName=${encodeURIComponent(businessName)}&email=${encodeURIComponent(email)}`;

    const response = await fetch(url);
    const data = await response.json();

    console.log(`📊 Status: ${response.status}`);

    if (data.found) {
      console.log(`✅ FOUND`);
      console.log(`   Business: ${data.formData.businessName}`);
      console.log(`   Email: ${data.formData.email}`);
      console.log(`   Step: ${data.currentStep}`);
    } else {
      console.log(`❌ NOT FOUND`);
      if (data.searchedFor) {
        console.log(`   Searched for: ${data.searchedFor.businessName} / ${data.searchedFor.email}`);
      }
    }

  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}

async function runTests() {
  console.log('🔍 Testing flexible Load functionality (after deployment)\n');
  console.log('NOTE: This will only work after the changes are deployed to Vercel!\n');

  await testLoad('disaster recovery', 'phill@disasterrecovery.com.au', 'lowercase, no space');
  await testLoad('Disaster Recovery', 'phill@disasterrecovery.com.au', 'proper case, no space');
  await testLoad('DISASTER RECOVERY', 'PHILL@DISASTERRECOVERY.COM.AU', 'uppercase everything');
  await testLoad('  Disaster Recovery  ', '  phill@disasterrecovery.com.au  ', 'extra whitespace');

  console.log('\n✅ All variations should find the same record after deployment');
}

runTests();
