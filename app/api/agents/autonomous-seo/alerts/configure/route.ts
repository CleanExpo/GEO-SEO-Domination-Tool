import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';
import type { AlertConfig } from '@/types/agent';

const alertConfigSchema = z.object({
  ranking_drop_threshold: z.number().min(1).max(100).default(5),
  performance_drop_threshold: z.number().min(1).max(100).default(20),
  channels: z.array(z.string()).default(['email']),
  frequency: z.enum(['immediate', 'hourly', 'daily_digest']).default('immediate'),
  user_id: z.string().uuid().optional(),
});

// POST /api/agents/autonomous-seo/alerts/configure - Configure alert settings
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    // Validate input
    const validatedData = alertConfigSchema.parse(body);

    // Check if config exists for user
    const { data: existing } = await supabase
      .from('agent_alert_config')
      .select('*')
      .eq('user_id', validatedData.user_id || 'system')
      .single();

    let data, error;

    if (existing) {
      // Update existing config
      ({ data, error } = await supabase
        .from('agent_alert_config')
        .update({ ...validatedData, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single());
    } else {
      // Create new config
      ({ data, error } = await supabase
        .from('agent_alert_config')
        .insert([validatedData])
        .select()
        .single());
    }

    if (error) {
      console.error('[Agent Alert Config API] Error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      config: data as AlertConfig,
    }, { status: existing ? 200 : 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Agent Alert Config API] Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to configure alerts' },
      { status: 500 }
    );
  }
}

// GET /api/agents/autonomous-seo/alerts/configure - Get current alert config
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id') || 'system';

    const { data, error } = await supabase
      .from('agent_alert_config')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Agent Alert Config API] Get error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Return default config if none exists
    const config = data || {
      ranking_drop_threshold: 5,
      performance_drop_threshold: 20,
      channels: ['email'],
      frequency: 'immediate',
    };

    return NextResponse.json({ config });
  } catch (error: any) {
    console.error('[Agent Alert Config API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch alert config' },
      { status: 500 }
    );
  }
}
