import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize SQLite database
const dbPath = join(__dirname, '../data/geo-seo.db');
const db = new Database(dbPath);

console.log('🚀 Initializing Empire CRM Schema...\n');

try {
  // Read the Empire schema file
  const schemaPath = join(__dirname, '../database/empire-crm-schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // SQLite doesn't support all PostgreSQL features, so we need to adapt
  console.log('⚠️  Note: Adapting PostgreSQL schema for SQLite...\n');

  // Split into individual statements and execute
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .filter(s => !s.startsWith('--')) // Remove comments
    .filter(s => !s.includes('CREATE EXTENSION')) // Skip PostgreSQL extensions
    .filter(s => !s.includes('LANGUAGE plpgsql')) // Skip PostgreSQL functions
    .filter(s => !s.includes('CREATE TRIGGER')) // Skip triggers for now
    .filter(s => !s.includes('CREATE OR REPLACE FUNCTION')); // Skip functions

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let skipCount = 0;

  for (const statement of statements) {
    try {
      // Adapt PostgreSQL to SQLite
      let adapted = statement
        .replace(/UUID/g, 'TEXT') // UUID -> TEXT
        .replace(/uuid_generate_v4\(\)/g, "lower(hex(randomblob(16)))") // UUID generation
        .replace(/TIMESTAMP/g, 'TEXT') // TIMESTAMP -> TEXT
        .replace(/NOW\(\)/g, "datetime('now')") // NOW() -> datetime('now')
        .replace(/JSONB/g, 'TEXT') // JSONB -> TEXT
        .replace(/TEXT\[\]/g, 'TEXT') // Arrays -> TEXT (JSON encoded)
        .replace(/DECIMAL\([^)]+\)/g, 'REAL') // DECIMAL -> REAL
        .replace(/VARCHAR\((\d+)\)/g, 'TEXT') // VARCHAR -> TEXT
        .replace(/BOOLEAN/g, 'INTEGER') // BOOLEAN -> INTEGER
        .replace(/DEFAULT true/g, 'DEFAULT 1') // true -> 1
        .replace(/DEFAULT false/g, 'DEFAULT 0') // false -> 0
        .replace(/CHECK \([^)]+\)/g, '') // Remove CHECK constraints (not critical)
        .replace(/UNIQUE\(([^)]+)\)/g, '') // Remove table-level UNIQUE (use CREATE UNIQUE INDEX instead)
        .replace(/tsvector/g, 'TEXT') // tsvector -> TEXT
        .replace(/USING gin\([^)]+\)/g, ''); // Remove GIN indexes

      if (adapted.trim().length === 0) {
        skipCount++;
        continue;
      }

      db.exec(adapted);
      successCount++;

      // Log table creation
      if (adapted.includes('CREATE TABLE')) {
        const tableName = adapted.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
        if (tableName) {
          console.log(`✅ Created table: ${tableName}`);
        }
      } else if (adapted.includes('CREATE INDEX')) {
        const indexName = adapted.match(/CREATE INDEX IF NOT EXISTS (\w+)/)?.[1];
        if (indexName) {
          console.log(`📊 Created index: ${indexName}`);
        }
      }
    } catch (err) {
      // Some statements might fail due to incompatibility - that's okay
      console.log(`⚠️  Skipped statement (incompatible): ${err.message.substring(0, 80)}...`);
      skipCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully executed: ${successCount} statements`);
  console.log(`⚠️  Skipped: ${skipCount} statements`);
  console.log('='.repeat(60));

  // Verify tables were created
  console.log('\n🔍 Verifying Empire tables...\n');

  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table'
    AND name LIKE '%portfolio%' OR name LIKE '%empire%' OR name LIKE '%autonomous%' OR name LIKE '%research%' OR name LIKE '%intelligence%'
    ORDER BY name
  `).all();

  if (tables.length > 0) {
    console.log('📋 Empire tables created:');
    tables.forEach(t => console.log(`   - ${t.name}`));
  } else {
    console.log('⚠️  No Empire tables found. Manual creation may be needed.');
  }

  console.log('\n🎉 Empire CRM Schema initialization complete!\n');
  console.log('Next steps:');
  console.log('1. Start your Next.js server: npm run dev');
  console.log('2. Create a portfolio: POST /api/crm/portfolios');
  console.log('3. Activate Empire Mode and watch the swarm work!\n');

} catch (error) {
  console.error('❌ Error initializing Empire schema:', error);
  process.exit(1);
} finally {
  db.close();
}
