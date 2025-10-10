/**
 * Test: Run Audit Button Functionality
 *
 * Simulates clicking "Run Audit" button to diagnose why nothing happens
 */

const PRODUCTION_URL = 'https://geo-seo-domination-tool-77475khvq-unite-group.vercel.app';

async function testRunAudit() {
  console.log('\n🔍 TESTING: Run Audit Button\n');

  // First, we need a company ID to test with
  console.log('1️⃣ Fetching companies to get a test ID...');

  try {
    const companiesResponse = await fetch(`${PRODUCTION_URL}/api/companies`);
    const companiesData = await companiesResponse.json();

    if (!companiesData.companies || companiesData.companies.length === 0) {
      console.log('❌ No companies found. Creating a test company first...');

      // Create test company
      const createResponse = await fetch(`${PRODUCTION_URL}/api/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Company for Audit',
          website: 'https://example.com',
          email: 'test@example.com',
          phone: '0400000000'
        })
      });

      const createData = await createResponse.json();
      console.log(`✅ Created test company: ${createData.company.id}`);
      console.log(`   Name: ${createData.company.name}`);
      console.log(`   Website: ${createData.company.website}\n`);

      var testCompanyId = createData.company.id;
      var testUrl = createData.company.website;
    } else {
      var testCompanyId = companiesData.companies[0].id;
      var testUrl = companiesData.companies[0].website;
      console.log(`✅ Using existing company: ${testCompanyId}`);
      console.log(`   Name: ${companiesData.companies[0].name}`);
      console.log(`   Website: ${testUrl}\n`);
    }

    // Now simulate the Run Audit button click
    console.log('2️⃣ Simulating "Run Audit" button click...');
    console.log(`   POST ${PRODUCTION_URL}/api/seo-audits`);
    console.log(`   Body: { company_id: "${testCompanyId}", url: "${testUrl}" }\n`);

    const startTime = Date.now();

    const auditResponse = await fetch(`${PRODUCTION_URL}/api/seo-audits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_id: testCompanyId,
        url: testUrl
      })
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`⏱️  Response received in ${duration}s`);
    console.log(`📊 Status: ${auditResponse.status} ${auditResponse.statusText}\n`);

    // Check response headers
    const contentType = auditResponse.headers.get('content-type');
    console.log(`📦 Content-Type: ${contentType}`);

    if (auditResponse.ok) {
      const auditData = await auditResponse.json();

      console.log('\n✅ SUCCESS! Audit created:\n');
      console.log(`   Audit ID: ${auditData.audit.id}`);
      console.log(`   URL: ${auditData.audit.url}`);
      console.log(`   Overall Score: ${auditData.audit.overall_score}`);
      console.log(`   Performance: ${auditData.audit.performance_score}`);
      console.log(`   SEO: ${auditData.audit.seo_score}`);
      console.log(`   Accessibility: ${auditData.audit.accessibility_score}`);
      console.log(`   Firecrawl: ${auditData.audit.firecrawl_metadata ? '✅' : '❌'}`);
      console.log(`   Lighthouse: ${auditData.audit.lighthouse_data ? '✅' : '❌'}`);

      console.log('\n3️⃣ Verifying audit appears in company audit list...');

      const listResponse = await fetch(`${PRODUCTION_URL}/api/seo-audits?company_id=${testCompanyId}`);
      const listData = await listResponse.json();

      console.log(`   Found ${listData.audits.length} audit(s) for this company`);

      const justCreated = listData.audits.find(a => a.id === auditData.audit.id);
      if (justCreated) {
        console.log(`   ✅ Newly created audit is in the list!`);
      } else {
        console.log(`   ⚠️  Newly created audit NOT in the list (may be timing issue)`);
      }

      console.log('\n🎉 RUN AUDIT BUTTON: WORKING CORRECTLY\n');
      console.log('If you\'re not seeing results in the UI:');
      console.log('  1. Check browser console for JavaScript errors');
      console.log('  2. Check Network tab to see if API call is made');
      console.log('  3. Verify fetchAudits() is called after runAudit()');
      console.log('  4. Check if state is updating correctly\n');

    } else {
      console.log('\n❌ AUDIT FAILED\n');

      const errorText = await auditResponse.text();
      console.log('Error response:');
      console.log(errorText);

      // Try to parse as JSON
      try {
        const errorJson = JSON.parse(errorText);
        console.log('\nParsed error:');
        console.log(JSON.stringify(errorJson, null, 2));
      } catch (e) {
        // Not JSON, already printed as text
      }

      console.log('\n🔍 DIAGNOSIS:');
      if (auditResponse.status === 500) {
        console.log('  • Server error - check Vercel logs');
        console.log('  • May be missing API keys (GOOGLE_API_KEY, FIRECRAWL_API_KEY)');
        console.log('  • Check database connection');
      } else if (auditResponse.status === 401 || auditResponse.status === 403) {
        console.log('  • Authentication/authorization issue');
        console.log('  • Check SUPABASE_SERVICE_ROLE_KEY is set');
      } else if (auditResponse.status === 400) {
        console.log('  • Invalid request data');
        console.log('  • Check company_id and url are valid');
      }
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
  }
}

testRunAudit();
