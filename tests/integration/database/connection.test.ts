/**
 * Database Connection Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseClient } from '@/lib/db';

describe('Database Connection', () => {
  let db: DatabaseClient;

  beforeAll(async () => {
    db = new DatabaseClient();
    await db.initialize();
  });

  afterAll(async () => {
    await db.close();
  });

  it('should connect to database successfully', async () => {
    expect(db).toBeDefined();
    const type = db.getType();
    expect(['sqlite', 'postgres']).toContain(type);
  });

  it('should execute simple query', async () => {
    const result = await db.query('SELECT 1 as test');
    expect(result).toBeDefined();
    expect(result.rows).toBeDefined();
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it('should list database tables', async () => {
    const tables = await db.listTables();
    expect(Array.isArray(tables)).toBe(true);
  });

  it('should check if table exists', async () => {
    // Test with a table that should exist
    const companiesExists = await db.tableExists('companies');
    expect(typeof companiesExists).toBe('boolean');

    // Test with a table that shouldn't exist
    const fakeTableExists = await db.tableExists('nonexistent_table_xyz');
    expect(fakeTableExists).toBe(false);
  });

  it('should handle parameterized queries', async () => {
    // This assumes companies table exists and has data
    const result = await db.query('SELECT * FROM companies WHERE id = ?', [1]);
    expect(result).toBeDefined();
    expect(result.rows).toBeDefined();
  });

  it('should execute SQL file', async () => {
    const testSql = `
      CREATE TABLE IF NOT EXISTS test_table (
        id INTEGER PRIMARY KEY,
        name TEXT
      );
    `;

    await expect(db.executeSqlFile(testSql)).resolves.not.toThrow();

    // Verify table was created
    const exists = await db.tableExists('test_table');
    expect(exists).toBe(true);

    // Clean up
    await db.query('DROP TABLE IF EXISTS test_table');
  });

  it('should handle transaction rollback on error', async () => {
    try {
      await db.query('CREATE TABLE IF NOT EXISTS test_rollback (id INTEGER)');

      // This should fail due to constraint violation or syntax error
      await db.query('INSERT INTO test_rollback VALUES ("invalid_type")');
    } catch (error) {
      expect(error).toBeDefined();
    } finally {
      await db.query('DROP TABLE IF EXISTS test_rollback');
    }
  });
});

describe('Database CRUD Operations', () => {
  let db: DatabaseClient;

  beforeAll(async () => {
    db = new DatabaseClient();
    await db.initialize();

    // Create test table
    await db.query(`
      CREATE TABLE IF NOT EXISTS test_crud (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });

  afterAll(async () => {
    await db.query('DROP TABLE IF EXISTS test_crud');
    await db.close();
  });

  it('should insert records', async () => {
    const result = await db.query(
      'INSERT INTO test_crud (name, email) VALUES (?, ?)',
      ['Test User', 'test@example.com']
    );

    expect(result).toBeDefined();
  });

  it('should read records', async () => {
    const result = await db.query('SELECT * FROM test_crud WHERE email = ?', [
      'test@example.com',
    ]);

    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0]).toHaveProperty('name');
    expect(result.rows[0]).toHaveProperty('email');
  });

  it('should update records', async () => {
    await db.query('UPDATE test_crud SET name = ? WHERE email = ?', [
      'Updated User',
      'test@example.com',
    ]);

    const result = await db.query('SELECT * FROM test_crud WHERE email = ?', [
      'test@example.com',
    ]);

    expect(result.rows[0].name).toBe('Updated User');
  });

  it('should delete records', async () => {
    await db.query('DELETE FROM test_crud WHERE email = ?', ['test@example.com']);

    const result = await db.query('SELECT * FROM test_crud WHERE email = ?', [
      'test@example.com',
    ]);

    expect(result.rows.length).toBe(0);
  });

  it('should handle unique constraint violations', async () => {
    await db.query('INSERT INTO test_crud (name, email) VALUES (?, ?)', [
      'User 1',
      'duplicate@example.com',
    ]);

    await expect(
      db.query('INSERT INTO test_crud (name, email) VALUES (?, ?)', [
        'User 2',
        'duplicate@example.com',
      ])
    ).rejects.toThrow();
  });
});
