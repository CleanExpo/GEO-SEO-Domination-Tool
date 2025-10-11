/**
 * POST /api/tasks/execute
 * Executes a task using the agent swarm orchestrator
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { orchestrator } from '@/services/agents/orchestrator';
import { AgentTask } from '@/services/agents/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get task from database
    const { data: task, error: taskError } = await supabase
      .from('autonomous_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Update task status to in_progress
    await supabase
      .from('autonomous_tasks')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', taskId);

    // Prepare agent task
    const agentTask: AgentTask = {
      id: taskId.toString(),
      description: task.description,
      assignedAgent: task.workflow_id || 'content-opportunity-discovery',
      status: 'in_progress',
      priority: task.priority,
      context: {
        taskId: taskId.toString(),
        history: [],
        variables: {},
        sessionData: JSON.parse(task.metadata || '{}')
      },
      createdAt: Date.now()
    };

    // Execute workflow
    const result = await orchestrator.executeWorkflow(
      task.workflow_id || 'content-opportunity-discovery',
      agentTask,
      async (agentId, agentResult) => {
        // Log progress to database
        await supabase
          .from('task_agent_logs')
          .insert([{
            task_id: taskId,
            agent_id: agentId,
            result: agentResult,
            created_at: new Date().toISOString()
          }]);
      }
    );

    // Update task with result
    await supabase
      .from('autonomous_tasks')
      .update({
        status: result.success ? 'completed' : 'failed',
        result: {
          success: result.success,
          executionTime: result.executionTime,
          agentResults: Array.from(result.agentResults.entries()).map(([id, r]) => ({
            agentId: id,
            result: r
          })),
          error: result.error
        },
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId);

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        agentResults: Array.from(result.agentResults.entries()).map(([id, r]) => ({
          agentId: id,
          result: r
        }))
      }
    });
  } catch (error: any) {
    console.error('Task execution error:', error);
    return NextResponse.json(
      {
        error: 'Failed to execute task',
        details: error.message
      },
      { status: 500 }
    );
  }
}
