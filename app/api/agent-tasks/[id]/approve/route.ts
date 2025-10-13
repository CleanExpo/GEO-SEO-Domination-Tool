import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';

/**
 * POST /api/agent-tasks/[id]/approve
 *
 * Approve a task that requires review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const taskId = id;

  try {
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

    // Check if task requires approval
    if (task.status !== 'requires_review' && !task.requires_approval) {
      return NextResponse.json(
        { error: 'Task does not require approval' },
        { status: 400 }
      );
    }

    // Update task as approved
    const { error: updateError } = await supabase
      .from('agent_tasks')
      .update({
        approved_by: 'system_user', // TODO: Get actual user ID from auth
        approved_at: new Date().toISOString(),
        status: 'pending', // Move to pending so it can be executed
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Task approved successfully',
      task_id: taskId,
    });

  } catch (error: any) {
    console.error('[Task Approve] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to approve task',
        details: error.message
      },
      { status: 500 }
    );
  }
}
