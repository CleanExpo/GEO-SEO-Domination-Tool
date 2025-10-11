#!/usr/bin/env node

/**
 * Parse GMB User/Account ID from XML Response
 *
 * This script helps interpret the XML response from Google My Business API
 * and provides guidance on using the account/user ID.
 */

import { parseStringPromise } from 'xml2js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

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
 * Parse XML response and extract user/account IDs
 */
function parseXmlResponse(xmlString) {
  const userIdMatch = xmlString.match(/<user>([A-F0-9]+)<\/user>/);

  if (userIdMatch) {
    return {
      userId: userIdMatch[1],
      format: 'hex',
      length: userIdMatch[1].length,
      type: userIdMatch[1].length === 32 ? 'MD5/UUID-like' : 'Unknown'
    };
  }

  return null;
}

/**
 * Fetch GMB accounts using the parsed user ID
 */
async function fetchGMBAccountsWithUserId(accessToken, userId) {
  try {
    log('\n🔍 Attempting to fetch GMB accounts...', 'blue');

    // Try different API endpoints that might use this user ID
    const endpoints = [
      `https://mybusinessaccountmanagement.googleapis.com/v1/accounts`,
      `https://mybusiness.googleapis.com/v4/accounts`,
      `https://mybusiness.googleapis.com/v4/accounts/${userId}`,
    ];

    for (const endpoint of endpoints) {
      try {
        log(`\n📡 Trying: ${endpoint}`, 'blue');
        const response = await axios.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          },
        });

        if (response.data) {
          log('✅ Success!', 'green');
          return response.data;
        }
      } catch (error) {
        if (error.response?.status === 429) {
          log('⚠️  Rate limited', 'yellow');
        } else if (error.response?.status === 404) {
          log('❌ Not found (404)', 'red');
        } else {
          log(`❌ Error: ${error.response?.data?.error?.message || error.message}`, 'red');
        }
      }
    }

    return null;
  } catch (error) {
    log(`❌ Failed: ${error.message}`, 'red');
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    log('🚀 GMB User ID Parser & Account Fetcher', 'bright');
    log('='.repeat(80), 'bright');

    const xmlInput = `<users>
<user>DB030D197A83DF2F524BF0DFBACDC52C</user>
</users>`;

    log('\n📄 Parsing XML response...', 'blue');
    const parsed = parseXmlResponse(xmlInput);

    if (!parsed) {
      log('❌ Could not parse user ID from XML', 'red');
      return;
    }

    log('\n✅ User ID extracted:', 'green');
    log(`   ID: ${parsed.userId}`, 'bright');
    log(`   Format: ${parsed.format}`);
    log(`   Length: ${parsed.length} characters`);
    log(`   Type: ${parsed.type}`);

    // Get OAuth token
    log('\n🔄 Getting fresh OAuth token...', 'blue');
    const { getGMBAccessToken } = await import('../services/api/google-oauth-refresh.js');
    const accessToken = await getGMBAccessToken();

    if (!accessToken) {
      log('❌ Could not obtain access token', 'red');
      log('\n💡 Tip: Make sure GMB OAuth credentials are in .env.local', 'yellow');
      return;
    }

    log('✅ Access token obtained', 'green');

    // Try to fetch accounts
    const accounts = await fetchGMBAccountsWithUserId(accessToken, parsed.userId);

    if (accounts) {
      log('\n📊 GMB Accounts Data:', 'green');
      console.log(JSON.stringify(accounts, null, 2));
    } else {
      log('\n⚠️  Could not fetch accounts', 'yellow');
      log('\n💡 This user ID might be:', 'blue');
      log('   1. An OAuth user identifier (not directly usable for API calls)', 'blue');
      log('   2. A deprecated API format', 'blue');
      log('   3. Specific to an older GMB API version', 'blue');

      log('\n📝 Recommended approach:', 'yellow');
      log('   1. Use the standard accounts endpoint:', 'yellow');
      log('      GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts', 'yellow');
      log('   2. Extract account names from response (format: accounts/1234567890)', 'yellow');
      log('   3. List locations for each account:', 'yellow');
      log('      GET .../v1/{accountName}/locations', 'yellow');
    }

  } catch (error) {
    log(`\n💥 Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();
