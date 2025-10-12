/**
 * Tier Access Check API
 *
 * POST /api/tier/check-access
 *
 * Checks if a client has access to a specific feature based on their tier
 * Returns upgrade suggestion if feature not available
 */

import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');

interface AccessCheckRequest {
  clientId: string;
  feature: string; // 'unlimited_websites', 'daily_audits', 'ai_autopilot', 'unlimited_keywords', etc.
}

export async function POST(request: NextRequest) {
  const db = new Database(dbPath);

  try {
    const body: AccessCheckRequest = await request.json();
    const { clientId, feature } = body;

    if (!clientId || !feature) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: clientId, feature' },
        { status: 400 }
      );
    }

    // Get tier access
    const tierAccess = db.prepare(`
      SELECT tier, features, automation_level, expires_at
      FROM tier_access
      WHERE client_id = ?
    `).get(clientId) as any;

    if (!tierAccess) {
      return NextResponse.json({
        success: false,
        allowed: false,
        reason: 'No active subscription',
        upgradeRequired: 'good'
      });
    }

    // Check if subscription expired
    if (tierAccess.expires_at && new Date(tierAccess.expires_at) < new Date()) {
      return NextResponse.json({
        success: false,
        allowed: false,
        reason: 'Subscription expired. Please renew to continue.',
        upgradeRequired: tierAccess.tier
      });
    }

    // Parse features
    const features = JSON.parse(tierAccess.features);

    // Check feature access
    const accessResult = checkFeatureAccess(feature, features, tierAccess.tier);

    if (accessResult.allowed) {
      return NextResponse.json({
        success: true,
        allowed: true,
        currentTier: tierAccess.tier,
        message: `Feature ${feature} is available in your ${tierAccess.tier} tier`
      });
    } else {
      return NextResponse.json({
        success: true,
        allowed: false,
        reason: accessResult.reason,
        upgradeRequired: accessResult.upgradeRequired,
        currentTier: tierAccess.tier,
        message: `Upgrade to ${accessResult.upgradeRequired} tier to unlock ${feature}`
      });
    }

  } catch (error: any) {
    console.error('[Tier Access] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}

// ============================================================================
// Feature Access Logic
// ============================================================================

interface AccessResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: 'good' | 'better' | 'best';
}

function checkFeatureAccess(feature: string, features: any, currentTier: string): AccessResult {
  // Feature access rules
  const featureRules: Record<string, (features: any, tier: string) => AccessResult> = {
    // Website limits
    unlimited_websites: (f, t) => {
      if (f.websites === -1) return { allowed: true };
      return {
        allowed: false,
        reason: `Your ${t} tier allows ${f.websites} website${f.websites !== 1 ? 's' : ''}. Upgrade for unlimited.`,
        upgradeRequired: 'best'
      };
    },

    // Audit frequency
    daily_audits: (f, t) => {
      if (f.audits_per_month === -1) return { allowed: true };
      if (f.audits_per_month >= 30) return { allowed: true };
      return {
        allowed: false,
        reason: `Your ${t} tier allows ${f.audits_per_month} audit${f.audits_per_month !== 1 ? 's' : ''} per month. Upgrade for daily audits.`,
        upgradeRequired: 'best'
      };
    },

    weekly_audits: (f, t) => {
      if (f.audits_per_month >= 4) return { allowed: true };
      return {
        allowed: false,
        reason: `Your ${t} tier allows ${f.audits_per_month} audit${f.audits_per_month !== 1 ? 's' : ''} per month. Upgrade for weekly audits.`,
        upgradeRequired: 'better'
      };
    },

    // Keyword limits
    unlimited_keywords: (f, t) => {
      if (f.keywords === -1) return { allowed: true };
      return {
        allowed: false,
        reason: `Your ${t} tier allows ${f.keywords} keywords. Upgrade for unlimited.`,
        upgradeRequired: 'best'
      };
    },

    keywords_500: (f, t) => {
      if (f.keywords >= 500 || f.keywords === -1) return { allowed: true };
      return {
        allowed: false,
        reason: `Your ${t} tier allows ${f.keywords} keywords. Upgrade for 500+ keywords.`,
        upgradeRequired: 'better'
      };
    },

    // Competitor tracking
    unlimited_competitors: (f, t) => {
      if (f.competitors === -1) return { allowed: true };
      return {
        allowed: false,
        reason: `Your ${t} tier allows ${f.competitors} competitor${f.competitors !== 1 ? 's' : ''}. Upgrade for unlimited.`,
        upgradeRequired: 'best'
      };
    },

    competitors_10: (f, t) => {
      if (f.competitors >= 10 || f.competitors === -1) return { allowed: true };
      return {
        allowed: false,
        reason: `Your ${t} tier allows ${f.competitors} competitor${f.competitors !== 1 ? 's' : ''}. Upgrade for 10+ competitors.`,
        upgradeRequired: 'better'
      };
    },

    // Automation features
    ai_autopilot: (f, t) => {
      if (f.auto_publishing === true && f.ai_swarm_coordination === true) return { allowed: true };
      return {
        allowed: false,
        reason: 'Full AI autopilot is only available in Best tier.',
        upgradeRequired: 'best'
      };
    },

    semi_autonomous: (f, t) => {
      if (f.scheduled_reports === true) return { allowed: true };
      return {
        allowed: false,
        reason: 'Semi-autonomous automation is available in Better tier and above.',
        upgradeRequired: 'better'
      };
    },

    auto_publishing: (f, t) => {
      if (f.auto_publishing === true) return { allowed: true };
      return {
        allowed: false,
        reason: 'Auto-publishing is only available in Best tier.',
        upgradeRequired: 'best'
      };
    },

    ai_content_generation: (f, t) => {
      if (f.ai_content_generation === true) return { allowed: true };
      return {
        allowed: false,
        reason: 'AI content generation is available in Better tier and above.',
        upgradeRequired: 'better'
      };
    },

    ai_swarm_coordination: (f, t) => {
      if (f.ai_swarm_coordination === true) return { allowed: true };
      return {
        allowed: false,
        reason: 'AI swarm coordination is only available in Best tier.',
        upgradeRequired: 'best'
      };
    },

    // Support features
    priority_support: (f, t) => {
      if (f.priority_support === true) return { allowed: true };
      return {
        allowed: false,
        reason: 'Priority support is available in Better tier and above.',
        upgradeRequired: 'better'
      };
    },

    dedicated_account_manager: (f, t) => {
      if (f.dedicated_account_manager === true) return { allowed: true };
      return {
        allowed: false,
        reason: 'Dedicated account manager is available in Better tier and above.',
        upgradeRequired: 'better'
      };
    },

    // Advanced features
    white_glove_onboarding: (f, t) => {
      if (f.white_glove_onboarding === true) return { allowed: true };
      return {
        allowed: false,
        reason: 'White-glove onboarding is only available in Best tier.',
        upgradeRequired: 'best'
      };
    },

    custom_integrations: (f, t) => {
      if (f.custom_integrations === true) return { allowed: true };
      return {
        allowed: false,
        reason: 'Custom integrations are only available in Best tier.',
        upgradeRequired: 'best'
      };
    }
  };

  // Check if feature rule exists
  if (featureRules[feature]) {
    return featureRules[feature](features, currentTier);
  }

  // Default: allow if feature not explicitly gated
  console.warn(`[Tier Access] Unknown feature: ${feature}, allowing by default`);
  return { allowed: true };
}
