/**
 * POST /api/tasks/create
 * Creates a new autonomous task for the agent swarm
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      inputType = 'text',
      workflow,
      priority = 'medium',
      metadata = {}
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Create task in database
    const result = await db.run(
      `INSERT INTO autonomous_tasks
       (title, description, input_type, workflow_id, status, priority, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        title,
        description,
        inputType,
        workflow || 'content-opportunity-discovery',
        'queued',
        priority,
        JSON.stringify(metadata)
      ]
    );

    const taskId = result.lastID;

    // Return created task
    const task = await db.get(
      `SELECT * FROM autonomous_tasks WHERE id = ?`,
      [taskId]
    );

    return NextResponse.json({
      success: true,
      task: {
        ...task,
        metadata: JSON.parse(task.metadata || '{}')
      }
    });
  } catch (error: any) {
    console.error('Task creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create task',
        details: error.message
      },
      { status: 500 }
    );
  }
}
