#!/usr/bin/env node

/**
 * Check Companies Table Schema
 */

const BASE_URL = 'https://geo-seo-domination-tool.vercel.app';

async function checkSchema() {
  console.log('\n🔍 Checking companies table schema on production...\n');

  try {
    // Try to query the companies table to see what columns exist
    const response = await fetch(`${BASE_URL}/api/companies?limit=1`);

    console.log(`Response Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      if (data.companies && data.companies.length > 0) {
        console.log('\n📋 Company record structure:');
        console.log(JSON.stringify(data.companies[0], null, 2));
        console.log('\n📊 Available columns:', Object.keys(data.companies[0]).join(', '));
      } else {
        console.log('\n⚠️  No companies found in database');
      }
    } else {
      console.log('❌ Failed to fetch companies');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema();
