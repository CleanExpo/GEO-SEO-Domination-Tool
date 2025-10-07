/**
 * Scheduler initialization for Next.js app
 *
 * This module ensures the RankingScheduler is initialized when the app starts.
 * It's designed to be called once during server startup.
 */

import { getRankingScheduler } from './RankingScheduler';

let isInitialized = false;

/**
 * Initialize the ranking scheduler
 * Safe to call multiple times - will only initialize once
 */
export async function initializeScheduler() {
  if (isInitialized) {
    console.log('[Scheduler] Already initialized, skipping...');
    return;
  }

  try {
    console.log('[Scheduler] Initializing ranking scheduler...');
    const scheduler = getRankingScheduler();
    await scheduler.initialize();
    isInitialized = true;
    console.log('[Scheduler] ✅ Ranking scheduler initialized successfully');
  } catch (error) {
    console.error('[Scheduler] ❌ Failed to initialize scheduler:', error);
    // Don't throw - allow app to start even if scheduler fails
  }
}

/**
 * Check if scheduler is initialized
 */
export function isSchedulerInitialized() {
  return isInitialized;
}

/**
 * Shutdown the scheduler (for testing or manual control)
 */
export function shutdownScheduler() {
  const scheduler = getRankingScheduler();
  scheduler.shutdown();
  isInitialized = false;
  console.log('[Scheduler] Scheduler shutdown');
}

// Auto-initialize in production server environment
// This runs when the module is first imported
if (typeof window === 'undefined' &&
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PHASE !== 'phase-production-build') {
  // Delay initialization to allow database connections to be ready
  setTimeout(() => {
    initializeScheduler().catch(console.error);
  }, 1000);
}
