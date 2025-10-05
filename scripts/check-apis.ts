#!/usr/bin/env node
/**
 * External API Connectivity Tests
 *
 * Validates connectivity and authentication for all external services.
 */

import axios from 'axios';

interface APICheckResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

async function checkSupabaseAPI(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.log('⚠️  Supabase credentials not configured');
    return false;
  }

  try {
    const response = await axios.get(`${url}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      timeout: 5000,
    });

    console.log('✅ Supabase API reachable');
    return true;
  } catch (error: any) {
    console.log(`❌ Supabase API unreachable: ${error.message}`);
    return false;
  }
}

async function checkGitHubAPI(): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.log('⚠️  GitHub token not configured (optional)');
    return true; // Not required
  }

  try {
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 5000,
    });

    console.log(`✅ GitHub API reachable (authenticated as: ${response.data.login})`);
    return true;
  } catch (error: any) {
    console.log(`❌ GitHub API authentication failed: ${error.message}`);
    return false;
  }
}

async function checkVercelAPI(): Promise<boolean> {
  const token = process.env.VERCEL_API_TOKEN;

  if (!token) {
    console.log('⚠️  Vercel API token not configured (optional)');
    return true; // Not required
  }

  try {
    const response = await axios.get('https://api.vercel.com/v2/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 5000,
    });

    console.log(`✅ Vercel API reachable (authenticated as: ${response.data.user.username})`);
    return true;
  } catch (error: any) {
    console.log(`❌ Vercel API authentication failed: ${error.message}`);
    return false;
  }
}

async function checkSEMrushAPI(): Promise<boolean> {
  const key = process.env.SEMRUSH_API_KEY;

  if (!key) {
    console.log('⚠️  SEMrush API key not configured (optional)');
    return true; // Not required
  }

  try {
    // Test SEMrush API with a simple domain overview request
    const response = await axios.get(`https://api.semrush.com/`, {
      params: {
        type: 'domain_ranks',
        key,
        export_columns: 'Db,Dn,Rk',
        domain: 'semrush.com',
        database: 'us',
      },
      timeout: 5000,
    });

    console.log('✅ SEMrush API reachable and authenticated');
    return true;
  } catch (error: any) {
    console.log(`❌ SEMrush API authentication failed: ${error.message}`);
    return false;
  }
}

async function checkInternetConnectivity(): Promise<boolean> {
  try {
    await axios.get('https://www.google.com', { timeout: 3000 });
    console.log('✅ Internet connectivity available');
    return true;
  } catch (error) {
    console.log('❌ No internet connectivity');
    return false;
  }
}

async function checkAllAPIs(): Promise<APICheckResult> {
  const result: APICheckResult = {
    success: true,
    errors: [],
    warnings: [],
  };

  console.log('🔍 Checking external API connectivity...\n');

  // Check internet first
  const hasInternet = await checkInternetConnectivity();
  if (!hasInternet) {
    result.errors.push('No internet connectivity - cannot test external APIs');
    result.success = false;
    return result;
  }

  console.log('');

  // Check required APIs
  const supabaseOk = await checkSupabaseAPI();
  if (!supabaseOk) {
    result.errors.push('Supabase API check failed');
    result.success = false;
  }

  // Check optional APIs (failures are warnings, not errors)
  const githubOk = await checkGitHubAPI();
  if (!githubOk && process.env.GITHUB_TOKEN) {
    result.warnings.push('GitHub API authentication failed');
  }

  const vercelOk = await checkVercelAPI();
  if (!vercelOk && process.env.VERCEL_API_TOKEN) {
    result.warnings.push('Vercel API authentication failed');
  }

  const semrushOk = await checkSEMrushAPI();
  if (!semrushOk && process.env.SEMRUSH_API_KEY) {
    result.warnings.push('SEMrush API authentication failed');
  }

  return result;
}

async function main() {
  const result = await checkAllAPIs();

  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    result.warnings.forEach((warning) => console.log(`   ${warning}`));
  }

  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:\n');
    result.errors.forEach((error) => console.log(`   ${error}`));
    console.log('\n💡 TIP: Check your internet connection and API credentials\n');
    process.exit(1);
  }

  console.log('\n✅ All required APIs are reachable!\n');
  process.exit(0);
}

main();
