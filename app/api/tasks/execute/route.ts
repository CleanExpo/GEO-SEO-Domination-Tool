/**
 * POST /api/tasks/execute
 * Executes a task using the agent swarm orchestrator
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
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

    const db = await getDatabase();

    // Get task from database
    const task = await db.get(
      `SELECT * FROM autonomous_tasks WHERE id = ?`,
      [taskId]
    );

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Update task status to in_progress
    await db.run(
      `UPDATE autonomous_tasks
       SET status = ?, started_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      ['in_progress', taskId]
    );

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
        await db.run(
          `INSERT INTO task_agent_logs
           (task_id, agent_id, result, created_at)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
          [taskId, agentId, JSON.stringify(agentResult)]
        );
      }
    );

    // Update task with result
    await db.run(
      `UPDATE autonomous_tasks
       SET status = ?, result = ?, completed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        result.success ? 'completed' : 'failed',
        JSON.stringify({
          success: result.success,
          executionTime: result.executionTime,
          agentResults: Array.from(result.agentResults.entries()).map(([id, r]) => ({
            agentId: id,
            result: r
          })),
          error: result.error
        }),
        taskId
      ]
    );

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
