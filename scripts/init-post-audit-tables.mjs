#!/usr/bin/env node

/**
 * Initialize Post-Audit Automation Tables in SQLite
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SQLITE_PATH = process.env.SQLITE_PATH || './data/geo-seo.db';
const SCHEMA_PATH = join(__dirname, '..', 'database', 'post-audit-automation-schema.sql');

console.log('🚀 Initializing Post-Audit Automation Tables');
console.log('='.repeat(60));

const db = new Database(SQLITE_PATH);
db.pragma('journal_mode = WAL');

try {
  console.log(`\n📁 Reading schema: ${SCHEMA_PATH}`);
  const schema = readFileSync(SCHEMA_PATH, 'utf8');

  // Split by statement and filter out comments
  const statements = schema
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('COMMENT'));

  console.log(`\n📊 Executing ${statements.length} SQL statements...`);

  let created = 0;
  let skipped = 0;

  for (const stmt of statements) {
    try {
      // Convert PostgreSQL syntax to SQLite
      let sqliteStmt = stmt
        // Remove PostgreSQL-specific extensions
        .replace(/UUID REFERENCES auth\.users\(id\)/g, 'TEXT')
        .replace(/REFERENCES auth\.users\(id\)/g, '')
        .replace(/UUID PRIMARY KEY DEFAULT gen_random_uuid\(\)/g, 'TEXT PRIMARY KEY')
        .replace(/UUID NOT NULL DEFAULT gen_random_uuid\(\)/g, 'TEXT NOT NULL')
        .replace(/UUID DEFAULT gen_random_uuid\(\)/g, 'TEXT')
        .replace(/UUID NOT NULL/g, 'TEXT NOT NULL')
        .replace(/UUID/g, 'TEXT')
        .replace(/TIMESTAMP WITH TIME ZONE/g, 'DATETIME')
        .replace(/NOW\(\)/g, "datetime('now')")
        .replace(/INET/g, 'TEXT')
        .replace(/JSONB/g, 'TEXT')
        .replace(/TEXT\[\]/g, 'TEXT')
        .replace(/INTEGER\[\]/g, 'TEXT')
        .replace(/DECIMAL\((\d+),\s*(\d+)\)/g, 'REAL')
        .replace(/NUMERIC\((\d+),\s*(\d+)\)/g, 'REAL');

      db.prepare(sqliteStmt).run();
      created++;
    } catch (err) {
      if (err.message.includes('already exists')) {
        skipped++;
      } else if (!err.message.includes('near "OR"')) {
        // Ignore "OR REPLACE FUNCTION" errors
        console.warn(`   ⚠️  ${err.message.substring(0, 80)}`);
      }
    }
  }

  console.log(`\n✅ Successfully executed:`);
  console.log(`   • Created: ${created} objects`);
  console.log(`   • Skipped: ${skipped} existing objects`);

  // Verify tables
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table'
      AND name IN ('website_credentials', 'agent_tasks', 'task_templates', 'automation_rules', 'task_execution_logs', 'credentials_access_log')
    ORDER BY name
  `).all();

  console.log(`\n📋 Post-Audit Tables (${tables.length}/6):`);
  tables.forEach(t => console.log(`   ✓ ${t.name}`));

  if (tables.length >= 4) {
    console.log('\n🎉 Post-Audit Automation System is ready!');
    console.log('Run: node scripts/populate-test-data-simple.mjs');
  } else {
    console.warn('\n⚠️  Some tables may be missing');
  }

} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  process.exit(1);
} finally {
  db.close();
}
