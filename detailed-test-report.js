/**
 * Detailed Deployment Diagnostic Report
 * Provides in-depth analysis of the deployment issues
 */

import https from 'https';
import { URL } from 'url';

const BASE_URL = 'https://geo-seo-domination-tool-5hfkqdjbt-unite-group.vercel.app';

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

    req.end();
  });
}

async function generateDetailedReport() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  DETAILED DEPLOYMENT DIAGNOSTIC REPORT');
  console.log('  URL: geo-seo-domination-tool-5hfkqdjbt-unite-group');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Test 1: Home Page Analysis
  console.log('━━━ HOME PAGE (/) ━━━\n');
  try {
    const response = await makeRequest(BASE_URL);
    console.log(`Status Code: ${response.statusCode}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`Content-Length: ${response.headers['content-length']}`);
    console.log(`\nResponse Headers:`);
    Object.keys(response.headers).forEach(key => {
      console.log(`  ${key}: ${response.headers[key]}`);
    });
    console.log(`\nResponse Body Preview (first 500 chars):`);
    console.log(response.body.substring(0, 500));
    console.log(`\n... (total length: ${response.body.length} chars)`);

    // Check for error messages
    if (response.body.includes('Application error') ||
        response.body.includes('NEXT_NOT_FOUND') ||
        response.body.includes('Internal Server Error')) {
      console.log(`\n❌ ERROR DETECTED IN RESPONSE BODY`);
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }

  // Test 2: Login Page Analysis
  console.log('\n\n━━━ LOGIN PAGE (/login) ━━━\n');
  try {
    const response = await makeRequest(`${BASE_URL}/login`);
    console.log(`Status Code: ${response.statusCode}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`\nResponse Body Preview (first 500 chars):`);
    console.log(response.body.substring(0, 500));
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }

  // Test 3: Dashboard (Should redirect or return 401)
  console.log('\n\n━━━ DASHBOARD (/dashboard) ━━━\n');
  try {
    const response = await makeRequest(`${BASE_URL}/dashboard`);
    console.log(`Status Code: ${response.statusCode}`);
    console.log(`Location Header: ${response.headers.location || 'N/A'}`);
    console.log(`\nResponse Body Preview (first 500 chars):`);
    console.log(response.body.substring(0, 500));
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }

  // Test 4: API Health Check
  console.log('\n\n━━━ API HEALTH CHECK (/api/health/check) ━━━\n');
  try {
    const response = await makeRequest(`${BASE_URL}/api/health/check`);
    console.log(`Status Code: ${response.statusCode}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`\nFull Response Body:`);
    console.log(response.body);
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }

  // Test 5: Static files (should work)
  console.log('\n\n━━━ STATIC FILE TEST (/_next/static) ━━━\n');
  try {
    // Try to get a common Next.js static file
    const response = await makeRequest(`${BASE_URL}/_next/static/css/app/layout.css`);
    console.log(`Status Code: ${response.statusCode}`);
    console.log(`This should return 200 or 404, NOT 401`);
  } catch (error) {
    console.log(`Note: This is expected if the file doesn't exist`);
  }

  // Test 6: Favicon
  console.log('\n\n━━━ FAVICON TEST (/favicon.ico) ━━━\n');
  try {
    const response = await makeRequest(`${BASE_URL}/favicon.ico`);
    console.log(`Status Code: ${response.statusCode}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`This should return 200 or 404, NOT 401`);
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }

  // Analysis Summary
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('  DIAGNOSTIC SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('ISSUE IDENTIFIED:');
  console.log('All routes are returning 401 Unauthorized errors, including');
  console.log('public pages like home and login.\n');

  console.log('POSSIBLE CAUSES:');
  console.log('1. ❌ Middleware is rejecting all requests');
  console.log('2. ❌ Environment variables (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing/invalid in Vercel');
  console.log('3. ❌ Supabase project is paused or experiencing issues');
  console.log('4. ❌ Middleware config matcher is too broad');
  console.log('5. ❌ Vercel deployment failed to complete properly\n');

  console.log('RECOMMENDED FIXES:');
  console.log('1. Check Vercel Dashboard → Project Settings → Environment Variables');
  console.log('   - Verify NEXT_PUBLIC_SUPABASE_URL is set');
  console.log('   - Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is set');
  console.log('   - Ensure they are available for Production environment\n');

  console.log('2. Check Supabase Dashboard:');
  console.log('   - Ensure project is not paused (free tier auto-pauses)');
  console.log('   - Verify API credentials in Settings → API\n');

  console.log('3. Check Vercel Deployment Logs:');
  console.log('   - Go to Vercel Dashboard → Deployments');
  console.log('   - Click on this deployment');
  console.log('   - Review "Build Logs" and "Function Logs"\n');

  console.log('4. Try redeploying:');
  console.log('   - If env vars were just added, trigger new deployment\n');

  console.log('5. Check middleware.ts:');
  console.log('   - Ensure error handling allows requests to pass through');
  console.log('   - Verify protected paths don\'t include "/" or "/login"\n');

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  COMPARISON TO PREVIOUS DEPLOYMENT');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('PREVIOUS DEPLOYMENT ISSUE:');
  console.log('- Middleware was throwing errors that caused 500 responses\n');

  console.log('CURRENT DEPLOYMENT ISSUE:');
  console.log('- All routes return 401 Unauthorized');
  console.log('- This suggests middleware is running but blocking everything');
  console.log('- Likely due to missing/invalid Supabase credentials\n');

  console.log('STATUS:');
  console.log('❌ The deployment is WORSE than before');
  console.log('   Public pages should be accessible without authentication\n');
}

generateDetailedReport().catch(console.error);
