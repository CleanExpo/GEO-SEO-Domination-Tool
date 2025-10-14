/**
 * Check Companies in Database
 *
 * Quick script to verify companies exist in the database
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCompanies() {
  console.log('🔍 Checking companies in database...\n');

  try {
    // Fetch all companies
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, website, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching companies:', error.message);
      return;
    }

    if (!companies || companies.length === 0) {
      console.log('📭 No companies found in database');
      console.log('\nTo create a company, complete the onboarding form at:');
      console.log('http://localhost:3000/onboarding\n');
      return;
    }

    console.log(`✅ Found ${companies.length} companies:\n`);
    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   ID: ${company.id}`);
      console.log(`   Website: ${company.website}`);
      console.log(`   Created: ${new Date(company.created_at).toLocaleString()}`);
      console.log(`   SEO Audit URL: http://localhost:3000/companies/${company.id}/seo-audit`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkCompanies();
