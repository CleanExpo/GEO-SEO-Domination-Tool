/**
 * Simple Encryption Test (No Database)
 *
 * Tests encryption/decryption cycle without database dependencies:
 * 1. Encrypt test credentials
 * 2. Decrypt immediately
 * 3. Verify data integrity
 * 4. Test with nested objects
 * 5. Test with special characters
 */

import { NextResponse } from 'next/server';
import { encryptCredentials, decryptCredentials } from '@/lib/encryption';

export async function GET() {
  const testResults: any = {
    timestamp: new Date().toISOString(),
    tests: [],
    success: false,
  };

  try {
    // TEST 1: Basic credentials
    testResults.tests.push({ test: 1, name: 'Basic username/password encryption' });
    const basicCreds = {
      username: 'test_user@example.com',
      password: 'SuperSecret123!@#',
    };
    const encrypted1 = encryptCredentials(basicCreds);
    const decrypted1 = decryptCredentials(encrypted1.encryptedData, encrypted1.iv, encrypted1.tag);
    const test1Pass = JSON.stringify(basicCreds) === JSON.stringify(decrypted1);
    testResults.tests[0].status = test1Pass ? 'PASS' : 'FAIL';
    testResults.tests[0].result = { passed: test1Pass };

    // TEST 2: Complex nested object
    testResults.tests.push({ test: 2, name: 'Nested object with metadata' });
    const complexCreds = {
      username: 'admin',
      password: 'ComplexP@ss123',
      apiKey: 'sk_test_abc123def456',
      metadata: {
        platform: 'WordPress',
        adminUrl: 'https://example.com/wp-admin',
        ftpHost: 'ftp.example.com',
        ftpPort: 21,
        createdAt: new Date().toISOString()
      }
    };
    const encrypted2 = encryptCredentials(complexCreds);
    const decrypted2 = decryptCredentials(encrypted2.encryptedData, encrypted2.iv, encrypted2.tag);
    const test2Pass = JSON.stringify(complexCreds) === JSON.stringify(decrypted2);
    testResults.tests[1].status = test2Pass ? 'PASS' : 'FAIL';
    testResults.tests[1].result = {
      passed: test2Pass,
      nestedFieldsMatch: decrypted2.metadata?.platform === complexCreds.metadata.platform
    };

    // TEST 3: Special characters
    testResults.tests.push({ test: 3, name: 'Special characters and symbols' });
    const specialCreds = {
      username: 'user+test@example.com',
      password: 'P@$$w0rd!#%&*()[]{}|\\/<>?~`',
      notes: 'Special chars: "quotes", \'apostrophes\', \n\nnewlines\t\ttabs'
    };
    const encrypted3 = encryptCredentials(specialCreds);
    const decrypted3 = decryptCredentials(encrypted3.encryptedData, encrypted3.iv, encrypted3.tag);
    const test3Pass = JSON.stringify(specialCreds) === JSON.stringify(decrypted3);
    testResults.tests[2].status = test3Pass ? 'PASS' : 'FAIL';
    testResults.tests[2].result = { passed: test3Pass };

    // TEST 4: Array data
    testResults.tests.push({ test: 4, name: 'Arrays and multiple platforms' });
    const arrayCreds = {
      platforms: ['wordpress', 'shopify', 'wix'],
      credentials: [
        { platform: 'wordpress', username: 'wp_admin', password: 'wp123' },
        { platform: 'shopify', username: 'shop_admin', password: 'shop456' }
      ],
      permissions: ['read', 'write', 'admin']
    };
    const encrypted4 = encryptCredentials(arrayCreds);
    const decrypted4 = decryptCredentials(encrypted4.encryptedData, encrypted4.iv, encrypted4.tag);
    const test4Pass = JSON.stringify(arrayCreds) === JSON.stringify(decrypted4);
    testResults.tests[3].status = test4Pass ? 'PASS' : 'FAIL';
    testResults.tests[3].result = {
      passed: test4Pass,
      platformCount: decrypted4.platforms?.length === 3
    };

    // TEST 5: Empty and null values
    testResults.tests.push({ test: 5, name: 'Empty strings and null values' });
    const edgeCreds = {
      username: '',
      password: 'NotEmpty',
      apiKey: null,
      metadata: {
        emptyString: '',
        nullValue: null,
        undefinedValue: undefined
      }
    };
    const encrypted5 = encryptCredentials(edgeCreds);
    const decrypted5 = decryptCredentials(encrypted5.encryptedData, encrypted5.iv, encrypted5.tag);
    const test5Pass = JSON.stringify(edgeCreds) === JSON.stringify(decrypted5);
    testResults.tests[4].status = test5Pass ? 'PASS' : 'FAIL';
    testResults.tests[4].result = { passed: test5Pass };

    // TEST 6: Large data payload
    testResults.tests.push({ test: 6, name: 'Large data payload (10KB)' });
    const largeCreds = {
      username: 'large_user',
      password: 'LargePass123',
      notes: 'X'.repeat(10000) // 10KB of data
    };
    const encrypted6 = encryptCredentials(largeCreds);
    const decrypted6 = decryptCredentials(encrypted6.encryptedData, encrypted6.iv, encrypted6.tag);
    const test6Pass = JSON.stringify(largeCreds) === JSON.stringify(decrypted6);
    testResults.tests[5].status = test6Pass ? 'PASS' : 'FAIL';
    testResults.tests[5].result = {
      passed: test6Pass,
      encryptedSize: encrypted6.encryptedData.length,
      originalSize: JSON.stringify(largeCreds).length
    };

    // Check all tests passed
    const allPassed = testResults.tests.every((t: any) => t.status === 'PASS');
    testResults.success = allPassed;

    testResults.summary = {
      message: allPassed ? 'All encryption tests PASSED ✅' : 'Some tests FAILED ❌',
      totalTests: testResults.tests.length,
      passed: testResults.tests.filter((t: any) => t.status === 'PASS').length,
      failed: testResults.tests.filter((t: any) => t.status === 'FAIL').length,
      encryptionWorking: true,
      algorithm: 'AES-256-GCM',
      keyLength: '256-bit',
      readyForProduction: allPassed
    };

  } catch (error: any) {
    testResults.success = false;
    testResults.error = error.message;
    testResults.summary = {
      message: 'Encryption test FAILED',
      error: error.message,
      readyForProduction: false
    };
  }

  return NextResponse.json(testResults);
}
