import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';
import type { Job, JobExecution } from '@/types/projects';

const jobUpdateSchema = z.object({
  type: z.enum(['audit', 'ranking', 'report']).optional(),
  schedule: z.string().optional(),
  config: z.any().optional(),
  enabled: z.boolean().optional(),
});

// GET /api/jobs/[id] - Get job details with execution history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (jobError) {
      console.error('[Jobs API] Get error:', jobError);
      return NextResponse.json(
        { error: jobError.message },
        { status: jobError.code === 'PGRST116' ? 404 : 500 }
      );
    }

    // Fetch execution history
    const { data: executions, error: execError } = await supabase
      .from('job_executions')
      .select('*')
      .eq('job_id', id)
      .order('started_at', { ascending: false })
      .limit(50);

    return NextResponse.json({
      job: job as Job,
      executions: (executions || []) as JobExecution[],
    });
  } catch (error: any) {
    console.error('[Jobs API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

// PUT /api/jobs/[id] - Update job
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = jobUpdateSchema.parse(body);

    const { data, error } = await supabase
      .from('scheduled_jobs')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Jobs API] Update error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return NextResponse.json({ job: data as Job });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Jobs API] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id] - Delete job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;

    const { error } = await supabase
      .from('scheduled_jobs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Jobs API] Delete error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Jobs API] Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete job' },
      { status: 500 }
    );
  }
}
