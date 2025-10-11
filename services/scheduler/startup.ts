/**
 * Scheduler Startup Module
 *
 * Automatically initializes background jobs when the Next.js app starts.
 * This runs once on server startup.
 */

import { startPostAuditJobs } from './post-audit-jobs';

let initialized = false;

export function initializeScheduler() {
  if (initialized) {
    console.log('[Scheduler] Already initialized, skipping...');
    return;
  }

  try {
    console.log('[Scheduler] Starting background jobs...');
    startPostAuditJobs();
    initialized = true;
    console.log('[Scheduler] ✅ All background jobs started successfully');
  } catch (error) {
    console.error('[Scheduler] ❌ Failed to start background jobs:', error);
  }
}

// Auto-initialize in production (not during build)
if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  initializeScheduler();
}
