'use client';

import { useEffect, useState } from 'react';

/**
 * Client-side component that ensures the scheduler is initialized
 * Add this to the root layout or dashboard to auto-initialize on app load
 */
export function SchedulerInit() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initScheduler = async () => {
      try {
        const res = await fetch('/api/scheduler', { method: 'GET' });
        const data = await res.json();

        // If not initialized, trigger initialization
        if (!data.status?.initialized) {
          console.log('[SchedulerInit] Initializing scheduler...');
          await fetch('/api/scheduler', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'initialize' }),
          });
          setInitialized(true);
        } else {
          console.log('[SchedulerInit] Scheduler already initialized');
          setInitialized(true);
        }
      } catch (error) {
        console.error('[SchedulerInit] Failed to initialize scheduler:', error);
      }
    };

    initScheduler();
  }, []);

  // This component doesn't render anything
  return null;
}
