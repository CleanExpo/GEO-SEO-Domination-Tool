#!/usr/bin/env node

/**
 * Reset Post-Audit Tables (drop and recreate)
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SQLITE_PATH = './data/geo-seo.db';
const SCHEMA_PATH = join(__dirname, '..', 'database', 'post-audit-automation-schema-sqlite.sql');

console.log('🔄 Resetting Post-Audit Automation Tables');
console.log('='.repeat(60));

const db = new Database(SQLITE_PATH);

try {
  // Drop existing tables
  console.log('\n🗑️  Dropping existing tables...');

  const tables = [
    'credentials_access_log',
    'task_execution_logs',
    'automation_rules',
    'agent_tasks',
    'task_templates',
    'website_credentials'
  ];

  for (const table of tables) {
    try {
      db.prepare(`DROP TABLE IF EXISTS ${table}`).run();
      console.log(`   ✓ Dropped ${table}`);
    } catch (err) {
      console.log(`   ⏭️  ${table} (not found)`);
    }
  }

  // Drop triggers
  console.log('\n🗑️  Dropping existing triggers...');
  const triggers = [
    'trigger_update_website_credentials_updated_at',
    'trigger_update_agent_tasks_updated_at'
  ];

  for (const trigger of triggers) {
    try {
      db.prepare(`DROP TRIGGER IF EXISTS ${trigger}`).run();
      console.log(`   ✓ Dropped ${trigger}`);
    } catch (err) {
      console.log(`   ⏭️  ${trigger} (not found)`);
    }
  }

  // Execute schema
  console.log(`\n📁 Executing schema: ${SCHEMA_PATH}`);
  const schema = readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);

  console.log('   ✅ Schema executed successfully');

  // Verify
  const result = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table'
      AND name IN ('website_credentials', 'agent_tasks', 'task_templates', 'automation_rules', 'task_execution_logs', 'credentials_access_log')
    ORDER BY name
  `).all();

  console.log(`\n📋 Created Tables (${result.length}/6):`);
  result.forEach(t => console.log(`   ✓ ${t.name}`));

  if (result.length === 6) {
    console.log('\n🎉 Post-Audit Automation System is ready!');
    console.log('Next: node scripts/populate-test-data-simple.mjs');
  } else {
    console.warn(`\n⚠️  Only ${result.length}/6 tables created`);
  }

} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
} finally {
  db.close();
}
