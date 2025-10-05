#!/usr/bin/env node
/**
 * Environment Variable Checker
 *
 * Validates that all required environment variables are present and properly formatted.
 * Run this before starting the application to catch configuration issues early.
 */

import * as fs from 'fs';
import * as path from 'path';

interface EnvVariable {
  name: string;
  required: boolean;
  description: string;
  pattern?: RegExp;
  example?: string;
}

const ENV_VARIABLES: EnvVariable[] = [
  // Required variables
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    pattern: /^https:\/\/[a-z]{20}\.supabase\.co$/,
    example: 'https://abcdefghijklmnopqrst.supabase.co',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous (public) key',
    pattern: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    example: 'eyJhbGci...rest_of_jwt_token',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase service role key (secret)',
    pattern: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    example: 'eyJhbGci...rest_of_jwt_token',
  },
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL database connection string',
    pattern: /^postgres(ql)?:\/\/.+/,
    example: 'postgresql://user:password@host:5432/database',
  },
  {
    name: 'SECRETS_MASTER_KEY',
    required: true,
    description: 'Master encryption key for secrets vault',
    pattern: /^[A-Za-z0-9+/=]{32,}$/,
    example: 'base64_encoded_32_byte_key',
  },

  // Optional but recommended variables
  {
    name: 'GITHUB_TOKEN',
    required: false,
    description: 'GitHub Personal Access Token for API access',
    pattern: /^(ghp_|github_pat_)[A-Za-z0-9]{36,}$/,
    example: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz',
  },
  {
    name: 'SEMRUSH_API_KEY',
    required: false,
    description: 'SEMrush API key for SEO data',
    example: 'your_semrush_api_key_here',
  },
  {
    name: 'VERCEL_API_TOKEN',
    required: false,
    description: 'Vercel API token for deployment management',
    pattern: /^[A-Za-z0-9]{24}$/,
    example: 'AbCdEfGhIjKlMnOpQrStUvWx',
  },
  {
    name: 'NEXTAUTH_SECRET',
    required: false,
    description: 'NextAuth.js secret for session encryption',
    pattern: /^[A-Za-z0-9+/=]{32,}$/,
    example: 'base64_encoded_random_secret',
  },
  {
    name: 'NEXTAUTH_URL',
    required: false,
    description: 'NextAuth.js canonical URL',
    pattern: /^https?:\/\/.+/,
    example: 'https://yourdomain.com',
  },
];

interface CheckResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

function checkEnvironmentVariables(): CheckResult {
  const result: CheckResult = {
    success: true,
    errors: [],
    warnings: [],
  };

  console.log('🔍 Checking environment variables...\n');

  // Load .env file if it exists
  const envPath = path.join(process.cwd(), '.env');
  const envLocalPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath) && !fs.existsSync(envLocalPath)) {
    result.errors.push('No .env or .env.local file found');
    result.success = false;
  }

  for (const envVar of ENV_VARIABLES) {
    const value = process.env[envVar.name];

    if (!value) {
      if (envVar.required) {
        result.errors.push(
          `❌ MISSING REQUIRED: ${envVar.name}\n   Description: ${envVar.description}${
            envVar.example ? `\n   Example: ${envVar.example}` : ''
          }`
        );
        result.success = false;
      } else {
        result.warnings.push(
          `⚠️  MISSING OPTIONAL: ${envVar.name}\n   Description: ${envVar.description}${
            envVar.example ? `\n   Example: ${envVar.example}` : ''
          }`
        );
      }
      continue;
    }

    // Validate pattern if provided
    if (envVar.pattern && !envVar.pattern.test(value)) {
      result.errors.push(
        `❌ INVALID FORMAT: ${envVar.name}\n   Expected pattern: ${envVar.pattern}\n   Example: ${
          envVar.example || 'See documentation'
        }`
      );
      result.success = false;
      continue;
    }

    // Check for placeholder values
    if (
      value.includes('your_') ||
      value.includes('YOUR_') ||
      value.includes('example') ||
      value.includes('EXAMPLE') ||
      value.includes('changeme') ||
      value.includes('CHANGEME')
    ) {
      result.errors.push(
        `❌ PLACEHOLDER VALUE: ${envVar.name}\n   Current value appears to be a placeholder: ${value.substring(
          0,
          20
        )}...`
      );
      result.success = false;
      continue;
    }

    console.log(`✅ ${envVar.name}`);
  }

  return result;
}

function main() {
  const result = checkEnvironmentVariables();

  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    result.warnings.forEach((warning) => console.log(warning + '\n'));
  }

  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:\n');
    result.errors.forEach((error) => console.log(error + '\n'));
    console.log('\n💡 TIP: Copy .env.example to .env and fill in the required values\n');
    process.exit(1);
  }

  console.log('\n✅ All required environment variables are present and valid!\n');
  process.exit(0);
}

main();
