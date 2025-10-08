/**
 * Environment Variable Validation
 * Validates required environment variables at startup
 * Prevents runtime crashes from missing configuration
 */

export interface EnvVar {
  key: string;
  description: string;
  required: boolean;
  validator?: (value: string) => boolean;
}

// Critical production environment variables
const ENV_VARS: EnvVar[] = [
  // Authentication
  { key: 'NEXTAUTH_SECRET', description: 'NextAuth JWT secret (32+ chars)', required: true, validator: (v) => v.length >= 32 },
  { key: 'NEXTAUTH_URL', description: 'NextAuth base URL', required: true, validator: (v) => v.startsWith('http') },
  { key: 'GOOGLE_OAUTH_CLIENT_ID', description: 'Google OAuth client ID', required: true },
  { key: 'GOOGLE_OAUTH_CLIENT_SECRET', description: 'Google OAuth client secret', required: true },

  // Database
  { key: 'DATABASE_URL', description: 'PostgreSQL connection URL (production)', required: false },
  { key: 'POSTGRES_URL', description: 'Alternative PostgreSQL URL (Vercel)', required: false },

  // AI Services
  { key: 'ANTHROPIC_API_KEY', description: 'Claude API key', required: false },
  { key: 'OPENAI_API_KEY', description: 'OpenAI API key', required: false },
  { key: 'PERPLEXITY_API_KEY', description: 'Perplexity API key', required: false },

  // SEO Tools
  { key: 'SEMRUSH_API_KEY', description: 'SEMrush API key', required: false },
  { key: 'GOOGLE_PAGESPEED_API_KEY', description: 'Google PageSpeed API key', required: false },
  { key: 'FIRECRAWL_API_KEY', description: 'Firecrawl web scraping key', required: false },

  // GitHub Integration
  { key: 'GITHUB_TOKEN', description: 'GitHub personal access token', required: false },
  { key: 'GITHUB_WEBHOOK_SECRET', description: 'GitHub webhook secret', required: false },

  // Email Service
  { key: 'EMAIL_PROVIDER', description: 'Email provider (resend/sendgrid)', required: false },
  { key: 'EMAIL_API_KEY', description: 'Email service API key', required: false },
  { key: 'EMAIL_FROM', description: 'From email address', required: false },

  // Monitoring & Analytics
  { key: 'SENTRY_DSN', description: 'Sentry error tracking DSN', required: false },
  { key: 'SENTRY_AUTH_TOKEN', description: 'Sentry auth token', required: false },

  // Rate Limiting (Future)
  { key: 'UPSTASH_REDIS_URL', description: 'Upstash Redis URL', required: false },
  { key: 'UPSTASH_REDIS_TOKEN', description: 'Upstash Redis token', required: false },
];

export interface ValidationResult {
  valid: boolean;
  missing: string[];
  invalid: string[];
  warnings: string[];
}

/**
 * Validate all environment variables
 * @param throwOnError - Throw error if validation fails (default: true)
 * @returns Validation result
 */
export function validateEnv(throwOnError = true): ValidationResult {
  const missing: string[] = [];
  const invalid: string[] = [];
  const warnings: string[] = [];

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.key];

    // Check if required variable is missing
    if (envVar.required && !value) {
      missing.push(`${envVar.key} - ${envVar.description}`);
      continue;
    }

    // Check if variable has invalid placeholder values
    if (value && (value === 'undefined' || value === 'null' || value === '')) {
      invalid.push(`${envVar.key} has invalid value: "${value}"`);
      continue;
    }

    // Run custom validator if provided
    if (value && envVar.validator && !envVar.validator(value)) {
      invalid.push(`${envVar.key} failed validation - ${envVar.description}`);
      continue;
    }

    // Warn about optional but commonly used variables
    if (!envVar.required && !value && isImportantOptional(envVar.key)) {
      warnings.push(`${envVar.key} not set - ${envVar.description}`);
    }
  }

  const result: ValidationResult = {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    warnings,
  };

  // Throw error if validation failed and throwOnError is true
  if (!result.valid && throwOnError) {
    const errorMessage = formatValidationError(result);
    throw new Error(errorMessage);
  }

  return result;
}

/**
 * Check if optional variable is commonly used
 */
function isImportantOptional(key: string): boolean {
  const important = [
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'SEMRUSH_API_KEY',
    'SENTRY_DSN',
    'DATABASE_URL',
  ];
  return important.includes(key);
}

/**
 * Format validation error message
 */
function formatValidationError(result: ValidationResult): string {
  const parts: string[] = ['\n❌ Environment Validation Failed\n'];

  if (result.missing.length > 0) {
    parts.push(`\n🔴 Missing Required Variables (${result.missing.length}):`);
    result.missing.forEach((msg) => parts.push(`  - ${msg}`));
  }

  if (result.invalid.length > 0) {
    parts.push(`\n🟡 Invalid Values (${result.invalid.length}):`);
    result.invalid.forEach((msg) => parts.push(`  - ${msg}`));
  }

  if (result.warnings.length > 0) {
    parts.push(`\n⚠️  Warnings (${result.warnings.length}):`);
    result.warnings.forEach((msg) => parts.push(`  - ${msg}`));
  }

  parts.push('\n📝 See .env.example for configuration template\n');

  return parts.join('\n');
}

/**
 * Log validation result
 */
export function logValidationResult(result: ValidationResult): void {
  if (result.valid) {
    console.log('✅ Environment variables validated successfully');

    if (result.warnings.length > 0) {
      console.warn(`\n⚠️  ${result.warnings.length} optional variables not set:`);
      result.warnings.forEach((msg) => console.warn(`  - ${msg}`));
    }
  } else {
    console.error(formatValidationError(result));
  }
}

/**
 * Validate on module import (development only)
 * In production, validation happens in middleware or app initialization
 */
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  try {
    const result = validateEnv(false);
    if (!result.valid || result.warnings.length > 0) {
      logValidationResult(result);
    }
  } catch (error) {
    // Silent fail in development
  }
}
