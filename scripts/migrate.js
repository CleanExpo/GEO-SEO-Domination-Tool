#!/usr/bin/env node

/**
 * Database Migration System
 * Simple migration system for managing database schema changes
 *
 * Usage:
 *   node scripts/migrate.js create <migration-name>  # Create a new migration
 *   node scripts/migrate.js up                       # Run pending migrations
 *   node scripts/migrate.js down                     # Rollback last migration
 *   node scripts/migrate.js status                   # Show migration status
 *   node scripts/migrate.js reset                    # Reset all migrations
 */

const fs = require('fs');
const path = require('path');
const { DatabaseClient } = require('../web-app/lib/db');

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

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

const MIGRATIONS_DIR = path.join(__dirname, '..', 'database', 'migrations');

/**
 * Ensure migrations directory exists
 */
function ensureMigrationsDir() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    log(`Created migrations directory: ${MIGRATIONS_DIR}`, colors.green);
  }
}

/**
 * Ensure migrations table exists
 */
async function ensureMigrationsTable(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Get list of migration files
 */
function getMigrationFiles() {
  ensureMigrationsDir();
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();
}

/**
 * Get executed migrations from database
 */
async function getExecutedMigrations(db) {
  await ensureMigrationsTable(db);
  const result = await db.query('SELECT name FROM _migrations ORDER BY name');
  return result.rows.map(row => row.name);
}

/**
 * Get pending migrations
 */
async function getPendingMigrations(db) {
  const allMigrations = getMigrationFiles();
  const executed = await getExecutedMigrations(db);
  return allMigrations.filter(m => !executed.includes(m));
}

/**
 * Create a new migration file
 */
async function createMigration(name) {
  ensureMigrationsDir();

  if (!name) {
    log('Error: Migration name is required', colors.red);
    log('Usage: node scripts/migrate.js create <migration-name>', colors.yellow);
    process.exit(1);
  }

  // Generate timestamp-based filename
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '_');
  const fileName = `${timestamp}_${name.replace(/\s+/g, '_')}.sql`;
  const filePath = path.join(MIGRATIONS_DIR, fileName);

  // Migration template
  const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- ========================================
-- UP Migration
-- ========================================

-- Add your SQL statements here
-- Example:
-- CREATE TABLE IF NOT EXISTS example_table (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   name TEXT NOT NULL
-- );


-- ========================================
-- DOWN Migration (Rollback)
-- ========================================
-- ROLLBACK:
-- Add rollback SQL statements below the ROLLBACK: marker
-- Example:
-- DROP TABLE IF EXISTS example_table;
`;

  fs.writeFileSync(filePath, template);
  log(`\n✓ Created migration file: ${fileName}`, colors.green);
  log(`  Location: ${filePath}\n`, colors.cyan);
}

/**
 * Parse migration file into UP and DOWN sections
 */
function parseMigrationFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let upSql = [];
  let downSql = [];
  let currentSection = 'up';

  for (const line of lines) {
    if (line.trim().startsWith('-- ROLLBACK:')) {
      currentSection = 'down';
      continue;
    }

    if (currentSection === 'up') {
      upSql.push(line);
    } else {
      downSql.push(line);
    }
  }

  return {
    up: upSql.join('\n').trim(),
    down: downSql.join('\n').trim(),
  };
}

/**
 * Run pending migrations
 */
async function runMigrations() {
  log('\n========================================', colors.cyan);
  log('  Running Migrations', colors.cyan + colors.bright);
  log('========================================\n', colors.cyan);

  const db = new DatabaseClient();

  try {
    await db.initialize();
    await ensureMigrationsTable(db);

    const pending = await getPendingMigrations(db);

    if (pending.length === 0) {
      log('No pending migrations', colors.green);
      return;
    }

    log(`Found ${pending.length} pending migration(s):\n`, colors.blue);
    pending.forEach(m => log(`  - ${m}`, colors.cyan));
    log('');

    for (const migration of pending) {
      const filePath = path.join(MIGRATIONS_DIR, migration);
      log(`Running: ${migration}`, colors.yellow);

      try {
        const { up } = parseMigrationFile(filePath);

        await db.beginTransaction();
        await db.executeSqlFile(up);
        await db.query('INSERT INTO _migrations (name) VALUES (?)', [migration]);
        await db.commit();

        log(`  ✓ ${migration} completed`, colors.green);
      } catch (error) {
        await db.rollback();
        log(`  ✗ ${migration} failed: ${error.message}`, colors.red);
        throw error;
      }
    }

    log('\n✓ All migrations completed successfully!', colors.green + colors.bright);

  } finally {
    await db.close();
  }
}

/**
 * Rollback last migration
 */
async function rollbackMigration() {
  log('\n========================================', colors.cyan);
  log('  Rolling Back Migration', colors.cyan + colors.bright);
  log('========================================\n', colors.cyan);

  const db = new DatabaseClient();

  try {
    await db.initialize();
    await ensureMigrationsTable(db);

    const executed = await getExecutedMigrations(db);

    if (executed.length === 0) {
      log('No migrations to rollback', colors.yellow);
      return;
    }

    const lastMigration = executed[executed.length - 1];
    const filePath = path.join(MIGRATIONS_DIR, lastMigration);

    log(`Rolling back: ${lastMigration}`, colors.yellow);

    try {
      const { down } = parseMigrationFile(filePath);

      if (!down || down.trim().length === 0) {
        log(`  ⚠ No rollback SQL found in ${lastMigration}`, colors.yellow);
        log('  Migration will be marked as rolled back, but no SQL was executed', colors.yellow);
      } else {
        await db.beginTransaction();
        await db.executeSqlFile(down);
        await db.query('DELETE FROM _migrations WHERE name = ?', [lastMigration]);
        await db.commit();
      }

      log(`  ✓ ${lastMigration} rolled back`, colors.green);
    } catch (error) {
      await db.rollback();
      log(`  ✗ Rollback failed: ${error.message}`, colors.red);
      throw error;
    }

  } finally {
    await db.close();
  }
}

/**
 * Show migration status
 */
async function showStatus() {
  log('\n========================================', colors.cyan);
  log('  Migration Status', colors.cyan + colors.bright);
  log('========================================\n', colors.cyan);

  const db = new DatabaseClient();

  try {
    await db.initialize();
    log(`Database type: ${db.getType()}\n`, colors.blue);

    await ensureMigrationsTable(db);

    const allMigrations = getMigrationFiles();
    const executed = await getExecutedMigrations(db);
    const pending = allMigrations.filter(m => !executed.includes(m));

    log(`Total migrations: ${allMigrations.length}`, colors.blue);
    log(`Executed: ${executed.length}`, colors.green);
    log(`Pending: ${pending.length}\n`, colors.yellow);

    if (executed.length > 0) {
      log('Executed migrations:', colors.green);
      executed.forEach(m => log(`  ✓ ${m}`, colors.green));
      log('');
    }

    if (pending.length > 0) {
      log('Pending migrations:', colors.yellow);
      pending.forEach(m => log(`  ○ ${m}`, colors.yellow));
      log('');
    }

  } finally {
    await db.close();
  }
}

/**
 * Reset all migrations (for development only)
 */
async function resetMigrations() {
  log('\n========================================', colors.red);
  log('  WARNING: Resetting All Migrations', colors.red + colors.bright);
  log('========================================\n', colors.red);

  const db = new DatabaseClient();

  try {
    await db.initialize();
    await ensureMigrationsTable(db);

    await db.query('DELETE FROM _migrations');
    log('✓ Migration history cleared', colors.green);

  } finally {
    await db.close();
  }
}

/**
 * Main CLI handler
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'create':
        await createMigration(args.slice(1).join(' '));
        break;

      case 'up':
        await runMigrations();
        break;

      case 'down':
        await rollbackMigration();
        break;

      case 'status':
        await showStatus();
        break;

      case 'reset':
        await resetMigrations();
        break;

      default:
        log('\nDatabase Migration System\n', colors.cyan + colors.bright);
        log('Usage:', colors.blue);
        log('  node scripts/migrate.js create <name>  - Create a new migration', colors.cyan);
        log('  node scripts/migrate.js up             - Run pending migrations', colors.cyan);
        log('  node scripts/migrate.js down           - Rollback last migration', colors.cyan);
        log('  node scripts/migrate.js status         - Show migration status', colors.cyan);
        log('  node scripts/migrate.js reset          - Reset migration history', colors.cyan);
        log('');
        break;
    }
  } catch (error) {
    log(`\n✗ Error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Run CLI
if (require.main === module) {
  main();
}

module.exports = {
  createMigration,
  runMigrations,
  rollbackMigration,
  showStatus,
  resetMigrations,
};
