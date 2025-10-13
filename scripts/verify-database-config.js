#!/usr/bin/env node

/**
 * Database Configuration Verification Script
 *
 * This script verifies that the database is properly configured for the current environment.
 *
 * Usage:
 *   node scripts/verify-database-config.js
 *
 * Checks:
 * 1. Environment variable detection
 * 2. Database type selection logic
 * 3. Connection string validation
 * 4. File paths (for SQLite)
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1];
        const value = match[2].replace(/^["']|["']$/g, ''); // Remove quotes
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
  console.log('📄 Loaded environment variables from .env.local\n');
}

console.log('🔍 Database Configuration Verification\n');
console.log('=' .repeat(60));

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');
console.log('  POSTGRES_URL:', process.env.POSTGRES_URL ? '✅ Set' : '❌ Not set');
console.log('  FORCE_LOCAL_DB:', process.env.FORCE_LOCAL_DB || '❌ Not set');
console.log('  USE_SQLITE:', process.env.USE_SQLITE || '❌ Not set');
console.log('  SQLITE_PATH:', process.env.SQLITE_PATH || '❌ Not set (will use default)');

// Detect database type using the same logic as lib/db.ts
console.log('\n🔧 Database Type Detection:');

const forceLocalDb = process.env.FORCE_LOCAL_DB === 'true' || process.env.USE_SQLITE === 'true';
const pgConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (forceLocalDb) {
  const sqlitePath = process.env.SQLITE_PATH || path.join(process.cwd(), 'data', 'geo-seo.db');
  console.log('  Type: SQLite (forced local)');
  console.log('  Path:', sqlitePath);

  // Check if SQLite directory exists
  const dbDir = path.dirname(sqlitePath);
  if (fs.existsSync(dbDir)) {
    console.log('  Directory: ✅ Exists');
  } else {
    console.log('  Directory: ⚠️  Does not exist (will be created on first use)');
  }

  // Check if SQLite database file exists
  if (fs.existsSync(sqlitePath)) {
    const stats = fs.statSync(sqlitePath);
    console.log('  Database file: ✅ Exists');
    console.log('  Size:', (stats.size / 1024).toFixed(2), 'KB');
  } else {
    console.log('  Database file: ⚠️  Does not exist (will be created on first use)');
  }
} else if (pgConnectionString) {
  console.log('  Type: PostgreSQL (production)');

  // Parse connection string
  try {
    const url = new URL(pgConnectionString);
    console.log('  Host:', url.hostname);
    console.log('  Port:', url.port || '5432');
    console.log('  Database:', url.pathname.slice(1));
    console.log('  User:', url.username);
    console.log('  Password:', url.password ? '***' + url.password.slice(-4) : '❌ Not set');
    console.log('  SSL:', url.searchParams.has('sslmode') ? '✅ Enabled' : '⚠️  Not specified (will auto-detect)');
  } catch (error) {
    console.log('  ❌ Invalid connection string format:', error.message);
  }
} else {
  const sqlitePath = process.env.SQLITE_PATH || path.join(process.cwd(), 'data', 'geo-seo.db');
  console.log('  Type: SQLite (fallback)');
  console.log('  Path:', sqlitePath);
  console.log('  ⚠️  No PostgreSQL connection string found');
}

// Environment-specific recommendations
console.log('\n💡 Recommendations:');

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const isProduction = process.env.NODE_ENV === 'production';

if (isVercel) {
  console.log('  🚀 Running on Vercel (serverless)');

  if (!pgConnectionString) {
    console.log('  ❌ ERROR: PostgreSQL connection string not found!');
    console.log('     Set DATABASE_URL or POSTGRES_URL in Vercel dashboard');
    process.exit(1);
  }

  if (forceLocalDb) {
    console.log('  ❌ ERROR: FORCE_LOCAL_DB or USE_SQLITE is set!');
    console.log('     Remove these variables from Vercel dashboard');
    process.exit(1);
  }

  console.log('  ✅ Configuration looks good for Vercel deployment');
} else if (isProduction) {
  console.log('  🌐 Production environment detected');

  if (!pgConnectionString) {
    console.log('  ⚠️  WARNING: No PostgreSQL connection string');
    console.log('     Using SQLite in production is not recommended');
  } else {
    console.log('  ✅ PostgreSQL configured for production');
  }
} else {
  console.log('  💻 Local development environment');

  if (forceLocalDb) {
    console.log('  ✅ SQLite forced for local development (good)');
  } else if (pgConnectionString) {
    console.log('  ⚠️  WARNING: PostgreSQL will be used');
    console.log('     Set FORCE_LOCAL_DB=true to use SQLite locally');
  } else {
    console.log('  ✅ SQLite will be used (fallback)');
  }
}

// Check lib/db.ts exists
console.log('\n📁 File Verification:');
const libDbPath = path.join(process.cwd(), 'lib', 'db.ts');
if (fs.existsSync(libDbPath)) {
  console.log('  lib/db.ts: ✅ Exists');
} else {
  console.log('  lib/db.ts: ❌ Missing (CRITICAL ERROR)');
  process.exit(1);
}

// Check database/init.ts exists
const dbInitPath = path.join(process.cwd(), 'database', 'init.ts');
if (fs.existsSync(dbInitPath)) {
  console.log('  database/init.ts: ✅ Exists (backward compatibility wrapper)');
} else {
  console.log('  database/init.ts: ❌ Missing');
}

console.log('\n' + '='.repeat(60));
console.log('✅ Database configuration verification complete!\n');

// Exit with success code
process.exit(0);
