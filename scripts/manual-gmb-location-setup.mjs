#!/usr/bin/env node

/**
 * Manual GMB Location ID Setup
 *
 * WORKAROUND for GMB API rate limits:
 * This script helps you manually add your GMB location ID to the database
 * without needing to call the GMB API.
 *
 * HOW TO GET YOUR LOCATION ID:
 * 1. Go to https://business.google.com
 * 2. Select your business location
 * 3. The location ID is in the URL or you can find it in the API settings
 * 4. Format: "locations/12345678901234567890"
 */

import pg from 'pg';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
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

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function connectToDatabase() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL or POSTGRES_URL not configured in .env.local');
  }

  const { Pool } = pg;
  const pool = new Pool({ connectionString: databaseUrl });

  return pool;
}

async function listCompanies(pool) {
  try {
    const result = await pool.query(`
      SELECT id, name, website, gmb_location_id
      FROM companies
      ORDER BY created_at DESC
      LIMIT 10
    `);

    return result.rows;
  } catch (error) {
    throw new Error(`Failed to list companies: ${error.message}`);
  }
}

async function updateCompanyLocationId(pool, companyId, locationId) {
  try {
    const result = await pool.query(
      `UPDATE companies SET gmb_location_id = $1 WHERE id = $2 RETURNING *`,
      [locationId, companyId]
    );

    if (result.rows.length === 0) {
      throw new Error('Company not found');
    }

    return result.rows[0];
  } catch (error) {
    throw new Error(`Failed to update company: ${error.message}`);
  }
}

async function main() {
  try {
    log('🚀 Manual GMB Location ID Setup', 'bright');
    log('='.repeat(80), 'bright');

    log('\n📋 This script helps you manually add your GMB location ID to the database', 'blue');
    log('   (Workaround for GMB API rate limits)\n', 'blue');

    log('HOW TO GET YOUR LOCATION ID:', 'yellow');
    log('1. Go to https://business.google.com', 'yellow');
    log('2. Select your business location', 'yellow');
    log('3. Look for the location ID in the URL or API settings', 'yellow');
    log('4. Format: locations/12345678901234567890\n', 'yellow');

    // Connect to database
    log('🔌 Connecting to database...', 'blue');
    const pool = await connectToDatabase();
    log('✅ Connected to database', 'green');

    // List companies
    log('\n📊 Existing companies:', 'blue');
    const companies = await listCompanies(pool);

    if (companies.length === 0) {
      log('⚠️  No companies found in database', 'yellow');
      log('   Create a company first at: http://localhost:3000/companies', 'yellow');
      await pool.end();
      rl.close();
      return;
    }

    companies.forEach((company, idx) => {
      log(`\n${idx + 1}. ${company.name}`, 'green');
      log(`   ID: ${company.id}`);
      log(`   Website: ${company.website || 'N/A'}`);
      log(`   GMB Location ID: ${company.gmb_location_id || '❌ Not set'}`, company.gmb_location_id ? 'green' : 'red');
    });

    // Get user input
    log('\n' + '='.repeat(80), 'bright');
    const companyNumber = await question('Enter company number (1, 2, 3, etc.) or company ID: ');

    let selectedCompany;
    if (companyNumber.match(/^[0-9]+$/)) {
      // User entered a number
      const idx = parseInt(companyNumber) - 1;
      selectedCompany = companies[idx];
    } else {
      // User entered a UUID
      selectedCompany = companies.find(c => c.id === companyNumber);
    }

    if (!selectedCompany) {
      throw new Error('Invalid company selection');
    }

    log(`\n✅ Selected: ${selectedCompany.name}`, 'green');

    // Get location ID
    const locationId = await question('\nEnter GMB location ID (e.g., locations/12345678901234567890): ');

    if (!locationId.startsWith('locations/')) {
      throw new Error('Location ID must start with "locations/"');
    }

    // Confirm
    log('\n📋 Review:', 'yellow');
    log(`   Company: ${selectedCompany.name}`);
    log(`   Company ID: ${selectedCompany.id}`);
    log(`   GMB Location ID: ${locationId}`);

    const confirm = await question('\nProceed with update? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      log('❌ Cancelled', 'red');
      await pool.end();
      rl.close();
      return;
    }

    // Update database
    log('\n💾 Updating database...', 'blue');
    const updated = await updateCompanyLocationId(pool, selectedCompany.id, locationId);
    log('✅ Company updated successfully!', 'green');

    log('\n🎉 GMB Location ID configured!', 'bright');
    log('\n📝 Next steps:', 'yellow');
    log('   1. Run database migration: npm run db:migrate', 'yellow');
    log('   2. Test vitals capture:', 'yellow');
    log(`      POST /api/onboarding/vitals/capture`, 'yellow');
    log(`      { "companyId": "${updated.id}", "options": { "includeGMB": true } }`, 'yellow');

    await pool.end();
    rl.close();
  } catch (error) {
    log(`\n💥 Error: ${error.message}`, 'red');
    rl.close();
    process.exit(1);
  }
}

main();
