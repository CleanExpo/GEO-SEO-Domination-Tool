/**
 * API Route: Feature Flags Management
 * GET /api/feature-flags - List all feature flags
 * POST /api/feature-flags - Create new feature flag
 * PUT /api/feature-flags - Update feature flag
 * Phase 3: FEATURE-001
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// GET - List all feature flags
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organisationId = searchParams.get('organisationId');

    const { data: flags, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    // If organisationId provided, include overrides
    if (organisationId) {
      const { data: overrides } = await supabase
        .from('organisation_feature_overrides')
        .select('feature_flag_id, enabled')
        .eq('organisation_id', organisationId);

      const overrideMap = new Map(
        overrides?.map((o) => [o.feature_flag_id, o.enabled]) || []
      );

      return NextResponse.json({
        flags: flags.map((flag) => ({
          ...flag,
          organisationOverride: overrideMap.get(flag.id),
        })),
      });
    }

    return NextResponse.json({ flags }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// POST - Create new feature flag
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, name, description, enabled, rolloutPercentage, variants } = body;

    if (!key || !name) {
      return NextResponse.json(
        { error: 'key and name are required' },
        { status: 400 }
      );
    }

    const { data: flag, error } = await supabase
      .from('feature_flags')
      .insert({
        key,
        name,
        description,
        enabled: enabled || false,
        rollout_percentage: rolloutPercentage || 0,
        variants,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ flag }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating feature flag:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// PUT - Update feature flag
// ============================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data: flag, error } = await supabase
      .from('feature_flags')
      .update({
        name: updates.name,
        description: updates.description,
        enabled: updates.enabled,
        rollout_percentage: updates.rolloutPercentage,
        variants: updates.variants,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ flag }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating feature flag:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
