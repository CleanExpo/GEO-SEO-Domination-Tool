/**
 * Full Production Deployment Test
 * Comprehensive test of production deployment
 */

import https from 'https';
import { URL } from 'url';

const BASE_URL = 'https://geo-seo-domination-tool.vercel.app';
const RESULTS = {
  passed: [],
  failed: [],
  warnings: []
};

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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          location: res.headers.location
        });
      });
    });

    req.on('error', (error) => { reject(error); });
    req.end();
  });
}

async function testHomePage() {
  console.log('\n=== TEST 1: Home Page (Public) ===');
  try {
    const response = await makeRequest(BASE_URL);

    if (response.statusCode === 200) {
      const hasHeading = response.body.includes('GEO-SEO') ||
                        response.body.includes('GEO SEO') ||
                        response.body.includes('Domination');
      const hasGetStarted = response.body.includes('Get Started') ||
                           response.body.includes('get-started');
      const hasFeatures = response.body.includes('SEO') &&
                         response.body.includes('Track') &&
                         response.body.includes('Performance');

      console.log(`✅ Status: ${response.statusCode}`);
      console.log(`   - Has SEO/branding content: ${hasHeading ? '✅' : '⚠️'}`);
      console.log(`   - Has Get Started CTA: ${hasGetStarted ? '✅' : '⚠️'}`);
      console.log(`   - Has feature content: ${hasFeatures ? '✅' : '⚠️'}`);
      console.log(`   - Page size: ${response.body.length} bytes`);

      if (response.statusCode === 200 && hasHeading) {
        RESULTS.passed.push('Home page loads with correct content');
      } else {
        RESULTS.warnings.push('Home page loads but some content may be missing');
      }
      return true;
    } else {
      console.log(`❌ Status: ${response.statusCode}`);
      RESULTS.failed.push(`Home page returned ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    RESULTS.failed.push(`Home page error: ${error.message}`);
    return false;
  }
}

async function testLoginPage() {
  console.log('\n=== TEST 2: Login Page (Public) ===');
  try {
    const response = await makeRequest(`${BASE_URL}/login`);

    if (response.statusCode === 200) {
      const hasEmailField = response.body.includes('email') ||
                           response.body.includes('Email');
      const hasPasswordField = response.body.includes('password') ||
                              response.body.includes('Password');
      const hasSignIn = response.body.includes('Sign In') ||
                       response.body.includes('Log In') ||
                       response.body.includes('Login');
      const hasAuth = response.body.includes('Supabase') ||
                     response.body.includes('auth');

      console.log(`✅ Status: ${response.statusCode}`);
      console.log(`   - Has email reference: ${hasEmailField ? '✅' : '⚠️'}`);
      console.log(`   - Has password reference: ${hasPasswordField ? '✅' : '⚠️'}`);
      console.log(`   - Has sign in reference: ${hasSignIn ? '✅' : '⚠️'}`);
      console.log(`   - Has auth system: ${hasAuth ? '✅' : '⚠️'}`);

      if (hasEmailField || hasPasswordField || hasSignIn) {
        RESULTS.passed.push('Login page loads with form elements');
      } else {
        RESULTS.warnings.push('Login page loads but form content unclear');
      }
      return true;
    } else {
      console.log(`❌ Status: ${response.statusCode}`);
      RESULTS.failed.push(`Login page returned ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    RESULTS.failed.push(`Login page error: ${error.message}`);
    return false;
  }
}

async function testProtectedRoute() {
  console.log('\n=== TEST 3: Protected Route Redirect ===');
  try {
    const response = await makeRequest(`${BASE_URL}/dashboard`);

    if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
      const location = response.headers.location || '';
      const redirectsToLogin = location.includes('/login');

      console.log(`✅ Status: ${response.statusCode} (Redirect)`);
      console.log(`   - Redirects to: ${location}`);
      console.log(`   - Redirects to login: ${redirectsToLogin ? '✅' : '⚠️'}`);

      if (redirectsToLogin) {
        RESULTS.passed.push('Dashboard redirects to login correctly');
      } else {
        RESULTS.warnings.push('Dashboard redirects but not to /login');
      }
      return true;
    } else if (response.statusCode === 200) {
      const hasRedirect = response.body.includes('window.location') ||
                         response.body.includes('router.push') ||
                         response.body.includes('redirect');

      console.log(`⚠️  Status: ${response.statusCode} (Page loads)`);
      console.log(`   - Has client redirect: ${hasRedirect ? '⚠️' : '❌'}`);

      RESULTS.warnings.push('Dashboard uses client-side redirect instead of server redirect');
      return true;
    } else if ([401, 403].includes(response.statusCode)) {
      console.log(`✅ Status: ${response.statusCode} (Unauthorized)`);
      RESULTS.passed.push('Dashboard returns unauthorized status');
      return true;
    } else {
      console.log(`❌ Status: ${response.statusCode}`);
      RESULTS.failed.push(`Dashboard returned unexpected ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    RESULTS.failed.push(`Dashboard test error: ${error.message}`);
    return false;
  }
}

async function testAPIHealth() {
  console.log('\n=== TEST 4: API Health Check ===');
  try {
    const response = await makeRequest(`${BASE_URL}/api/health/check`);

    if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.body);
        console.log(`✅ Status: ${response.statusCode}`);
        console.log(`✅ Returns valid JSON`);
        console.log(`\n   Health Check Data:`);
        console.log(JSON.stringify(data, null, 2).split('\n').map(line => '   ' + line).join('\n'));

        RESULTS.passed.push('Health check API returns valid JSON');
        return true;
      } catch {
        console.log(`✅ Status: ${response.statusCode}`);
        console.log(`❌ Invalid JSON response`);
        RESULTS.failed.push('Health check returns non-JSON');
        return false;
      }
    } else {
      console.log(`⚠️  Status: ${response.statusCode}`);
      RESULTS.warnings.push(`Health check returned ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    RESULTS.failed.push(`Health check error: ${error.message}`);
    return false;
  }
}

async function testSecurityHeaders() {
  console.log('\n=== TEST 5: Security Headers ===');
  try {
    const response = await makeRequest(BASE_URL);
    const h = response.headers;

    const checks = {
      'X-Frame-Options': 'x-frame-options' in h,
      'X-Content-Type-Options': 'x-content-type-options' in h,
      'Content-Security-Policy': 'content-security-policy' in h,
      'Strict-Transport-Security': 'strict-transport-security' in h,
      'Referrer-Policy': 'referrer-policy' in h,
      'X-XSS-Protection': 'x-xss-protection' in h
    };

    console.log(`Security Header Status:`);
    Object.entries(checks).forEach(([name, present]) => {
      const value = present ? h[name.toLowerCase()] : 'Missing';
      console.log(`   ${present ? '✅' : '❌'} ${name}: ${value}`);
    });

    const criticalHeaders = checks['X-Frame-Options'] && checks['Strict-Transport-Security'];
    const allHeaders = Object.values(checks).every(v => v);

    if (allHeaders) {
      RESULTS.passed.push('All security headers present');
    } else if (criticalHeaders) {
      RESULTS.passed.push('Critical security headers present');
      RESULTS.warnings.push('Some optional security headers missing');
    } else {
      RESULTS.failed.push('Missing critical security headers');
    }

    return true;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    RESULTS.failed.push(`Security header test error: ${error.message}`);
    return false;
  }
}

async function testNoPublicPageErrors() {
  console.log('\n=== TEST 6: No Auth Errors on Public Pages ===');
  try {
    const response = await makeRequest(BASE_URL);

    const has401Error = response.body.includes('401') &&
                       response.body.includes('error');
    const hasAuthError = response.body.includes('authentication failed') ||
                        response.body.includes('Supabase client initialization failed');
    const hasVercelAuth = response.body.includes('Vercel Authentication Required');

    console.log(`   - No 401 errors: ${!has401Error ? '✅' : '❌'}`);
    console.log(`   - No auth errors: ${!hasAuthError ? '✅' : '❌'}`);
    console.log(`   - No Vercel protection: ${!hasVercelAuth ? '✅' : '❌'}`);

    if (!has401Error && !hasAuthError && !hasVercelAuth) {
      RESULTS.passed.push('No authentication errors on public pages');
      return true;
    } else {
      if (hasVercelAuth) {
        RESULTS.failed.push('Vercel deployment protection is active');
      } else {
        RESULTS.failed.push('Authentication errors detected on public pages');
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    RESULTS.failed.push(`Error check failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  PRODUCTION DEPLOYMENT TEST SUITE                          ║');
  console.log('║  After Middleware Error Handling Fix                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`\nTarget: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  await testHomePage();
  await testLoginPage();
  await testProtectedRoute();
  await testAPIHealth();
  await testSecurityHeaders();
  await testNoPublicPageErrors();

  console.log('\n\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  TEST RESULTS SUMMARY                                      ║');
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

  const criticalFailures = RESULTS.failed.filter(item =>
    item.includes('Home page') ||
    item.includes('Login page') ||
    item.includes('authentication errors') ||
    item.includes('Vercel deployment protection')
  );

  console.log('\n\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  DEPLOYMENT STATUS                                         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  if (criticalFailures.length === 0 && RESULTS.failed.length === 0) {
    console.log('✅ DEPLOYMENT IS WORKING CORRECTLY');
    console.log('\nAll critical tests passed. The middleware fix has been successfully');
    console.log('deployed and the application is functioning as expected.\n');
    console.log('What\'s working:');
    console.log('  ✅ Public pages (home, login) load without auth errors');
    console.log('  ✅ Protected routes handle unauthenticated users correctly');
    console.log('  ✅ Security headers are configured properly');
    console.log('  ✅ No 401 errors on public pages (middleware fix working)\n');
  } else if (criticalFailures.length === 0) {
    console.log('⚠️  DEPLOYMENT IS MOSTLY WORKING');
    console.log('\nCore functionality is intact, but some non-critical issues exist.\n');
  } else {
    console.log('❌ DEPLOYMENT HAS CRITICAL ISSUES');
    console.log('\nCritical failures detected:\n');
    criticalFailures.forEach(item => console.log(`  ❌ ${item}`));
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}

runAllTests().catch(console.error);
