import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';

/**
 * POST /api/agent-tasks/[id]/reject
 *
 * Reject a task with reason
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const taskId = id;

  try {
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch task
    const { data: task, error: taskError } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Update task as rejected
    const { error: updateError } = await supabase
      .from('agent_tasks')
      .update({
        rejected_by: 'system_user', // TODO: Get actual user ID from auth
        rejected_at: new Date().toISOString(),
        rejection_reason: reason,
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Task rejected successfully',
      task_id: taskId,
      reason,
    });

  } catch (error: any) {
    console.error('[Task Reject] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to reject task',
        details: error.message
      },
      { status: 500 }
    );
  }
}
