/**
 * API Route: Feature Flag Evaluation
 * POST /api/feature-flags/evaluate - Evaluate a feature flag for user/org context
 * Phase 3: FEATURE-001
 */

import { NextRequest, NextResponse } from 'next/server';
import { FeatureFlagService, FeatureFlagContext } from '@/lib/feature-flags';

const featureFlagService = new FeatureFlagService(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flagKey, context } = body as {
      flagKey: string;
      context: FeatureFlagContext;
    };

    if (!flagKey) {
      return NextResponse.json({ error: 'flagKey is required' }, { status: 400 });
    }

    const result = await featureFlagService.evaluateFlag(flagKey, context || {});

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error evaluating feature flag:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
