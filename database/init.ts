/**
 * DEPRECATED: This file is kept for backward compatibility only.
 *
 * ALL NEW CODE SHOULD USE: import { getDatabase } from '@/lib/db'
 *
 * The unified database client in lib/db.ts provides:
 * - Automatic PostgreSQL/Supabase detection in production (Vercel)
 * - SQLite fallback for local development
 * - Connection pooling for serverless environments
 * - Unified API that works with both databases
 */

// Re-export the unified database client
export { getDatabase, DatabaseClient, initializeDatabase } from '@/lib/db';

// Export singleton instance for backward compatibility
import getDb from '@/lib/db';
export const db = getDb();
