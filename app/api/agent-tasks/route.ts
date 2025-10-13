import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';

/**
 * GET /api/agent-tasks?company_id=xxx&status=pending
 *
 * Fetch agent tasks with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const status = searchParams.get('status'); // 'pending', 'in_progress', 'completed', 'failed'
    const category = searchParams.get('category'); // 'content', 'performance', 'seo', etc.
    const priority = searchParams.get('priority'); // 'critical', 'high', 'medium', 'low'

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Build query
    let query = supabase
      .from('agent_tasks')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: tasks, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Group tasks by status for summary
    const tasksByStatus = {
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      requires_review: tasks.filter(t => t.status === 'requires_review').length,
    };

    // Group by category
    const tasksByCategory = tasks.reduce((acc: any, task: any) => {
      if (!acc[task.category]) {
        acc[task.category] = 0;
      }
      acc[task.category]++;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      tasks,
      total: tasks.length,
      summary: {
        by_status: tasksByStatus,
        by_category: tasksByCategory,
      },
    });

  } catch (error: any) {
    console.error('[Agent Tasks API] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch agent tasks',
        details: error.message
      },
      { status: 500 }
    );
  }
}
