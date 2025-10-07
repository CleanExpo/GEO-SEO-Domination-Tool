"use client"

/**
 * Client-side Feature Flag Hook
 * Evaluates feature flags with percentage rollouts and organisation overrides
 * Phase 3: FEATURE-001
 */

import { useState, useEffect } from 'react';
import type { FeatureFlagContext } from './feature-flags';

export function useFeatureFlag(
  flagKey: string,
  context: FeatureFlagContext
): { enabled: boolean; isLoading: boolean } {
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function evaluate() {
      setIsLoading(true);

      try {
        const response = await fetch('/api/feature-flags/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flagKey, context }),
        });

        if (!response.ok) {
          throw new Error(`Failed to evaluate feature flag: ${response.statusText}`);
        }

        const result = await response.json();
        setEnabled(result.enabled);
      } catch (error) {
        console.error(`Error evaluating feature flag "${flagKey}":`, error);
        setEnabled(false);
      } finally {
        setIsLoading(false);
      }
    }

    evaluate();
  }, [flagKey, JSON.stringify(context)]);

  return { enabled, isLoading };
}
