#!/usr/bin/env node

/**
 * Test Post-Audit Automation Setup
 *
 * Verifies:
 * 1. Database tables exist
 * 2. Encryption key is configured
 * 3. Encryption/decryption works
 * 4. Supabase connection is working
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('');
  log('═'.repeat(80), 'cyan');
  log(`  ${title}`, 'bright');
  log('═'.repeat(80), 'cyan');
}

// Test encryption/decryption
function testEncryption(encryptionKey) {
  try {
    const key = Buffer.from(encryptionKey, 'base64');

    if (key.length !== 32) {
      throw new Error('Encryption key must be 32 bytes (256 bits)');
    }

    // Encrypt test data
    const testData = 'test_password_12345';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(testData, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    const encryptedString = `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;

    // Decrypt test data
    const [ivBase64, authTagBase64, ciphertext] = encryptedString.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivBase64, 'base64'));
    decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'));

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    if (decrypted !== testData) {
      throw new Error('Decrypted data does not match original');
    }

    return { success: true, encryptedString };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  log('\n🚀 Post-Audit Automation Setup Test', 'bright');
  log('Testing database, encryption, and Supabase connection\n', 'cyan');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  // ===================================
  // Test 1: Environment Variables
  // ===================================
  section('Test 1: Environment Variables');

  totalTests++;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const encryptionKey = process.env.CREDENTIALS_ENCRYPTION_KEY;

  if (supabaseUrl && supabaseKey) {
    log('✅ Supabase credentials found', 'green');
    log(`   URL: ${supabaseUrl}`, 'cyan');
    passedTests++;
  } else {
    log('❌ Supabase credentials missing', 'red');
    log('   Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local', 'yellow');
    failedTests++;
  }

  totalTests++;
  if (encryptionKey) {
    log('✅ Encryption key found', 'green');
    log(`   Key length: ${Buffer.from(encryptionKey, 'base64').length} bytes`, 'cyan');
    passedTests++;
  } else {
    log('❌ Encryption key missing', 'red');
    log('   Generate with: openssl rand -base64 32', 'yellow');
    log('   Add to .env.local: CREDENTIALS_ENCRYPTION_KEY="..."', 'yellow');
    failedTests++;
  }

  // ===================================
  // Test 2: Encryption/Decryption
  // ===================================
  section('Test 2: Encryption/Decryption');

  totalTests++;
  if (encryptionKey) {
    const result = testEncryption(encryptionKey);

    if (result.success) {
      log('✅ Encryption/decryption working', 'green');
      log(`   Test encrypted: ${result.encryptedString.substring(0, 50)}...`, 'cyan');
      passedTests++;
    } else {
      log('❌ Encryption/decryption failed', 'red');
      log(`   Error: ${result.error}`, 'yellow');
      failedTests++;
    }
  } else {
    log('⏭️  Skipped (no encryption key)', 'yellow');
  }

  // ===================================
  // Test 3: Supabase Connection
  // ===================================
  section('Test 3: Supabase Connection');

  totalTests++;
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // Test connection by querying companies table
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .limit(1);

      if (error) {
        log('❌ Supabase connection failed', 'red');
        log(`   Error: ${error.message}`, 'yellow');
        failedTests++;
      } else {
        log('✅ Supabase connection working', 'green');
        if (data && data.length > 0) {
          log(`   Test query returned: ${data[0].name || data[0].id}`, 'cyan');
        }
        passedTests++;
      }
    } catch (error) {
      log('❌ Supabase connection error', 'red');
      log(`   Error: ${error.message}`, 'yellow');
      failedTests++;
    }
  } else {
    log('⏭️  Skipped (no Supabase credentials)', 'yellow');
  }

  // ===================================
  // Test 4: Database Tables
  // ===================================
  section('Test 4: Database Tables');

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const tablesToCheck = [
      'website_credentials',
      'agent_tasks',
      'task_execution_logs',
      'task_templates',
      'credentials_access_log',
      'automation_rules'
    ];

    for (const table of tablesToCheck) {
      totalTests++;
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          if (error.message.includes('does not exist')) {
            log(`❌ Table '${table}' does not exist`, 'red');
            log(`   Run migration: See EXECUTE_MIGRATION_NOW.md`, 'yellow');
          } else {
            log(`❌ Error checking '${table}': ${error.message}`, 'red');
          }
          failedTests++;
        } else {
          log(`✅ Table '${table}' exists (${count || 0} rows)`, 'green');
          passedTests++;
        }
      } catch (err) {
        log(`❌ Error checking '${table}': ${err.message}`, 'red');
        failedTests++;
      }
    }
  } else {
    log('⏭️  Skipped (no Supabase credentials)', 'yellow');
  }

  // ===================================
  // Test 5: Type Definitions
  // ===================================
  section('Test 5: Type Definitions');

  totalTests++;
  try {
    const fs = await import('fs');
    const typesExist = fs.existsSync('types/post-audit-automation.ts');

    if (typesExist) {
      const typesContent = fs.readFileSync('types/post-audit-automation.ts', 'utf8');
      const interfaceCount = (typesContent.match(/export interface/g) || []).length;

      log('✅ Type definitions exist', 'green');
      log(`   ${interfaceCount} interfaces defined`, 'cyan');
      passedTests++;
    } else {
      log('❌ Type definitions missing', 'red');
      log('   Expected file: types/post-audit-automation.ts', 'yellow');
      failedTests++;
    }
  } catch (error) {
    log('❌ Error checking type definitions', 'red');
    log(`   Error: ${error.message}`, 'yellow');
    failedTests++;
  }

  // ===================================
  // Test 6: Utility Files
  // ===================================
  section('Test 6: Utility Files');

  const utilFiles = [
    { path: 'lib/crypto-credentials.ts', name: 'Encryption utilities' },
    { path: 'lib/audit-to-task-mapper.ts', name: 'Audit-to-task mapper' }
  ];

  for (const file of utilFiles) {
    totalTests++;
    try {
      const fs = await import('fs');
      const exists = fs.existsSync(file.path);

      if (exists) {
        log(`✅ ${file.name} exists`, 'green');
        log(`   File: ${file.path}`, 'cyan');
        passedTests++;
      } else {
        log(`❌ ${file.name} missing`, 'red');
        log(`   Expected: ${file.path}`, 'yellow');
        failedTests++;
      }
    } catch (error) {
      log(`❌ Error checking ${file.name}`, 'red');
      failedTests++;
    }
  }

  // ===================================
  // Summary
  // ===================================
  section('Test Summary');

  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  log(`Total tests: ${totalTests}`, 'cyan');
  log(`✅ Passed: ${passedTests}`, 'green');
  log(`❌ Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log(`Pass rate: ${passRate}%`, passRate === 100 ? 'green' : 'yellow');

  console.log('');

  if (passRate === 100) {
    log('🎉 All tests passed! Post-audit automation is ready to use.', 'green');
    log('\n📝 Next steps:', 'blue');
    log('   1. Build credentials API endpoint: POST /api/companies/[id]/credentials', 'cyan');
    log('   2. Build task creation endpoint: POST /api/agent-tasks/create-from-audit', 'cyan');
    log('   3. Build task execution endpoint: POST /api/agent-tasks/[id]/execute', 'cyan');
    log('   4. Build UI components for credential management', 'cyan');
  } else if (passRate >= 70) {
    log('⚠️  Most tests passed, but some issues need attention.', 'yellow');
    log('\n📝 Review failed tests above and address them.', 'yellow');
  } else {
    log('❌ Many tests failed. Please review and fix issues.', 'red');
    log('\n📝 Start with:', 'yellow');
    if (!supabaseUrl || !supabaseKey) {
      log('   1. Add Supabase credentials to .env.local', 'cyan');
    }
    if (!encryptionKey) {
      log('   2. Generate and add encryption key: openssl rand -base64 32', 'cyan');
    }
    log('   3. Run database migration: See EXECUTE_MIGRATION_NOW.md', 'cyan');
  }

  console.log('');
  log('═'.repeat(80), 'cyan');

  process.exit(failedTests > 0 ? 1 : 0);
}

main().catch(error => {
  log(`\n💥 Test script failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
