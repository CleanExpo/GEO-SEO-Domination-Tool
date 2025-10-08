// API: Get client tasks from execution calendar
// GET /api/clients/[id]/tasks

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/init';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // Optional: filter by month (YYYY-MM)

    // Get subscription first
    const subscription = await db.get<any>(
      `SELECT id FROM client_subscriptions WHERE company_id = ? AND status = 'active' LIMIT 1`,
      [companyId]
    );

    if (!subscription) {
      return NextResponse.json({
        success: false,
        error: 'No active subscription found'
      }, { status: 404 });
    }

    // Build query
    let query = `
      SELECT
        id,
        subscription_id,
        scheduled_date,
        scheduled_time,
        task_type,
        task_category,
        priority,
        task_config,
        status,
        ruler_score,
        result_summary,
        execution_started_at,
        execution_completed_at
      FROM task_execution_calendar
      WHERE subscription_id = ?
    `;

    const params_arr: any[] = [subscription.id];

    if (month) {
      query += ` AND strftime('%Y-%m', scheduled_date) = ?`;
      params_arr.push(month);
    }

    query += ` ORDER BY scheduled_date, scheduled_time`;

    const tasks = await db.all<any>(query, params_arr);

    // Format tasks for circular visualizer
    const formattedTasks = tasks.map(task => ({
      id: task.id.toString(),
      type: task.task_type,
      status: task.status,
      priority: task.priority,
      scheduledDate: task.scheduled_date,
      scheduledTime: task.scheduled_time,
      category: task.task_category,
      config: task.task_config ? JSON.parse(task.task_config) : {},
      rulerScore: task.ruler_score,
      resultSummary: task.result_summary ? JSON.parse(task.result_summary) : null,
      executionStartedAt: task.execution_started_at,
      executionCompletedAt: task.execution_completed_at
    }));

    // Get stats
    const stats = {
      total: formattedTasks.length,
      scheduled: formattedTasks.filter(t => t.status === 'scheduled').length,
      executing: formattedTasks.filter(t => t.status === 'executing').length,
      completed: formattedTasks.filter(t => t.status === 'completed').length,
      failed: formattedTasks.filter(t => t.status === 'failed').length
    };

    return NextResponse.json({
      success: true,
      tasks: formattedTasks,
      stats,
      subscriptionId: subscription.id
    });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
