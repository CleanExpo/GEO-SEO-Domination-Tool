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

        // Silently fail if API returns error (don't block page load)
        if (!res.ok) {
          console.warn('[SchedulerInit] Scheduler API unavailable, skipping initialization');
          return;
        }

        const data = await res.json();

        // If not initialized, trigger initialization
        if (!data.status?.initialized) {
          console.log('[SchedulerInit] Initializing scheduler...');
          const initRes = await fetch('/api/scheduler', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'initialize' }),
          });

          if (initRes.ok) {
            setInitialized(true);
          }
        } else {
          console.log('[SchedulerInit] Scheduler already initialized');
          setInitialized(true);
        }
      } catch (error) {
        // Silently fail - don't block page load if scheduler fails
        console.warn('[SchedulerInit] Scheduler unavailable:', error);
      }
    };

    initScheduler();
  }, []);

  // This component doesn't render anything
  return null;
}
