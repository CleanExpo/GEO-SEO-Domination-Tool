/**
 * Database Client for GEO-SEO Domination Tool
 * Supports both SQLite (development) and PostgreSQL (production)
 */

import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';

// Lazy-load better-sqlite3 only when needed (development)
// This prevents import errors in production when it's not installed
let Database: any = null;

// Database configuration type
export type DatabaseConfig = {
  type: 'sqlite' | 'postgres';
  connectionString?: string;
  sqlitePath?: string;
};

// Query result type
export type QueryResult = {
  rows: any[];
  rowCount: number;
};

// Run result type (for INSERT, UPDATE, DELETE operations)
export type RunResult = {
  lastID?: number;
  changes: number;
};

/**
 * Unified database client that works with both SQLite and PostgreSQL
 */
export class DatabaseClient {
  private config: DatabaseConfig;
  private pgPool?: Pool;
  private sqliteDb?: any; // better-sqlite3 Database type (loaded dynamically)
  private isInitialized = false;

  constructor(config?: DatabaseConfig) {
    // Auto-detect database type from environment
    this.config = config || this.detectDatabaseConfig();
  }

  /**
   * Detect database configuration from environment variables
   */
  private detectDatabaseConfig(): DatabaseConfig {
    // Check for forced local database (for development override)
    const forceLocalDb = process.env.FORCE_LOCAL_DB === 'true' || process.env.USE_SQLITE === 'true';

    if (forceLocalDb) {
      const sqlitePath = process.env.SQLITE_PATH || path.join(process.cwd(), 'data', 'geo-seo.db');
      console.log(`🔧 Using SQLite database (forced local) at: ${sqlitePath}`);
      return {
        type: 'sqlite',
        sqlitePath,
      };
    }

    // Check for PostgreSQL connection string (production database)
    const pgConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (pgConnectionString) {
      console.log('🔧 Using PostgreSQL database (production)');
      return {
        type: 'postgres',
        connectionString: pgConnectionString,
      };
    }

    // Fallback to SQLite for local development
    const sqlitePath = process.env.SQLITE_PATH || path.join(process.cwd(), 'data', 'geo-seo.db');
    console.log(`🔧 Using SQLite database (local development) at: ${sqlitePath}`);
    return {
      type: 'sqlite',
      sqlitePath,
    };
  }

