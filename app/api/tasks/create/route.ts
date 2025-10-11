/**
 * POST /api/tasks/create
 * Creates a new autonomous task for the agent swarm
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { randomUUID } from 'crypto';

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

    const supabase = createAdminClient();
    const taskId = randomUUID();

    // Create task in database
    const { data: task, error: insertError } = await supabase
      .from('autonomous_tasks')
      .insert([{
        id: taskId,
        title,
        description,
        input_type: inputType,
        workflow_id: workflow || 'content-opportunity-discovery',
        status: 'queued',
        priority,
        metadata,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create task: ${insertError.message}`);
    }

    return NextResponse.json({
      success: true,
      task
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
