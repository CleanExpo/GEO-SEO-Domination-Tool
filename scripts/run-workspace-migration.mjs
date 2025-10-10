/**
 * Run Workspace Migration
 *
 * Phase 1.2 Day 8-9: Create workspaces table
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    // Open database
    const db = await open({
      filename: './data/geo-seo.db',
      driver: sqlite3.Database
    });

    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '2025-01-10_workspace-schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Extract UP migration (everything before "-- ROLLBACK:")
    const upMigration = sql.split('-- ROLLBACK:')[0].trim();

    // Split by semicolon and run each statement
    const statements = upMigration
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log('Running workspace migration...');

    for (const statement of statements) {
      if (statement) {
        console.log(`  Executing: ${statement.substring(0, 60)}...`);
        await db.run(statement);
      }
    }

    console.log('✅ Workspace migration complete!');

    // Verify table created
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='workspaces'");
    if (tables.length > 0) {
      console.log('✅ Workspaces table verified');
    } else {
      console.log('❌ Workspaces table not found');
    }

    await db.close();

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
