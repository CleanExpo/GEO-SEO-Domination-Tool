/**
 * Test Encryption Flow
 *
 * Tests the complete credential storage flow:
 * 1. Encrypt test credentials
 * 2. Store in database
 * 3. Retrieve from database
 * 4. Decrypt and verify
 * 5. Clean up test data
 */

import { NextResponse } from 'next/server';
import { encryptCredentials, decryptCredentials } from '@/lib/encryption';
import { createClient } from '@supabase/supabase-js';

// Use service role client to bypass RLS policies for testing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET() {
  const testResults: any = {
    timestamp: new Date().toISOString(),
    steps: [],
    success: false,
  };

  try {
    // STEP 1: Encrypt test credentials
    testResults.steps.push({ step: 1, name: 'Encrypt test credentials' });
    const testCredentials = {
      username: 'test_user',
      password: 'test_password_123',
      apiKey: 'test_api_key_abc',
      metadata: {
        platform: 'test_platform',
        createdAt: new Date().toISOString()
      }
    };

    const encrypted = encryptCredentials(testCredentials);
    testResults.steps[0].status = 'success';
    testResults.steps[0].result = {
      hasEncryptedData: !!encrypted.encryptedData,
      hasIV: !!encrypted.iv,
      hasTag: !!encrypted.tag
    };

    // STEP 2: Test decryption immediately (without DB)
    testResults.steps.push({ step: 2, name: 'Test immediate decryption' });
    const decrypted = decryptCredentials(encrypted.encryptedData, encrypted.iv, encrypted.tag);

    const dataMatches = JSON.stringify(testCredentials) === JSON.stringify(decrypted);
    testResults.steps[1].status = dataMatches ? 'success' : 'failed';
    testResults.steps[1].result = {
      dataMatches,
      originalKeys: Object.keys(testCredentials),
      decryptedKeys: Object.keys(decrypted)
    };

    if (!dataMatches) {
      throw new Error('Decrypted data does not match original');
    }

    // STEP 3: Store in database (test company)
    testResults.steps.push({ step: 3, name: 'Store encrypted credentials in database' });

    // Check if test company exists, create if not
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('name', 'ENCRYPTION_TEST_COMPANY')
      .single();

    let testCompanyId: string;

    if (existingCompany) {
      testCompanyId = existingCompany.id;
    } else {
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: 'ENCRYPTION_TEST_COMPANY',
          website: 'https://encryption-test.example.com',
          address: 'Test Address',
          city: 'Test City',
          state: 'Test State',
          zip: '12345',
          phone: '555-0000'
        })
        .select('id')
        .single();

      if (companyError) {
        throw new Error(`Failed to create test company: ${companyError.message}`);
      }

      testCompanyId = newCompany!.id;
    }

    // Delete any existing test credentials
    await supabase
      .from('client_credentials')
      .delete()
      .eq('company_id', testCompanyId)
      .eq('platform_name', 'ENCRYPTION_TEST');

    // Insert encrypted credentials
    const { data: insertedCred, error: insertError } = await supabase
      .from('client_credentials')
      .insert({
        company_id: testCompanyId,
        platform_type: 'website_cms',
        platform_name: 'ENCRYPTION_TEST',
        encrypted_data: encrypted.encryptedData,
        encryption_iv: encrypted.iv,
        encryption_tag: encrypted.tag,
        credential_type: 'username_password',
        status: 'active'
      })
      .select('id')
      .single();

    if (insertError) {
      throw new Error(`Failed to insert credentials: ${insertError.message}`);
    }

    testResults.steps[2].status = 'success';
    testResults.steps[2].result = {
      credentialId: insertedCred!.id,
      companyId: testCompanyId
    };

    // STEP 4: Retrieve and decrypt from database
    testResults.steps.push({ step: 4, name: 'Retrieve and decrypt from database' });

    const { data: retrievedCred, error: retrieveError } = await supabase
      .from('client_credentials')
      .select('encrypted_data, encryption_iv, encryption_tag')
      .eq('id', insertedCred!.id)
      .single();

    if (retrieveError) {
      throw new Error(`Failed to retrieve credentials: ${retrieveError.message}`);
    }

    const decryptedFromDB = decryptCredentials(
      retrievedCred!.encrypted_data,
      retrievedCred!.encryption_iv,
      retrievedCred!.encryption_tag
    );

    const dbDataMatches = JSON.stringify(testCredentials) === JSON.stringify(decryptedFromDB);
    testResults.steps[3].status = dbDataMatches ? 'success' : 'failed';
    testResults.steps[3].result = {
      dataMatches: dbDataMatches,
      usernameMatches: decryptedFromDB.username === testCredentials.username,
      passwordMatches: decryptedFromDB.password === testCredentials.password,
      apiKeyMatches: decryptedFromDB.apiKey === testCredentials.apiKey
    };

    if (!dbDataMatches) {
      throw new Error('Decrypted data from DB does not match original');
    }

    // STEP 5: Clean up test data
    testResults.steps.push({ step: 5, name: 'Clean up test data' });

    await supabase
      .from('client_credentials')
      .delete()
      .eq('id', insertedCred!.id);

    testResults.steps[4].status = 'success';
    testResults.steps[4].result = { cleaned: true };

    // All steps passed
    testResults.success = true;
    testResults.summary = {
      message: 'Full encryption flow test PASSED',
      encryptionWorking: true,
      databaseStorageWorking: true,
      decryptionWorking: true,
      readyForProduction: true
    };

  } catch (error: any) {
    testResults.success = false;
    testResults.error = error.message;
    testResults.summary = {
      message: 'Encryption flow test FAILED',
      error: error.message,
      readyForProduction: false
    };
  }

  return NextResponse.json(testResults);
}
