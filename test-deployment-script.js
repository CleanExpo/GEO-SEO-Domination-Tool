/**
 * Deployment Testing Script
 * Tests the newly deployed website at https://geo-seo-domination-tool-5hfkqdjbt-unite-group.vercel.app
 *
 * This script tests all scenarios from test-deployment.md without Playwright MCP
 */

import https from 'https';
import { URL } from 'url';

const BASE_URL = 'https://geo-seo-domination-tool-5hfkqdjbt-unite-group.vercel.app';
const RESULTS = {
  passed: [],
  failed: [],
  warnings: []
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          location: res.headers.location
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Test functions
async function testHomePage() {
  console.log('\n=== TEST 1: Home Page (Public) ===');
  try {
    const response = await makeRequest(BASE_URL);

    if (response.statusCode === 200) {
      const hasHeading = response.body.includes('GEO-SEO Domination Tool') ||
                        response.body.includes('GEO SEO') ||
                        response.body.includes('Domination');
      const hasGetStarted = response.body.includes('Get Started') ||
                           response.body.includes('get-started') ||
                           response.body.includes('getstarted');

      if (hasHeading) {
        RESULTS.passed.push('Home page loads with title');
      } else {
        RESULTS.warnings.push('Home page title not found in HTML');
      }

      if (hasGetStarted) {
        RESULTS.passed.push('Get Started button found');
      } else {
        RESULTS.warnings.push('Get Started button not found in HTML');
      }

      console.log(`✅ Status Code: ${response.statusCode}`);
      console.log(`✅ Page loaded successfully`);
      console.log(`   - Has heading: ${hasHeading ? '✅' : '⚠️'}`);
      console.log(`   - Has Get Started: ${hasGetStarted ? '✅' : '⚠️'}`);

      return true;
    } else {
      console.log(`❌ Status Code: ${response.statusCode} (Expected 200)`);
      RESULTS.failed.push(`Home page returned ${response.statusCode} instead of 200`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    RESULTS.failed.push(`Home page failed to load: ${error.message}`);
    return false;
  }
}

async function testLoginPage() {
  console.log('\n=== TEST 2: Login Page (Public) ===');
  try {
    const response = await makeRequest(`${BASE_URL}/login`);

    if (response.statusCode === 200) {
      const hasEmailField = response.body.includes('email') ||
                           response.body.includes('Email') ||
                           response.body.includes('type="email"');
      const hasPasswordField = response.body.includes('password') ||
                              response.body.includes('Password') ||
                              response.body.includes('type="password"');
      const hasSignIn = response.body.includes('Sign In') ||
                       response.body.includes('sign-in') ||
                       response.body.includes('signin');

      if (hasEmailField && hasPasswordField && hasSignIn) {
        RESULTS.passed.push('Login page loads with form fields');
      } else {
        RESULTS.warnings.push('Some login form fields not found');
      }

      console.log(`✅ Status Code: ${response.statusCode}`);
      console.log(`✅ Login page loaded successfully`);
      console.log(`   - Has email field: ${hasEmailField ? '✅' : '⚠️'}`);
      console.log(`   - Has password field: ${hasPasswordField ? '✅' : '⚠️'}`);
      console.log(`   - Has sign in button: ${hasSignIn ? '✅' : '⚠️'}`);

      return true;
    } else {
      console.log(`❌ Status Code: ${response.statusCode} (Expected 200)`);
      RESULTS.failed.push(`Login page returned ${response.statusCode} instead of 200`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    RESULTS.failed.push(`Login page failed to load: ${error.message}`);
    return false;
  }
}

async function testProtectedRouteRedirect() {
  console.log('\n=== TEST 3: Protected Route Redirect ===');
  try {
    // Don't follow redirects automatically
    const response = await makeRequest(`${BASE_URL}/dashboard`, {
      method: 'GET'
    });

    // Check for redirect (301, 302, 303, 307, 308)
    if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
      const location = response.headers.location || '';
      const hasRedirectToLogin = location.includes('/login') ||
                                location.includes('login');
      const hasRedirectParam = location.includes('redirectTo') ||
                              location.includes('redirect') ||
                              location.includes('callbackUrl');

      if (hasRedirectToLogin) {
        RESULTS.passed.push('Protected route redirects to login');
      } else {
        RESULTS.warnings.push('Protected route redirects but not to /login');
      }

      console.log(`✅ Status Code: ${response.statusCode} (Redirect)`);
      console.log(`✅ Redirects to: ${location}`);
      console.log(`   - Redirects to login: ${hasRedirectToLogin ? '✅' : '⚠️'}`);
      console.log(`   - Has redirect param: ${hasRedirectParam ? '✅' : '⚠️'}`);

      return true;
    } else if (response.statusCode === 200) {
      // Check if it's a client-side redirect
      const hasClientRedirect = response.body.includes('window.location') ||
                               response.body.includes('router.push') ||
                               response.body.includes('useRouter');

      if (hasClientRedirect) {
        console.log(`⚠️ Status Code: ${response.statusCode} (Client-side redirect)`);
        RESULTS.warnings.push('Dashboard uses client-side redirect instead of server redirect');
      } else {
        console.log(`❌ Status Code: ${response.statusCode} (Expected redirect)`);
        RESULTS.failed.push('Dashboard does not redirect to login');
      }

      return false;
    } else if (response.statusCode === 401 || response.statusCode === 403) {
      console.log(`✅ Status Code: ${response.statusCode} (Unauthorized)`);
      RESULTS.passed.push('Protected route returns unauthorized status');
      return true;
    } else {
      console.log(`❌ Status Code: ${response.statusCode} (Expected redirect or 401)`);
      RESULTS.failed.push(`Dashboard returned unexpected status ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    RESULTS.failed.push(`Protected route test failed: ${error.message}`);
    return false;
  }
}

async function testAPIHealthCheck() {
  console.log('\n=== TEST 4: API Health Check ===');
  try {
    const response = await makeRequest(`${BASE_URL}/api/health/check`);

    if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.body);
        const hasDatabase = 'database' in data || 'db' in data;
        const hasServices = 'services' in data;
        const hasEnvironment = 'environment' in data || 'env' in data;

        console.log(`✅ Status Code: ${response.statusCode}`);
        console.log(`✅ Returns JSON`);
        console.log(`   - Has database status: ${hasDatabase ? '✅' : '⚠️'}`);
        console.log(`   - Has services status: ${hasServices ? '✅' : '⚠️'}`);
        console.log(`   - Has environment info: ${hasEnvironment ? '✅' : '⚠️'}`);
        console.log(`\n   Response data:`, JSON.stringify(data, null, 2));

        if (hasDatabase && hasServices && hasEnvironment) {
          RESULTS.passed.push('Health check API returns complete data');
        } else {
          RESULTS.warnings.push('Health check API missing some expected fields');
        }

        return true;
      } catch (parseError) {
        console.log(`❌ Invalid JSON response`);
        console.log(`   Body: ${response.body.substring(0, 200)}`);
        RESULTS.failed.push('Health check returned invalid JSON');
        return false;
      }
    } else {
      console.log(`❌ Status Code: ${response.statusCode} (Expected 200)`);
      RESULTS.failed.push(`Health check returned ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    RESULTS.failed.push(`Health check API failed: ${error.message}`);
    return false;
  }
}

async function testSecurityHeaders() {
  console.log('\n=== TEST 5: Security Headers ===');
  try {
    const response = await makeRequest(BASE_URL);

    const headers = response.headers;
    const hasXFrameOptions = 'x-frame-options' in headers;
    const hasContentTypeOptions = 'x-content-type-options' in headers;
    const hasCSP = 'content-security-policy' in headers;
    const hasHSTS = 'strict-transport-security' in headers;

    console.log(`✅ Checked security headers`);
    console.log(`   - X-Frame-Options: ${hasXFrameOptions ? '✅ ' + headers['x-frame-options'] : '❌ Missing'}`);
    console.log(`   - X-Content-Type-Options: ${hasContentTypeOptions ? '✅ ' + headers['x-content-type-options'] : '❌ Missing'}`);
    console.log(`   - Content-Security-Policy: ${hasCSP ? '✅ Present' : '⚠️ Missing'}`);
    console.log(`   - Strict-Transport-Security: ${hasHSTS ? '✅ ' + headers['strict-transport-security'] : '⚠️ Missing'}`);

    if (hasXFrameOptions && hasContentTypeOptions) {
      RESULTS.passed.push('Basic security headers present');
    } else {
      RESULTS.warnings.push('Some security headers are missing');
    }

    if (!hasCSP) {
      RESULTS.warnings.push('CSP header is missing');
    }

    if (!hasHSTS) {
      RESULTS.warnings.push('HSTS header is missing');
    }

    return true;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    RESULTS.failed.push(`Security headers test failed: ${error.message}`);
    return false;
  }
}

async function testAPICompanies() {
  console.log('\n=== TEST 6: Companies API Endpoint ===');
  try {
    const response = await makeRequest(`${BASE_URL}/api/companies`);

    // Should return 401/403 or redirect when not authenticated
    if ([401, 403].includes(response.statusCode)) {
      console.log(`✅ Status Code: ${response.statusCode} (Properly protected)`);
      RESULTS.passed.push('Companies API requires authentication');
      return true;
    } else if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.body);
        console.log(`⚠️ Status Code: ${response.statusCode} (No auth required?)`);
        console.log(`   - Returns: ${Array.isArray(data) ? 'Array' : 'Object'}`);
        RESULTS.warnings.push('Companies API accessible without authentication');
        return true;
      } catch {
        console.log(`❌ Invalid JSON response`);
        RESULTS.failed.push('Companies API returned invalid JSON');
        return false;
      }
    } else if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
      console.log(`✅ Status Code: ${response.statusCode} (Redirects to auth)`);
      RESULTS.passed.push('Companies API redirects when not authenticated');
      return true;
    } else {
      console.log(`⚠️ Status Code: ${response.statusCode} (Unexpected)`);
      RESULTS.warnings.push(`Companies API returned unexpected status ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    RESULTS.failed.push(`Companies API test failed: ${error.message}`);
    return false;
  }
}

async function testNoSupabase401Errors() {
  console.log('\n=== TEST 7: No Supabase 401 Errors on Public Pages ===');
  try {
    const response = await makeRequest(BASE_URL);

    // Check if the page contains any error messages
    const has401Error = response.body.includes('401') &&
                       (response.body.includes('Unauthorized') ||
                        response.body.includes('error'));
    const hasSupabaseError = response.body.includes('Supabase client initialization failed') ||
                            response.body.includes('supabase error');

    if (!has401Error && !hasSupabaseError) {
      console.log(`✅ No 401 errors in page content`);
      console.log(`✅ No Supabase initialization errors`);
      RESULTS.passed.push('No authentication errors on public pages');
      return true;
    } else {
      console.log(`❌ Found error indicators in page`);
      if (has401Error) {
        RESULTS.failed.push('401 error found in page content');
      }
      if (hasSupabaseError) {
        RESULTS.failed.push('Supabase initialization error found');
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    RESULTS.failed.push(`Error check test failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  DEPLOYMENT TEST SUITE                                     ║');
  console.log('║  Testing: geo-seo-domination-tool-5hfkqdjbt-unite-group   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`\nTarget URL: ${BASE_URL}`);
  console.log(`Test Time: ${new Date().toISOString()}\n`);

  // Run all tests
  await testHomePage();
  await testLoginPage();
  await testProtectedRouteRedirect();
  await testAPIHealthCheck();
  await testSecurityHeaders();
  await testAPICompanies();
  await testNoSupabase401Errors();

  // Print summary
  console.log('\n\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  TEST SUMMARY                                              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log(`✅ PASSED (${RESULTS.passed.length}):`);
  if (RESULTS.passed.length === 0) {
    console.log('   (none)');
  } else {
    RESULTS.passed.forEach(item => console.log(`   • ${item}`));
  }

  console.log(`\n⚠️  WARNINGS (${RESULTS.warnings.length}):`);
  if (RESULTS.warnings.length === 0) {
    console.log('   (none)');
  } else {
    RESULTS.warnings.forEach(item => console.log(`   • ${item}`));
  }

  console.log(`\n❌ FAILED (${RESULTS.failed.length}):`);
  if (RESULTS.failed.length === 0) {
    console.log('   (none)');
  } else {
    RESULTS.failed.forEach(item => console.log(`   • ${item}`));
  }

  console.log('\n\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  DEPLOYMENT STATUS                                         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const criticalFailures = RESULTS.failed.filter(item =>
    item.includes('Home page') ||
    item.includes('Login page') ||
    item.includes('401 error') ||
    item.includes('Supabase')
  );

  if (criticalFailures.length === 0 && RESULTS.failed.length === 0) {
    console.log('✅ DEPLOYMENT IS WORKING CORRECTLY');
    console.log('\nAll tests passed! The deployment is functioning as expected.');
  } else if (criticalFailures.length === 0) {
    console.log('⚠️  DEPLOYMENT IS MOSTLY WORKING');
    console.log('\nSome non-critical tests failed, but core functionality appears intact.');
  } else {
    console.log('❌ DEPLOYMENT HAS CRITICAL ISSUES');
    console.log('\nCritical failures detected that need immediate attention.');
  }

  console.log('\n\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  NEXT STEPS                                                ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  if (RESULTS.failed.length > 0) {
    console.log('1. Review the failed tests above');
    console.log('2. Check Vercel deployment logs for errors');
    console.log('3. Verify environment variables in Vercel dashboard');
    console.log('4. Check Supabase dashboard for database issues');
    console.log('5. Review middleware configuration for auth handling');
  } else if (RESULTS.warnings.length > 0) {
    console.log('1. Review warnings for potential improvements');
    console.log('2. Consider adding missing security headers');
    console.log('3. Verify all expected page content is present');
  } else {
    console.log('✅ No action needed - deployment is healthy!');
    console.log('   Consider running manual browser tests for UI verification.');
  }

  console.log('\n');

  // Exit with appropriate code
  process.exit(criticalFailures.length > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n\n❌ FATAL ERROR:', error);
  process.exit(1);
});