  /**
   * Initialize the database connection
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.config.type === 'postgres') {
      this.pgPool = new Pool({
        connectionString: this.config.connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
        // Optimized for Supabase Pro Plan - Large Compute
        // Large: 160 direct connections + 800 pooler connections
        max: 30, // Per serverless instance (5 instances × 30 = 150, well within 160)
        min: 2, // Keep 2 warm connections per instance
        idleTimeoutMillis: 30000, // Keep connections alive for 30s
        connectionTimeoutMillis: 10000, // 10s timeout for acquiring connection
        maxUses: 7500, // Recycle after 7500 uses
        allowExitOnIdle: true, // Allow graceful shutdown
      });

      // Test connection
      try {
        const client = await this.pgPool.connect();
        client.release();
        console.log('✓ Connected to PostgreSQL database (pool: max 20, min 2)');
      } catch (error) {
        console.error('✗ Failed to connect to PostgreSQL:', error);
        throw error;
      }
    } else {
      // SQLite - Lazy load better-sqlite3 only when needed
      if (!Database) {
        try {
          Database = (await import('better-sqlite3')).default;
        } catch (error) {
          console.error('❌ Failed to load better-sqlite3. Install it with: npm install better-sqlite3');
          throw new Error('better-sqlite3 is required for SQLite database but is not installed');
        }
      }

      const dbDir = path.dirname(this.config.sqlitePath!);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.sqliteDb = new Database(this.config.sqlitePath!);
      this.sqliteDb.pragma('foreign_keys = ON');
      console.log(`✓ Connected to SQLite database at ${this.config.sqlitePath}`);
    }

    this.isInitialized = true;
  }

  /**
   * Execute a SQL query
   */
  async query(sql: string, params: any[] = []): Promise<QueryResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Debug: Log database type detection
    console.log('[DEBUG] Database config type:', this.config.type);
    console.log('[DEBUG] DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('[DEBUG] POSTGRES_URL exists:', !!process.env.POSTGRES_URL);

    if (this.config.type === 'postgres') {
      console.log('[DEBUG] ✅ PostgreSQL branch selected');
      // Convert ? placeholders to $1, $2, $3 for PostgreSQL
      let paramIndex = 1;
      const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);

      // Debug logging for troubleshooting (reduce verbosity)
      console.log('[DEBUG] SQL:', pgSql.substring(0, 100));

      // Use pool.query() which automatically acquires and releases connections
      // This is the recommended approach for single queries
      try {
        const result = await this.pgPool!.query(pgSql, params);
        console.log('[DEBUG] Query completed, rows:', result.rowCount);
        return {
          rows: result.rows,
          rowCount: result.rowCount || 0,
        };
      } catch (error) {
        console.error('[DEBUG] PostgreSQL query failed:', error);
        throw error;
      }
    } else {
      console.log('[DEBUG] ❌ SQLite branch selected (ERROR if production!)');
      // SQLite
      try {
        if (sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('PRAGMA')) {
          const stmt = this.sqliteDb!.prepare(sql);
          const rows = stmt.all(...params);
          return {
            rows,
            rowCount: rows.length,
          };
        } else {
          const stmt = this.sqliteDb!.prepare(sql);
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
  async queryOne(sql: string, params: any[] = []): Promise<any | null> {
    const result = await this.query(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Execute a SQL query and return all rows (SQLite-style convenience method)
   * Compatible with both SQLite and PostgreSQL
   */
  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const result = await this.query(sql, params);
    return result.rows as T[];
  }

  /**
   * Execute a SQL query and return a single row (SQLite-style convenience method)
   * Compatible with both SQLite and PostgreSQL
   */
  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const result = await this.queryOne(sql, params);
    return result || undefined;
  }

  /**
   * Execute a SQL statement (INSERT, UPDATE, DELETE) and return result (SQLite-style convenience method)
   * Compatible with both SQLite and PostgreSQL
   */
  async run(sql: string, params: any[] = []): Promise<RunResult> {
    const result = await this.query(sql, params);

    // For PostgreSQL, we need to extract the inserted ID from the result
    // This works for INSERT statements with RETURNING clause
    let lastID: number | undefined = undefined;

    if (this.config.type === 'postgres') {
      // If the query is an INSERT with RETURNING id, extract it
      if (sql.trim().toUpperCase().startsWith('INSERT') && result.rows.length > 0 && 'id' in result.rows[0]) {
        lastID = result.rows[0].id;
      }
      // For queries without RETURNING, we can't get the ID - this is a PostgreSQL limitation
      // The calling code should add RETURNING id to INSERT statements when needed
    } else {
      // SQLite: The query() method will have executed with better-sqlite3's run()
      // which returns info with lastInsertRowid
      // However, we need to access the sqlite info object directly
      // Since we've already called query(), we need to modify the flow slightly

      // Re-execute for SQLite to get proper lastID
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        const stmt = this.sqliteDb!.prepare(sql);
        const info = stmt.run(...params);
        lastID = Number(info.lastInsertRowid);
        return {
          lastID,
          changes: info.changes,
        };
      }
    }

    return {
      lastID,
      changes: result.rowCount,
    };
  }

  /**
   * Execute multiple SQL statements (useful for schema initialization)
   */
  async executeSqlFile(sqlContent: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    if (this.config.type === 'postgres') {
      const client = await this.pgPool!.connect();
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
      const transaction = this.sqliteDb!.transaction((stmts: string[]) => {
        for (const stmt of stmts) {
          this.sqliteDb!.exec(stmt);
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
  async beginTransaction(): Promise<void> {
    if (this.config.type === 'postgres') {
      await this.query('BEGIN');
    } else {
      this.sqliteDb!.exec('BEGIN TRANSACTION');
    }
  }

  /**
   * Commit a transaction
   */
  async commit(): Promise<void> {
    if (this.config.type === 'postgres') {
      await this.query('COMMIT');
    } else {
      this.sqliteDb!.exec('COMMIT');
    }
  }

  /**
   * Rollback a transaction
   */
  async rollback(): Promise<void> {
    if (this.config.type === 'postgres') {
      await this.query('ROLLBACK');
    } else {
      this.sqliteDb!.exec('ROLLBACK');
    }
  }

  /**
   * Get database type
   */
  getType(): 'sqlite' | 'postgres' {
    return this.config.type;
  }

  /**
   * Check if a table exists
   */
  async tableExists(tableName: string): Promise<boolean> {
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
  async close(): Promise<void> {
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

// Singleton instance - persists across serverless function invocations
let dbInstance: DatabaseClient | null = null;

// Check if we're in a serverless environment
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

/**
 * Get or create database client singleton
 * In serverless environments, this connection pool persists across invocations
 */
export function getDatabase(config?: DatabaseConfig): DatabaseClient {
  if (!dbInstance) {
    if (isServerless) {
      console.log('🚀 Creating database connection pool (serverless - will persist)');
    }
    dbInstance = new DatabaseClient(config);
  } else {
    if (isServerless) {
      console.log('♻️  Reusing existing database connection pool (serverless optimization)');
    }
  }
  return dbInstance;
}

/**
 * Initialize database with tables
 */
export async function initializeDatabase(schemaFiles?: string[]): Promise<void> {
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

export default getDatabase;

// CRITICAL: Explicitly preserve DatabaseClient methods to prevent webpack tree-shaking
// These method references ensure webpack includes them in the production bundle
if (false) {
  const preventTreeShaking = new DatabaseClient();
  preventTreeShaking.get('', []);
  preventTreeShaking.run('', []);
  preventTreeShaking.all('', []);
}
