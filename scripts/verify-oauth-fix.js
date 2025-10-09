/**
 * OAuth Fix Verification Script
 * Verifies all fixes for Google OAuth 404 error
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('='.repeat(70));
console.log('  Google OAuth 404 Fix Verification');
console.log('='.repeat(70));
console.log('');

let allChecksPassed = true;

// Check 1: Verify server action file exists
console.log('📁 Checking Files...');
console.log('-'.repeat(70));

const serverActionPath = path.join(__dirname, '..', 'app', 'auth', 'signin', 'actions.ts');
if (fs.existsSync(serverActionPath)) {
  console.log('✅ Server action file exists: app/auth/signin/actions.ts');
} else {
  console.log('❌ Server action file missing: app/auth/signin/actions.ts');
  allChecksPassed = false;
}

// Check 2: Verify auth.ts has required config
console.log('');
console.log('⚙️  Checking NextAuth Configuration...');
console.log('-'.repeat(70));

const authPath = path.join(__dirname, '..', 'auth.ts');
if (fs.existsSync(authPath)) {
  const authContent = fs.readFileSync(authPath, 'utf8');

  const hasTrustHost = authContent.includes('trustHost: true');
  const hasBasePath = authContent.includes("basePath: '/api/auth'");

  if (hasTrustHost) {
    console.log('✅ auth.ts has trustHost: true');
  } else {
    console.log('❌ auth.ts missing trustHost: true');
    allChecksPassed = false;
  }

  if (hasBasePath) {
    console.log("✅ auth.ts has basePath: '/api/auth'");
  } else {
    console.log("❌ auth.ts missing basePath: '/api/auth'");
    allChecksPassed = false;
  }
} else {
  console.log('❌ auth.ts file not found');
  allChecksPassed = false;
}

// Check 3: Verify signin page uses form action
console.log('');
console.log('📄 Checking Sign In Page...');
console.log('-'.repeat(70));

const signinPath = path.join(__dirname, '..', 'app', 'auth', 'signin', 'page.tsx');
if (fs.existsSync(signinPath)) {
  const signinContent = fs.readFileSync(signinPath, 'utf8');

  const hasFormAction = signinContent.includes('form action={handleGoogleSignIn}');
  const noWrongImport = !signinContent.includes("from 'next-auth/react'");

  if (hasFormAction) {
    console.log('✅ Sign in page uses form action');
  } else {
    console.log('❌ Sign in page not using form action');
    allChecksPassed = false;
  }

  if (noWrongImport) {
    console.log("✅ Sign in page doesn't use wrong import (next-auth/react)");
  } else {
    console.log("❌ Sign in page still using wrong import from 'next-auth/react'");
    allChecksPassed = false;
  }
} else {
  console.log('❌ Sign in page not found');
  allChecksPassed = false;
}

// Check 4: Verify environment variables
console.log('');
console.log('🔐 Checking Environment Variables...');
console.log('-'.repeat(70));

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');

  const requiredVars = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'GOOGLE_OAUTH_CLIENT_ID',
    'GOOGLE_OAUTH_CLIENT_SECRET',
  ];

  requiredVars.forEach(varName => {
    const regex = new RegExp(`${varName}=`, 'm');
    if (regex.test(envContent)) {
      console.log(`✅ ${varName} is set`);
    } else {
      console.log(`❌ ${varName} is missing`);
      allChecksPassed = false;
    }
  });
} else {
  console.log('❌ .env.local file not found');
  allChecksPassed = false;
}

// Check 5: Test server connectivity (if running)
console.log('');
console.log('🌐 Checking Server...');
console.log('-'.repeat(70));

const BASE_URL = 'http://localhost:3000';

function testServer() {
  return new Promise((resolve) => {
    http.get(BASE_URL, (res) => {
      console.log('✅ Dev server is running on http://localhost:3000');
      resolve(true);
    }).on('error', () => {
      console.log('⚠️  Dev server is not running');
      console.log('   Run: npm run dev');
      resolve(false);
    });
  });
}

testServer().then((serverRunning) => {
  console.log('');
  console.log('='.repeat(70));
  console.log('  Verification Summary');
  console.log('='.repeat(70));
  console.log('');

  if (allChecksPassed && serverRunning) {
    console.log('✅ ALL CHECKS PASSED!');
    console.log('');
    console.log('The OAuth configuration has been fixed. Next steps:');
    console.log('');
    console.log('1. Verify Google Cloud Console configuration:');
    console.log('   - Go to https://console.cloud.google.com/apis/credentials');
    console.log('   - Check your OAuth 2.0 Client ID');
    console.log('   - Ensure these redirect URIs are added:');
    console.log('     • http://localhost:3000/api/auth/callback/google');
    console.log('     • http://localhost:3000/api/auth/signin');
    console.log('');
    console.log('2. Test the OAuth flow:');
    console.log('   - Open: http://localhost:3000/auth/signin');
    console.log('   - Click "Continue with Google"');
    console.log('   - Complete the OAuth flow');
    console.log('');
    console.log('3. Check server logs for debug output');
    console.log('   (NEXTAUTH_DEBUG=true is enabled)');
    console.log('');
  } else if (allChecksPassed && !serverRunning) {
    console.log('✅ All configuration checks passed!');
    console.log('⚠️  But the dev server is not running.');
    console.log('');
    console.log('Start the server with: npm run dev');
    console.log('');
  } else {
    console.log('❌ SOME CHECKS FAILED');
    console.log('');
    console.log('Please review the errors above and fix them.');
    console.log('Refer to OAUTH_FIX_SUMMARY.md for detailed instructions.');
    console.log('');
  }

  console.log('For detailed documentation, see:');
  console.log('- OAUTH_FIX_SUMMARY.md - Complete fix summary and testing guide');
  console.log('- OAUTH_FIX_GUIDE.md - Step-by-step troubleshooting guide');
  console.log('');
});
