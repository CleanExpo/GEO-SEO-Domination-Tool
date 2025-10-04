/**
 * Database Client for GEO-SEO Domination Tool (JavaScript version)
 * Supports both SQLite (development) and PostgreSQL (production)
 */

const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * Unified database client that works with both SQLite and PostgreSQL
 */
class DatabaseClient {
  constructor(config) {
    // Auto-detect database type from environment
    this.config = config || this.detectDatabaseConfig();
    this.pgPool = null;
    this.sqliteDb = null;
    this.isInitialized = false;
  }

  /**
   * Detect database configuration from environment variables
   */
  detectDatabaseConfig() {
    const pgConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (pgConnectionString) {
      return {
        type: 'postgres',
        connectionString: pgConnectionString,
      };
    }

    // Default to SQLite for local development
    const sqlitePath = process.env.SQLITE_PATH || path.join(process.cwd(), 'data', 'geo-seo.db');
    return {
      type: 'sqlite',
      sqlitePath,
    };
  }

  /**
   * Initialize the database connection
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    if (this.config.type === 'postgres') {
      this.pgPool = new Pool({
        connectionString: this.config.connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
      });

      // Test connection
      try {
        const client = await this.pgPool.connect();
        client.release();
        console.log('✓ Connected to PostgreSQL database');
      } catch (error) {
        console.error('✗ Failed to connect to PostgreSQL:', error);
        throw error;
      }
    } else {
      // SQLite
      const dbDir = path.dirname(this.config.sqlitePath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.sqliteDb = new Database(this.config.sqlitePath);
      this.sqliteDb.pragma('foreign_keys = ON');
      console.log(`✓ Connected to SQLite database at ${this.config.sqlitePath}`);
    }

    this.isInitialized = true;
  }

  /**
   * Execute a SQL query
   */
  async query(sql, params = []) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.config.type === 'postgres') {
      const result = await this.pgPool.query(sql, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
      };
    } else {
      // SQLite
      try {
        if (sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('PRAGMA')) {
          const stmt = this.sqliteDb.prepare(sql);
          const rows = stmt.all(...params);
          return {
            rows,
            rowCount: rows.length,
          };
        } else {
          const stmt = this.sqliteDb.prepare(sql);
          const info = stmt.run(...params);
          return {
            rows: [],
            rowCount: info.changes,
          };
        }
      } catch (error) {
        console.error('SQLite query error:', error);
        throw error;
      }
    }
  }

  /**
   * Execute a SQL query and return a single row
   */
  async queryOne(sql, params = []) {
    const result = await this.query(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Execute multiple SQL statements (useful for schema initialization)
   */
  async executeSqlFile(sqlContent) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    if (this.config.type === 'postgres') {
      const client = await this.pgPool.connect();
      try {
        await client.query('BEGIN');
        for (const statement of statements) {
          await client.query(statement);
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // SQLite
      const transaction = this.sqliteDb.transaction((stmts) => {
        for (const stmt of stmts) {
          this.sqliteDb.exec(stmt);
        }
      });

      try {
        transaction(statements);
      } catch (error) {
        console.error('SQLite transaction error:', error);
        throw error;
      }
    }
  }

  /**
   * Begin a transaction
   */
  async beginTransaction() {
    if (this.config.type === 'postgres') {
      await this.query('BEGIN');
    } else {
      this.sqliteDb.exec('BEGIN TRANSACTION');
    }
  }

  /**
   * Commit a transaction
   */
  async commit() {
    if (this.config.type === 'postgres') {
      await this.query('COMMIT');
    } else {
      this.sqliteDb.exec('COMMIT');
    }
  }

  /**
   * Rollback a transaction
   */
  async rollback() {
    if (this.config.type === 'postgres') {
      await this.query('ROLLBACK');
    } else {
      this.sqliteDb.exec('ROLLBACK');
    }
  }

  /**
   * Get database type
   */
  getType() {
    return this.config.type;
  }

  /**
   * Check if a table exists
   */
  async tableExists(tableName) {
    if (this.config.type === 'postgres') {
      const result = await this.queryOne(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )`,
        [tableName]
      );
      return result.exists;
    } else {
      const result = await this.queryOne(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        [tableName]
      );
      return result !== null;
    }
  }

  /**
   * Close the database connection
   */
  async close() {
    if (this.config.type === 'postgres' && this.pgPool) {
      await this.pgPool.end();
      console.log('✓ PostgreSQL connection closed');
    } else if (this.sqliteDb) {
      this.sqliteDb.close();
      console.log('✓ SQLite connection closed');
    }
    this.isInitialized = false;
  }
}

// Singleton instance
let dbInstance = null;

/**
 * Get or create database client singleton
 */
function getDatabase(config) {
  if (!dbInstance) {
    dbInstance = new DatabaseClient(config);
  }
  return dbInstance;
}

/**
 * Initialize database with tables
 */
async function initializeDatabase(schemaFiles) {
  const db = getDatabase();
  await db.initialize();

  if (schemaFiles && schemaFiles.length > 0) {
    console.log('Initializing database with schema files...');
    for (const schemaFile of schemaFiles) {
      const sqlContent = fs.readFileSync(schemaFile, 'utf-8');
      console.log(`  - Executing ${path.basename(schemaFile)}...`);
      await db.executeSqlFile(sqlContent);
    }
    console.log('✓ Database initialized successfully');
  }
}

module.exports = {
  DatabaseClient,
  getDatabase,
  initializeDatabase,
};
