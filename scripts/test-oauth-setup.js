#!/usr/bin/env node

/**
 * OAuth Setup Verification Script
 * Tests all components of the Google OAuth flow
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + colors.cyan + '='.repeat(60) + colors.reset);
  console.log(colors.cyan + colors.bold + title + colors.reset);
  console.log(colors.cyan + '='.repeat(60) + colors.reset);
}

function checkEnvVar(name, description, required = true) {
  const value = process.env[name];
  if (!value) {
    if (required) {
      log(`✗ ${name} - MISSING (${description})`, colors.red);
      return false;
    } else {
      log(`⚠ ${name} - Not set (${description})`, colors.yellow);
      return true;
    }
  }

  // Mask sensitive values
  let displayValue = value;
  if (name.includes('SECRET') || name.includes('KEY')) {
    displayValue = value.substring(0, 10) + '...' + value.substring(value.length - 4);
  }

  log(`✓ ${name} - ${displayValue}`, colors.green);
  return true;
}

async function testDatabaseConnection() {
  logSection('DATABASE CONNECTION TEST');

  try {
    const { getDatabase } = await import('../lib/db.js');
    const db = getDatabase();
    await db.initialize();

    log('✓ Database connection successful', colors.green);

    // Check if users table exists
    const tableExists = await db.tableExists('users');
    if (tableExists) {
      log('✓ Users table exists', colors.green);

      // Get user count
      const result = await db.queryOne('SELECT COUNT(*) as count FROM users');
      log(`  Current user count: ${result.count}`, colors.blue);
    } else {
      log('✗ Users table does NOT exist - run npm run db:init', colors.red);
      return false;
    }

    return true;
  } catch (error) {
    log(`✗ Database connection failed: ${error.message}`, colors.red);
    console.error(error);
    return false;
  }
}

function testOAuthConfiguration() {
  logSection('GOOGLE OAUTH CONFIGURATION');

  const allValid = [
    checkEnvVar('GOOGLE_OAUTH_CLIENT_ID', 'Google OAuth Client ID'),
    checkEnvVar('GOOGLE_OAUTH_CLIENT_SECRET', 'Google OAuth Client Secret'),
    checkEnvVar('NEXTAUTH_URL', 'NextAuth Base URL'),
    checkEnvVar('NEXTAUTH_SECRET', 'NextAuth Secret Key'),
  ].every(Boolean);

  if (!allValid) {
    return false;
  }

  // Validate OAuth Client ID format
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId.endsWith('.apps.googleusercontent.com')) {
    log('✗ Invalid GOOGLE_OAUTH_CLIENT_ID format', colors.red);
    log('  Should end with .apps.googleusercontent.com', colors.yellow);
    return false;
  }

  // Validate NEXTAUTH_URL format
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (!nextAuthUrl.startsWith('http://') && !nextAuthUrl.startsWith('https://')) {
    log('✗ Invalid NEXTAUTH_URL format', colors.red);
    log('  Should start with http:// or https://', colors.yellow);
    return false;
  }

  log('\n✓ OAuth configuration is valid', colors.green);

  // Show callback URL
  const callbackUrl = `${nextAuthUrl}/api/auth/callback/google`;
  log('\nExpected OAuth Callback URL:', colors.cyan);
  log(callbackUrl, colors.bold);
  log('\nMake sure this URL is added to "Authorized redirect URIs" in Google Cloud Console:', colors.yellow);
  log('https://console.cloud.google.com/apis/credentials', colors.blue);

  return true;
}

function testFileStructure() {
  logSection('FILE STRUCTURE CHECK');

  const requiredFiles = [
    { path: 'auth.ts', description: 'NextAuth configuration' },
    { path: 'app/api/auth/[...nextauth]/route.ts', description: 'NextAuth API route' },
    { path: 'app/auth/signin/page.tsx', description: 'Sign-in page' },
    { path: 'app/auth/signin/actions.ts', description: 'Sign-in server actions' },
    { path: 'middleware.ts', description: 'Next.js middleware' },
    { path: 'lib/db.js', description: 'Database client' },
    { path: 'database/users-schema.sql', description: 'Users table schema' },
  ];

  let allExist = true;

  for (const file of requiredFiles) {
    const filePath = join(__dirname, '..', file.path);
    const exists = fs.existsSync(filePath);

    if (exists) {
      log(`✓ ${file.path} - ${file.description}`, colors.green);
    } else {
      log(`✗ ${file.path} - MISSING`, colors.red);
      allExist = false;
    }
  }

  return allExist;
}

function showNextSteps() {
  logSection('NEXT STEPS');

  log('1. Start the development server:', colors.cyan);
  log('   npm run dev', colors.bold);

  log('\n2. Open your browser to:', colors.cyan);
  log('   http://localhost:3000/auth/signin', colors.bold);

  log('\n3. Click "Continue with Google" and watch the terminal for logs', colors.cyan);

  log('\n4. If you see errors, check:', colors.cyan);
  log('   - Browser console (F12)', colors.yellow);
  log('   - Network tab for failed requests', colors.yellow);
  log('   - Terminal output for server errors', colors.yellow);

  log('\n5. Common issues:', colors.cyan);
  log('   - "redirect_uri_mismatch": Check OAuth callback URL in Google Console', colors.yellow);
  log('   - "access_denied": Check test users in Google Console', colors.yellow);
  log('   - Database errors: Check server logs for database connection issues', colors.yellow);
}

async function main() {
  log(colors.bold + '\nGoogle OAuth Setup Verification\n', colors.cyan);

  const results = {
    env: testOAuthConfiguration(),
    files: testFileStructure(),
    db: await testDatabaseConnection(),
  };

  logSection('VERIFICATION SUMMARY');

  if (results.env && results.files && results.db) {
    log('✓ ALL CHECKS PASSED!', colors.green + colors.bold);
    log('\nYour OAuth setup is correctly configured.', colors.green);
    showNextSteps();
  } else {
    log('✗ SOME CHECKS FAILED', colors.red + colors.bold);
    log('\nPlease fix the issues above before testing OAuth.', colors.yellow);

    if (!results.env) {
      log('\n→ Fix environment variables in .env.local', colors.yellow);
    }
    if (!results.files) {
      log('\n→ Restore missing files from git', colors.yellow);
    }
    if (!results.db) {
      log('\n→ Run: npm run db:init', colors.yellow);
    }
  }
}

main().catch(error => {
  log('\n✗ Verification failed with error:', colors.red + colors.bold);
  console.error(error);
  process.exit(1);
});
