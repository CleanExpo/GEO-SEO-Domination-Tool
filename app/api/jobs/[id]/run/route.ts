import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';

// POST /api/jobs/[id]/run - Trigger immediate job execution
export async function POST(
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
      console.error('[Jobs Run API] Job not found:', jobError);
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Create execution record
    const { data: execution, error: execError } = await supabase
      .from('job_executions')
      .insert([{
        job_id: id,
        status: 'running',
        started_at: new Date().toISOString(),
        logs: 'Manual execution triggered',
      }])
      .select()
      .single();

    if (execError) {
      console.error('[Jobs Run API] Failed to create execution:', execError);
      return NextResponse.json(
        { error: 'Failed to start job execution' },
        { status: 500 }
      );
    }

    // TODO: Trigger actual job execution based on job.type
    // For now, just mark as completed
    setTimeout(async () => {
      await supabase
        .from('job_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          logs: 'Job execution completed successfully (placeholder)',
        })
        .eq('id', execution.id);
    }, 1000);

    return NextResponse.json({
      execution_id: execution.id,
      status: 'running',
      message: 'Job execution started',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Jobs Run API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run job' },
      { status: 500 }
    );
  }
}
