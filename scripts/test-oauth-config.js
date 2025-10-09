/**
 * OAuth Configuration Tester
 * Tests NextAuth v5 Google OAuth configuration
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('NextAuth v5 Google OAuth Configuration Test');
console.log('='.repeat(60));
console.log('');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  // Skip comments and empty lines
  if (line.trim().startsWith('#') || !line.trim()) return;

  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    // Remove quotes if present
    value = value.replace(/^["'](.*)["']$/, '$1');
    envVars[key] = value;
  }
});

console.log('📋 Environment Variables Check:');
console.log('-'.repeat(60));

const requiredVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'NEXTAUTH_DEBUG'
];

let allPresent = true;
requiredVars.forEach(varName => {
  const isPresent = !!envVars[varName];
  const icon = isPresent ? '✅' : '❌';
  console.log(`${icon} ${varName}: ${isPresent ? '(set)' : '(MISSING)'}`);
  if (!isPresent) allPresent = false;
});

console.log('');
console.log('📍 NextAuth Configuration:');
console.log('-'.repeat(60));
console.log(`NEXTAUTH_URL: ${envVars.NEXTAUTH_URL || '(not set)'}`);
console.log(`NEXTAUTH_DEBUG: ${envVars.NEXTAUTH_DEBUG || '(not set)'}`);
console.log('');

console.log('🔐 Google OAuth Configuration:');
console.log('-'.repeat(60));
const clientId = envVars.GOOGLE_OAUTH_CLIENT_ID || '';
console.log(`Client ID: ${clientId.substring(0, 20)}...${clientId.substring(clientId.length - 10)}`);
console.log(`Client Secret: ${envVars.GOOGLE_OAUTH_CLIENT_SECRET ? '(set)' : '(MISSING)'}`);
console.log('');

console.log('🌐 Expected OAuth Callback URLs:');
console.log('-'.repeat(60));
const baseUrl = envVars.NEXTAUTH_URL || 'http://localhost:3000';
console.log(`Authorization URL: ${baseUrl}/api/auth/signin`);
console.log(`Callback URL: ${baseUrl}/api/auth/callback/google`);
console.log('');

console.log('⚙️  Google Cloud Console Configuration:');
console.log('-'.repeat(60));
console.log('Make sure you have added these URLs in Google Cloud Console:');
console.log('');
console.log('1. Authorized JavaScript origins:');
console.log(`   - ${baseUrl}`);
console.log('');
console.log('2. Authorized redirect URIs:');
console.log(`   - ${baseUrl}/api/auth/callback/google`);
console.log('');

console.log('🔍 Debugging Steps:');
console.log('-'.repeat(60));
console.log('1. Visit: http://localhost:3000/api/auth/signin');
console.log('2. Click "Sign in with Google"');
console.log('3. Check browser console for errors');
console.log('4. Check server logs for NextAuth debug output');
console.log('');

if (!allPresent) {
  console.log('❌ FAILED: Missing required environment variables');
  console.log('');
  process.exit(1);
}

console.log('✅ All required environment variables are set!');
console.log('');
console.log('Next steps:');
console.log('1. Verify Google Cloud Console has the callback URL configured');
console.log('2. Start the dev server: npm run dev');
console.log('3. Visit: http://localhost:3000/auth/signin');
console.log('4. Click "Continue with Google"');
console.log('5. Check server logs for debug output (NEXTAUTH_DEBUG=true)');
console.log('');
