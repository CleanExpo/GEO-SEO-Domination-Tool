/**
 * Agent Task API
 * Get status, cancel, or retrieve results for specific tasks
 */

import { NextRequest } from 'next/server';
import { agentPool } from '@/services/agents/agent-pool';

/**
 * GET: Get task status and details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const { taskId } = params;

  try {
    const task = agentPool.getTask(taskId);

    if (!task) {
      return Response.json({
        error: 'Task not found',
        task_id: taskId
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      task: {
        id: task.id,
        agent_name: task.agentName,
        status: task.status,
        priority: task.priority,
        created_at: task.createdAt,
        started_at: task.startedAt,
        completed_at: task.completedAt,
        result: task.result,
        error: task.error,
        checkpoints: task.checkpoints.map(cp => ({
          id: cp.id,
          timestamp: cp.timestamp,
          state: cp.state,
          content: cp.content,
          tool_calls: cp.toolCalls
        })),
        context: {
          workspace_id: task.context.workspaceId,
          client_id: task.context.clientId
        }
      }
    });

  } catch (error) {
    console.error('Failed to get task:', error);
    return Response.json({
      error: 'Failed to get task',
      message: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * DELETE: Cancel a running or queued task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const { taskId } = params;

  try {
    const cancelled = agentPool.cancelTask(taskId);

    if (!cancelled) {
      return Response.json({
        error: 'Task not found or already completed',
        task_id: taskId
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      task_id: taskId,
      message: 'Task cancelled successfully'
    });

  } catch (error) {
    console.error('Failed to cancel task:', error);
    return Response.json({
      error: 'Failed to cancel task',
      message: (error as Error).message
    }, { status: 500 });
  }
}
