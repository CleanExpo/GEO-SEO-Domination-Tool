/**
 * Environment Variable Validator
 * Validates and provides type-safe access to environment variables
 */

export interface EnvironmentConfig {
  // Database
  supabaseUrl: string;
  supabaseAnonKey: string;

  // External APIs (optional)
  googleApiKey?: string;
  firecrawlApiKey?: string;
  anthropicApiKey?: string;
  semrushApiKey?: string;
  perplexityApiKey?: string;

  // App config
  appUrl: string;
  nodeEnv: string;
}

class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private config: EnvironmentConfig;
  private errors: string[] = [];
  private warnings: string[] = [];

  private constructor() {
    this.config = this.loadAndValidate();
    // Only log in development, not during build
    if (process.env.NODE_ENV !== 'production' && typeof window === 'undefined') {
      this.logStatus();
    }
  }

  public static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  private loadAndValidate(): EnvironmentConfig {
    // Required variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      this.errors.push('NEXT_PUBLIC_SUPABASE_URL is not configured');
    }

    if (!supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
      this.errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured');
    }

    // Optional API keys
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    const semrushApiKey = process.env.SEMRUSH_API_KEY;
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;

    if (!googleApiKey) {
      this.warnings.push('GOOGLE_API_KEY not set - Lighthouse features disabled');
    }

    if (!firecrawlApiKey) {
      this.warnings.push('FIRECRAWL_API_KEY not set - Advanced scraping disabled');
    }

    if (!anthropicApiKey) {
      this.warnings.push('ANTHROPIC_API_KEY not set - AI analysis features disabled');
    }

    if (!semrushApiKey) {
      this.warnings.push('SEMRUSH_API_KEY not set - Competitor analysis disabled');
    }

    if (!perplexityApiKey) {
      this.warnings.push('PERPLEXITY_API_KEY not set - AI search disabled');
    }

    return {
      supabaseUrl: supabaseUrl || '',
      supabaseAnonKey: supabaseAnonKey || '',
      googleApiKey,
      firecrawlApiKey,
      anthropicApiKey,
      semrushApiKey,
      perplexityApiKey,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      nodeEnv: process.env.NODE_ENV || 'development',
    };
  }

  private logStatus(): void {
    if (this.errors.length > 0) {
      console.error('❌ Environment Configuration Errors:');
      this.errors.forEach(error => console.error(`  - ${error}`));
    }

    if (this.warnings.length > 0) {
      console.warn('⚠ Environment Configuration Warnings:');
      this.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All environment variables configured correctly');
    }
  }

  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  public hasErrors(): boolean {
    return this.errors.length > 0;
  }

  public getErrors(): string[] {
    return this.errors;
  }

  public getWarnings(): string[] {
    return this.warnings;
  }

  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  public isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  // Feature flags based on API availability
  public canUseLighthouse(): boolean {
    return !!this.config.googleApiKey;
  }

  public canUseFirecrawl(): boolean {
    return !!this.config.firecrawlApiKey;
  }

  public canUseAI(): boolean {
    return !!this.config.anthropicApiKey;
  }

  public canUseSEMrush(): boolean {
    return !!this.config.semrushApiKey;
  }

  public canUsePerplexity(): boolean {
    return !!this.config.perplexityApiKey;
  }
}

// Export singleton instance
export const envValidator = EnvironmentValidator.getInstance();
export const env = envValidator.getConfig();
