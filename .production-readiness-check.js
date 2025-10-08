#!/usr/bin/env node

/**
 * Production Readiness Check for GEO-SEO Domination Tool
 * Comprehensive validation of build status, APIs, database, and routes
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class ProductionReadinessChecker {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
    };
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  pass(component, message) {
    this.results.passed.push({ component, message });
    this.log(`✅ ${component}: ${message}`, colors.green);
  }

  fail(component, message, details = '') {
    this.results.failed.push({ component, message, details });
    this.log(`❌ ${component}: ${message}`, colors.red);
    if (details) {
      this.log(`   ${details}`, colors.yellow);
    }
  }

  warn(component, message) {
    this.results.warnings.push({ component, message });
    this.log(`🔧 ${component}: ${message}`, colors.yellow);
  }

  // Check 1: Environment Variables
  checkEnvironmentVariables() {
    this.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
    this.log('1. Environment Variables Check', colors.cyan + colors.bright);
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);

    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'ANTHROPIC_API_KEY',
      'POSTGRES_URL',
    ];

    const optionalVars = [
      'OPENAI_API_KEY',
      'PERPLEXITY_API_KEY',
      'SEMRUSH_API_KEY',
      'FIRECRAWL_API_KEY',
      'GOOGLE_API_KEY',
      'EMAIL_PROVIDER',
      'EMAIL_API_KEY',
      'EMAIL_FROM',
    ];

    // Load .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
      this.fail('Environment', '.env.local file not found');
      return;
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.+)$/);
      if (match) {
        envVars[match[1].trim()] = match[2].trim();
      }
    });

    // Check required variables
    let allRequired = true;
    requiredVars.forEach(varName => {
      if (envVars[varName] && !envVars[varName].includes('your_') && !envVars[varName].includes('placeholder')) {
        this.pass('Required ENV', `${varName} is set`);
      } else {
        this.fail('Required ENV', `${varName} is missing or has placeholder value`);
        allRequired = false;
      }
    });

    // Check optional variables
    optionalVars.forEach(varName => {
      if (envVars[varName] && !envVars[varName].includes('your_') && !envVars[varName].includes('placeholder')) {
        this.pass('Optional ENV', `${varName} is set`);
      } else {
        this.warn('Optional ENV', `${varName} is not configured (optional)`);
      }
    });

    return allRequired;
  }

  // Check 2: Next.js Configuration
  checkNextConfig() {
    this.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
    this.log('2. Next.js Configuration Check', colors.cyan + colors.bright);
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);

    const configPath = path.join(process.cwd(), 'next.config.js');
    if (!fs.existsSync(configPath)) {
      this.fail('Next.js Config', 'next.config.js not found');
      return false;
    }

    this.pass('Next.js Config', 'next.config.js exists');

    const configContent = fs.readFileSync(configPath, 'utf-8');

    // Check for critical settings
    if (configContent.includes("output: 'standalone'")) {
      this.pass('Next.js Config', 'Standalone output configured for production');
    } else {
      this.warn('Next.js Config', 'Standalone output not configured');
    }

    if (configContent.includes('reactStrictMode: true')) {
      this.pass('Next.js Config', 'React strict mode enabled');
    }

    return true;
  }

  // Check 3: Database Files
  checkDatabaseFiles() {
    this.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
    this.log('3. Database Configuration Check', colors.cyan + colors.bright);
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);

    const dbFiles = [
      'lib/db.ts',
      'database/init.ts',
      'database/schema.sql',
    ];

    let allExist = true;
    dbFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        this.pass('Database Files', `${file} exists`);
      } else {
        this.fail('Database Files', `${file} not found`);
        allExist = false;
      }
    });

    // Check data directory
    const dataDir = path.join(process.cwd(), 'data');
    if (fs.existsSync(dataDir)) {
      this.pass('Database', 'data directory exists');
    } else {
      this.warn('Database', 'data directory does not exist (SQLite only)');
    }

    return allExist;
  }

  // Check 4: Route Files
  checkRoutes() {
    this.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
    this.log('4. Route Files Check', colors.cyan + colors.bright);
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);

    const criticalRoutes = [
      'app/page.tsx',
      'app/dashboard/page.tsx',
      'app/companies/page.tsx',
      'app/login/page.tsx',
      'app/layout.tsx',
    ];

    let allExist = true;
    criticalRoutes.forEach(route => {
      const routePath = path.join(process.cwd(), route);
      if (fs.existsSync(routePath)) {
        this.pass('Routes', `${route} exists`);
      } else {
        this.fail('Routes', `${route} not found`);
        allExist = false;
      }
    });

    // Count total pages
    const appDir = path.join(process.cwd(), 'app');
    const pageFiles = this.findFiles(appDir, 'page.tsx');
    this.pass('Routes', `Found ${pageFiles.length} page files total`);

    return allExist;
  }

  // Check 5: TypeScript Configuration
  checkTypeScriptConfig() {
    this.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
    this.log('5. TypeScript Configuration Check', colors.cyan + colors.bright);
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);

    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
      this.fail('TypeScript', 'tsconfig.json not found');
      return false;
    }

    this.pass('TypeScript', 'tsconfig.json exists');

    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

      if (tsconfig.compilerOptions) {
        this.pass('TypeScript', 'Compiler options configured');

        if (tsconfig.compilerOptions.strict) {
          this.pass('TypeScript', 'Strict mode enabled');
        } else {
          this.warn('TypeScript', 'Strict mode not enabled');
        }
      }
    } catch (error) {
      this.fail('TypeScript', 'Invalid tsconfig.json format');
      return false;
    }

    return true;
  }

  // Check 6: Package Dependencies
  checkDependencies() {
    this.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
    this.log('6. Package Dependencies Check', colors.cyan + colors.bright);
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);

    const packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) {
      this.fail('Dependencies', 'package.json not found');
      return false;
    }

    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

    const criticalDeps = [
      'next',
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'pg',
      'better-sqlite3',
    ];

    let allPresent = true;
    criticalDeps.forEach(dep => {
      if (pkg.dependencies && pkg.dependencies[dep]) {
        this.pass('Dependencies', `${dep} is installed`);
      } else {
        this.fail('Dependencies', `${dep} is missing`);
        allPresent = false;
      }
    });

    // Check for node_modules
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      this.pass('Dependencies', 'node_modules directory exists');
    } else {
      this.fail('Dependencies', 'node_modules not found - run npm install');
      allPresent = false;
    }

    return allPresent;
  }

  // Helper: Find files recursively
  findFiles(dir, filename) {
    let results = [];
    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          results = results.concat(this.findFiles(filePath, filename));
        } else if (file === filename) {
          results.push(filePath);
        }
      });
    } catch (error) {
      // Ignore errors (permission denied, etc.)
    }
    return results;
  }

  // Generate Report
  generateReport() {
    this.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
    this.log('📋 PRODUCTION READINESS REPORT', colors.cyan + colors.bright);
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);

    this.log(`✅ Passed: ${this.results.passed.length}`, colors.green);
    this.log(`❌ Failed: ${this.results.failed.length}`, colors.red);
    this.log(`🔧 Warnings: ${this.results.warnings.length}`, colors.yellow);

    const totalChecks = this.results.passed.length + this.results.failed.length;
    const passRate = totalChecks > 0 ? ((this.results.passed.length / totalChecks) * 100).toFixed(1) : 0;

    this.log(`\n📊 Pass Rate: ${passRate}%\n`, colors.blue);

    // Critical Failures
    if (this.results.failed.length > 0) {
      this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.red);
      this.log('❌ CRITICAL ISSUES TO FIX', colors.red + colors.bright);
      this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.red);

      this.results.failed.forEach(({ component, message, details }, index) => {
        this.log(`${index + 1}. [${component}] ${message}`, colors.red);
        if (details) {
          this.log(`   Fix: ${details}`, colors.yellow);
        }
      });
      this.log('');
    }

    // Warnings
    if (this.results.warnings.length > 0) {
      this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.yellow);
      this.log('🔧 RECOMMENDED IMPROVEMENTS', colors.yellow + colors.bright);
      this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.yellow);

      this.results.warnings.forEach(({ component, message }, index) => {
        this.log(`${index + 1}. [${component}] ${message}`, colors.yellow);
      });
      this.log('');
    }

    // Deployment Checklist
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
    this.log('📋 PRODUCTION DEPLOYMENT CHECKLIST', colors.blue + colors.bright);
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);

    const checklist = [
      '[ ] All environment variables set in Vercel/production',
      '[ ] Database initialized with npm run db:init',
      '[ ] Supabase RLS policies configured',
      '[ ] API keys tested and valid',
      '[ ] npm run build completes successfully',
      '[ ] TypeScript compilation passes',
      '[ ] All critical routes accessible',
      '[ ] Authentication flow tested',
      '[ ] Database migrations applied',
      '[ ] Error tracking configured (Sentry)',
    ];

    checklist.forEach(item => {
      this.log(item, colors.cyan);
    });

    this.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);

    // Overall Status
    if (this.results.failed.length === 0) {
      this.log('✅ READY FOR PRODUCTION', colors.green + colors.bright);
      return true;
    } else {
      this.log('❌ NOT READY - FIX CRITICAL ISSUES FIRST', colors.red + colors.bright);
      return false;
    }
  }

  // Run all checks
  async runAllChecks() {
    this.log('\n' + '='.repeat(50), colors.cyan);
    this.log('   GEO-SEO Domination Tool', colors.cyan + colors.bright);
    this.log('   Production Readiness Check', colors.cyan + colors.bright);
    this.log('='.repeat(50) + '\n', colors.cyan);

    this.checkEnvironmentVariables();
    this.checkNextConfig();
    this.checkDatabaseFiles();
    this.checkRoutes();
    this.checkTypeScriptConfig();
    this.checkDependencies();

    return this.generateReport();
  }
}

// Run the checker
async function main() {
  const checker = new ProductionReadinessChecker();
  const ready = await checker.runAllChecks();
  process.exit(ready ? 0 : 1);
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
