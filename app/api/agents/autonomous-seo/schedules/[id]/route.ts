import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';
import type { AgentSchedule } from '@/types/agent';

const scheduleUpdateSchema = z.object({
  type: z.enum(['audit', 'content', 'technical', 'rankings']).optional(),
  frequency: z.enum(['daily', 'weekly', 'custom']).optional(),
  time: z.string().optional(),
  cron_expression: z.string().optional(),
  enabled: z.boolean().optional(),
  companies: z.array(z.string().uuid()).optional(),
  config: z.any().optional(),
});

// PUT /api/agents/autonomous-seo/schedules/[id] - Update schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;
    const body = await request.json();

    // Validate input
    const validatedData = scheduleUpdateSchema.parse(body);

    const { data, error } = await supabase
      .from('agent_schedules')
      .update({ ...validatedData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Agent Schedules API] Update error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return NextResponse.json({ schedule: data as AgentSchedule });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Agent Schedules API] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/autonomous-seo/schedules/[id] - Delete schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const { error } = await supabase
      .from('agent_schedules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Agent Schedules API] Delete error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Agent Schedules API] Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
