import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../data/geo-seo.db');
const db = new Database(dbPath);

console.log('🚀 Loading Empire CRM Schema (SQLite Compatible)...\n');

try {
  const schemaPath = join(__dirname, '../database/empire-crm-schema-sqlite.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // Execute the entire schema
  db.exec(schema);

  console.log('✅ Empire CRM schema loaded successfully!\n');

  // Verify tables
  console.log('📋 Empire tables created:\n');
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table'
    AND (
      name LIKE '%portfolio%'
      OR name LIKE '%empire%'
      OR name LIKE '%swarm%'
      OR name LIKE '%research%'
      OR name LIKE '%intelligence%'
      OR name LIKE '%autonomous%'
      OR name LIKE '%competitive%'
    )
    ORDER BY name
  `).all();

  tables.forEach(t => console.log(`   ✓ ${t.name}`));

  console.log('\n🎉 EMPIRE MODE READY!\n');
  console.log('Next steps:');
  console.log('1. npm run dev  (start Next.js server)');
  console.log('2. Create Unite Group portfolio via API');
  console.log('3. Watch the autonomous swarm activate!\n');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  db.close();
}
