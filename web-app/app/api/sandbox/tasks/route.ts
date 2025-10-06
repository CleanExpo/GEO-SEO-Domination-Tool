import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/sandbox/tasks?sessionId=xxx - List tasks for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    const { data: tasks, error } = await supabase
      .from('sandbox_tasks')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching sandbox tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST /api/sandbox/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      session_id,
      prompt,
      repo_url,
      selected_agent,
      selected_model,
      install_dependencies,
      max_duration,
    } = body

    if (!session_id || !prompt) {
      return NextResponse.json(
        { error: 'session_id and prompt are required' },
        { status: 400 }
      )
    }

    // Create initial task
    const { data: task, error } = await supabase
      .from('sandbox_tasks')
      .insert({
        session_id,
        prompt,
        repo_url: repo_url || null,
        selected_agent: selected_agent || 'claude',
        selected_model: selected_model || 'claude-sonnet-4-5-20250929',
        install_dependencies: install_dependencies || false,
        max_duration: max_duration || 5,
        status: 'pending',
        progress: 0,
        logs: [
          {
            type: 'info',
            message: 'Task created successfully',
            timestamp: new Date().toISOString(),
          },
        ],
      })
      .select()
      .single()

    if (error) throw error

    // TODO: Trigger Vercel Sandbox execution
    // This would call the Vercel Sandbox API to start code generation
    // For now, we'll simulate with a status update

    // Update task to processing
    setTimeout(async () => {
      await supabase
        .from('sandbox_tasks')
        .update({
          status: 'processing',
          progress: 10,
          logs: [
            ...(task.logs || []),
            {
              type: 'info',
              message: `Starting ${selected_agent} agent...`,
              timestamp: new Date().toISOString(),
            },
          ],
        })
        .eq('id', task.id)
    }, 1000)

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Error creating sandbox task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

// PATCH /api/sandbox/tasks/:id - Update task status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, progress, logs, branch_name, sandbox_url } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const updates: any = {}
    if (status) updates.status = status
    if (progress !== undefined) updates.progress = progress
    if (logs) updates.logs = logs
    if (branch_name) updates.branch_name = branch_name
    if (sandbox_url) updates.sandbox_url = sandbox_url

    const { data: task, error } = await supabase
      .from('sandbox_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error updating sandbox task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}
