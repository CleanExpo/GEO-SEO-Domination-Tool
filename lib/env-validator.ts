/**
 * Environment Variable Validator
 *
 * Validates required environment variables at application startup.
 * Prevents silent failures by detecting missing critical configuration.
 *
 * Usage: Call validateEnvironment() in instrumentation.ts register()
 */

export function validateEnvironment() {
  const isDatabaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  // Track validation results
  const warnings: string[] = [];
  const errors: string[] = [];

  // Production-only strict checks
  if (process.env.NODE_ENV === 'production') {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (!isDatabaseUrl) {
      missing.push('DATABASE_URL or POSTGRES_URL');
    }

    if (missing.length > 0) {
      const errorMsg = `Missing required environment variables in production: ${missing.join(', ')}`;
      console.error('[ENV VALIDATION]', errorMsg);
      errors.push(errorMsg);

      // Don't throw in production (allow graceful degradation)
      // But log prominently
      console.error('[ENV VALIDATION] ⚠️ Application may not function correctly!');
    }
  }

  // Development-only warnings
  if (process.env.NODE_ENV === 'development') {
    if (!isDatabaseUrl) {
      console.warn('[ENV VALIDATION] No DATABASE_URL found - using SQLite (development mode)');
    }

    if (!process.env.NEXTAUTH_SECRET) {
      warnings.push('NEXTAUTH_SECRET not set - authentication may fail');
    }
  }

  // Check for at least one AI service configured
  const aiServices = {
    qwen: process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    perplexity: process.env.PERPLEXITY_API_KEY,
    groq: process.env.GROQ_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
  };

  const configuredAI = Object.entries(aiServices)
    .filter(([_, key]) => key)
    .map(([name]) => name);

  if (configuredAI.length === 0) {
    warnings.push('No AI services configured - SEO analysis features will not work');
  }

  // Log configuration summary
  console.log('\n[ENV VALIDATION] ==========================================');
  console.log('[ENV VALIDATION] Environment Configuration Summary');
  console.log('[ENV VALIDATION] ==========================================');
  console.log(`[ENV VALIDATION] Environment:    ${process.env.NODE_ENV || 'development'}`);
  console.log(`[ENV VALIDATION] Database:       ${isDatabaseUrl ? 'PostgreSQL ✓' : 'SQLite (development)'}`);
  console.log(`[ENV VALIDATION] Supabase:       ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗'}`);
  console.log(`[ENV VALIDATION] NextAuth:       ${process.env.NEXTAUTH_SECRET ? '✓' : '✗'}`);
  console.log(`[ENV VALIDATION] Google OAuth:   ${process.env.GOOGLE_OAUTH_CLIENT_ID ? '✓' : '✗'}`);
  console.log(`[ENV VALIDATION] AI Services:    ${configuredAI.length > 0 ? configuredAI.join(', ') + ' ✓' : '✗'}`);
  console.log(`[ENV VALIDATION] Sentry:         ${process.env.NEXT_PUBLIC_SENTRY_DSN ? '✓' : '✗'}`);
  console.log(`[ENV VALIDATION] Firecrawl:      ${process.env.FIRECRAWL_API_KEY ? '✓' : '✗'}`);
  console.log('[ENV VALIDATION] ==========================================\n');

  // Log warnings
  if (warnings.length > 0) {
    console.warn('[ENV VALIDATION] Warnings:');
    warnings.forEach(warning => console.warn(`[ENV VALIDATION]   - ${warning}`));
  }

  // Log errors
  if (errors.length > 0) {
    console.error('[ENV VALIDATION] Errors:');
    errors.forEach(error => console.error(`[ENV VALIDATION]   - ${error}`));
  }

  // Return validation result
  return {
    valid: errors.length === 0,
    warnings,
    errors,
    config: {
      environment: process.env.NODE_ENV || 'development',
      database: isDatabaseUrl ? 'postgresql' : 'sqlite',
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      nextauth: !!process.env.NEXTAUTH_SECRET,
      oauth: !!process.env.GOOGLE_OAUTH_CLIENT_ID,
      ai: configuredAI,
      sentry: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
      firecrawl: !!process.env.FIRECRAWL_API_KEY,
    }
  };
}

/**
 * Validate specific environment variable
 */
export function validateVar(name: string, required: boolean = false): string | undefined {
  const value = process.env[name];

  if (!value && required) {
    throw new Error(`Required environment variable ${name} is not set`);
  }

  return value;
}

/**
 * Get environment variable with default value
 */
export function getEnvVar(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
}
