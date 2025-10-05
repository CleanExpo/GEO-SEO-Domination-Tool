/**
 * Feature Flag Service
 * Evaluates feature flags with percentage rollouts and organisation overrides
 * Phase 3: FEATURE-001
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ============================================================
// TYPES
// ============================================================

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage: number;
  variants?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagContext {
  userId?: string;
  organisationId?: string;
  customProperties?: Record<string, any>;
}

export interface FeatureFlagResult {
  enabled: boolean;
  variant?: string;
  reason: string;
}

// ============================================================
// FEATURE FLAG SERVICE
// ============================================================

export class FeatureFlagService {
  private supabase: ReturnType<typeof createClient>;
  private cache: Map<string, { flag: FeatureFlag; timestamp: number }> = new Map();
  private cacheTimeout = 60000; // 1 minute cache

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Evaluate a feature flag for a given context
   * @param flagKey - Feature flag key
   * @param context - Evaluation context (user, organisation)
   * @returns Feature flag result with enabled status and reason
   */
  async evaluateFlag(flagKey: string, context: FeatureFlagContext): Promise<FeatureFlagResult> {
    // Fetch flag (with caching)
    const flag = await this.getFlag(flagKey);

    if (!flag) {
      return {
        enabled: false,
        reason: 'flag_not_found',
      };
    }

    // Check global toggle first
    if (!flag.enabled) {
      return {
        enabled: false,
        reason: 'global_disabled',
      };
    }

    // Check organisation override
    if (context.organisationId) {
      const override = await this.getOrganisationOverride(flag.id, context.organisationId);
      if (override !== null) {
        await this.trackEvaluation(flag.id, context, override);
        return {
          enabled: override,
          reason: override ? 'org_override_enabled' : 'org_override_disabled',
        };
      }
    }

    // Check user assignment (for percentage rollouts)
    if (context.userId) {
      const assignment = await this.getUserAssignment(flag.id, context.userId);
      if (assignment !== null) {
        await this.trackEvaluation(flag.id, context, assignment.enabled, assignment.variant);
        return {
          enabled: assignment.enabled,
          variant: assignment.variant,
          reason: 'user_assignment',
        };
      }
    }

    // Percentage rollout (deterministic based on user ID)
    if (flag.rolloutPercentage > 0 && context.userId) {
      const enabled = this.isInRollout(context.userId, flagKey, flag.rolloutPercentage);

      // Create user assignment for consistency
      if (enabled) {
        await this.createUserAssignment(flag.id, context.userId, enabled);
      }

      await this.trackEvaluation(flag.id, context, enabled);

      return {
        enabled,
        reason: enabled ? 'rollout_included' : 'rollout_excluded',
      };
    }

    // Global enabled (100% rollout)
    await this.trackEvaluation(flag.id, context, true);
    return {
      enabled: true,
      reason: 'global_enabled',
    };
  }

  /**
   * Check if user is in percentage rollout
   * Uses deterministic hashing for consistency
   */
  private isInRollout(userId: string, flagKey: string, percentage: number): boolean {
    const hash = crypto
      .createHash('md5')
      .update(`${userId}-${flagKey}`)
      .digest('hex');

    const hashInt = parseInt(hash.substring(0, 8), 16);
    const bucket = hashInt % 100;

    return bucket < percentage;
  }

  /**
   * Get feature flag by key
   */
  private async getFlag(key: string): Promise<FeatureFlag | null> {
    // Check cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.flag;
    }

    // Fetch from database
    const { data, error } = await this.supabase
      .from('feature_flags')
      .select('*')
      .eq('key', key)
      .single();

    if (error || !data) {
      return null;
    }

    const flag: FeatureFlag = {
      id: data.id,
      key: data.key,
      name: data.name,
      description: data.description,
      enabled: data.enabled,
      rolloutPercentage: data.rollout_percentage,
      variants: data.variants,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    // Cache it
    this.cache.set(key, { flag, timestamp: Date.now() });

    return flag;
  }

  /**
   * Get organisation override
   */
  private async getOrganisationOverride(
    flagId: string,
    organisationId: string
  ): Promise<boolean | null> {
    const { data, error } = await this.supabase
      .from('organisation_feature_overrides')
      .select('enabled')
      .eq('feature_flag_id', flagId)
      .eq('organisation_id', organisationId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.enabled;
  }

  /**
   * Get user assignment
   */
  private async getUserAssignment(
    flagId: string,
    userId: string
  ): Promise<{ enabled: boolean; variant?: string } | null> {
    const { data, error } = await this.supabase
      .from('user_feature_assignments')
      .select('enabled, variant')
      .eq('feature_flag_id', flagId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      enabled: data.enabled,
      variant: data.variant,
    };
  }

  /**
   * Create user assignment
   */
  private async createUserAssignment(
    flagId: string,
    userId: string,
    enabled: boolean,
    variant?: string
  ): Promise<void> {
    await this.supabase.from('user_feature_assignments').upsert({
      user_id: userId,
      feature_flag_id: flagId,
      enabled,
      variant,
    });
  }

  /**
   * Track feature flag evaluation (analytics)
   */
  private async trackEvaluation(
    flagId: string,
    context: FeatureFlagContext,
    enabled: boolean,
    variant?: string
  ): Promise<void> {
    // Fire and forget (don't block evaluation)
    this.supabase
      .from('feature_flag_analytics')
      .insert({
        feature_flag_id: flagId,
        event_type: 'evaluation',
        user_id: context.userId,
        organisation_id: context.organisationId,
        enabled,
        variant,
        metadata: context.customProperties,
      })
      .then(() => {})
      .catch((err) => console.error('Failed to track feature flag evaluation:', err));
  }

  /**
   * Get all flags for a context (useful for dashboard)
   */
  async getAllFlags(context: FeatureFlagContext): Promise<Record<string, boolean>> {
    const { data: flags } = await this.supabase.from('feature_flags').select('*');

    if (!flags) {
      return {};
    }

    const results: Record<string, boolean> = {};

    for (const flag of flags) {
      const result = await this.evaluateFlag(flag.key, context);
      results[flag.key] = result.enabled;
    }

    return results;
  }

  /**
   * Clear cache (useful for testing or admin overrides)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// ============================================================
// REACT HOOK (for client-side usage)
// ============================================================

import { useState, useEffect } from 'react';

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

        if (response.ok) {
          const result = await response.json();
          setEnabled(result.enabled);
        }
      } catch (error) {
        console.error('Failed to evaluate feature flag:', error);
        setEnabled(false);
      } finally {
        setIsLoading(false);
      }
    }

    evaluate();
  }, [flagKey, context.userId, context.organisationId]);

  return { enabled, isLoading };
}

// ============================================================
// FEATURE FLAG KEYS (for type safety)
// ============================================================

export const FEATURE_FLAGS = {
  SECRETS_VAULT: 'secrets-vault-enabled',
  MULTI_TENANCY: 'multi-tenancy-enabled',
  COMMAND_PALETTE: 'command-palette-enabled',
  USAGE_TRACKING: 'usage-tracking-enabled',
  WHITE_LABEL_THEMING: 'white-label-theming',
  GITHUB_WEBHOOKS: 'github-webhooks',
  OBSERVABILITY_SUITE: 'observability-suite',
} as const;
