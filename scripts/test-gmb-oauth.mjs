#!/usr/bin/env node

/**
 * Test Google My Business OAuth and Fetch Business Accounts
 *
 * This script:
 * 1. Refreshes the GMB access token using refresh token
 * 2. Fetches your GMB business accounts
 * 3. Lists all locations for each account
 * 4. Saves location IDs for use in vitals capture
 */

import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMB_ACCOUNTS_URL = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Step 1: Refresh access token
 */
async function refreshAccessToken() {
  try {
    log('\n🔄 Refreshing GMB access token...', 'blue');

    const clientId = process.env.GMB_CLIENT_ID;
    const clientSecret = process.env.GMB_CLIENT_SECRET;
    const refreshToken = process.env.GMB_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Missing GMB OAuth credentials in .env.local');
    }

    const response = await axios.post(
      OAUTH_TOKEN_URL,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token, expires_in } = response.data;
    log(`✅ Access token refreshed (expires in ${expires_in}s)`, 'green');

    return access_token;
  } catch (error) {
    log(`❌ Token refresh failed: ${error.response?.data?.error_description || error.message}`, 'red');
    throw error;
  }
}

/**
 * Step 2: Fetch GMB accounts
 */
async function fetchAccounts(accessToken) {
  try {
    log('\n📋 Fetching GMB accounts...', 'blue');

    const response = await axios.get(GMB_ACCOUNTS_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const accounts = response.data.accounts || [];
    log(`✅ Found ${accounts.length} GMB account(s)`, 'green');

    return accounts;
  } catch (error) {
    log(`❌ Failed to fetch accounts: ${error.response?.data?.error?.message || error.message}`, 'red');
    throw error;
  }
}

/**
 * Step 3: Fetch locations for each account
 */
async function fetchLocations(accessToken, accountName) {
  try {
    log(`\n📍 Fetching locations for ${accountName}...`, 'blue');

    const response = await axios.get(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { readMask: 'name,title,storefrontAddress,phoneNumbers,websiteUri,categories' },
      }
    );

    const locations = response.data.locations || [];
    log(`✅ Found ${locations.length} location(s)`, 'green');

    return locations;
  } catch (error) {
    log(`❌ Failed to fetch locations: ${error.response?.data?.error?.message || error.message}`, 'red');
    return [];
  }
}

/**
 * Step 4: Display account and location details
 */
function displayResults(accounts, locationsMap) {
  log('\n' + '='.repeat(80), 'bright');
  log('📊 GMB ACCOUNT & LOCATION DETAILS', 'bright');
  log('='.repeat(80), 'bright');

  const results = [];

  accounts.forEach((account, idx) => {
    log(`\n🏢 Account ${idx + 1}:`, 'yellow');
    log(`   Name: ${account.accountName}`);
    log(`   Type: ${account.type}`);
    log(`   Resource Name: ${account.name}`);

    const locations = locationsMap[account.name] || [];

    if (locations.length === 0) {
      log('   ⚠️  No locations found', 'yellow');
      return;
    }

    locations.forEach((location, locIdx) => {
      log(`\n   📍 Location ${locIdx + 1}:`, 'green');
      log(`      Name: ${location.title}`);
      log(`      Resource Name: ${location.name}`, 'blue');
      log(`      Website: ${location.websiteUri || 'N/A'}`);
      log(`      Phone: ${location.phoneNumbers?.primaryPhone || 'N/A'}`);

      if (location.storefrontAddress) {
        const addr = location.storefrontAddress;
        log(`      Address: ${addr.addressLines?.join(', ') || ''}, ${addr.locality || ''}, ${addr.administrativeArea || ''} ${addr.postalCode || ''}`);
      }

      if (location.categories?.primaryCategory) {
        log(`      Primary Category: ${location.categories.primaryCategory.displayName}`);
      }

      results.push({
        accountName: account.accountName,
        accountResourceName: account.name,
        locationTitle: location.title,
        locationResourceName: location.name,
        website: location.websiteUri,
        phone: location.phoneNumbers?.primaryPhone,
        address: location.storefrontAddress?.addressLines?.join(', '),
      });
    });
  });

  return results;
}

/**
 * Step 5: Save results to JSON file
 */
function saveResults(results) {
  const outputPath = './data/gmb-locations.json';

  try {
    // Ensure data directory exists
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data', { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    log(`\n💾 Results saved to: ${outputPath}`, 'green');

    log('\n📝 To use in vitals capture:', 'yellow');
    log(`   1. Copy the "locationResourceName" (e.g., "locations/12345...")`);
    log(`   2. Update company record with: UPDATE companies SET gmb_location_id = 'locations/...' WHERE id = 'company-uuid'`);
    log(`   3. Run vitals capture: POST /api/onboarding/vitals/capture`);
  } catch (error) {
    log(`⚠️  Could not save results: ${error.message}`, 'yellow');
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    log('🚀 GMB OAuth Test & Account Fetcher', 'bright');
    log('='.repeat(80), 'bright');

    // Step 1: Refresh token
    const accessToken = await refreshAccessToken();

    // Step 2: Fetch accounts
    const accounts = await fetchAccounts(accessToken);

    if (accounts.length === 0) {
      log('\n⚠️  No GMB accounts found for this OAuth app', 'yellow');
      log('   Make sure you granted access to the correct Google account', 'yellow');
      return;
    }

    // Step 3: Fetch locations for each account
    const locationsMap = {};
    for (const account of accounts) {
      const locations = await fetchLocations(accessToken, account.name);
      locationsMap[account.name] = locations;
    }

    // Step 4: Display results
    const results = displayResults(accounts, locationsMap);

    // Step 5: Save to file
    if (results.length > 0) {
      saveResults(results);
    }

    log('\n✅ Test completed successfully!', 'green');
  } catch (error) {
    log(`\n💥 Test failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the script
main();
