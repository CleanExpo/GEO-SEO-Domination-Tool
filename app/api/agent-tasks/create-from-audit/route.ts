import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { mapAuditToTasks } from '@/lib/audit-to-task-mapper';

/**
 * POST /api/agent-tasks/create-from-audit
 * 
 * Auto-generate agent tasks from completed SEO audit
 * Uses intelligent mapping to create actionable tasks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audit_id, company_id, auto_execute = false } = body;

    if (!audit_id || !company_id) {
      return NextResponse.json(
        { error: 'audit_id and company_id required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch audit results
    const { data: audit, error: auditError } = await supabase
      .from('seo_audits')
      .select('*')
      .eq('id', audit_id)
      .single();

    if (auditError || !audit) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      );
    }

    // Map audit findings to tasks using intelligent mapper
    const tasks = await mapAuditToTasks(audit, company_id);

    if (tasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No tasks generated - audit passed all checks',
        tasks: [],
        task_count: 0,
      });
    }

    // Insert tasks into database
    const { data: createdTasks, error: insertError } = await supabase
      .from('agent_tasks')
      .insert(tasks)
      .select();

    if (insertError) {
      throw new Error(`Failed to create tasks: ${insertError.message}`);
    }

    // Group tasks by category for summary
    const tasksByCategory = createdTasks.reduce((acc: any, task: any) => {
      if (!acc[task.category]) {
        acc[task.category] = [];
      }
      acc[task.category].push(task);
      return acc;
    }, {});

    // Calculate summary statistics
    const summary = {
      total_tasks: createdTasks.length,
      by_category: Object.keys(tasksByCategory).map(category => ({
        category,
        count: tasksByCategory[category].length,
        tasks: tasksByCategory[category].map((t: any) => ({
          id: t.id,
          task_type: t.task_type,
          priority: t.priority,
          page_url: t.page_url,
        })),
      })),
      by_priority: {
        critical: createdTasks.filter((t: any) => t.priority === 'critical').length,
        high: createdTasks.filter((t: any) => t.priority === 'high').length,
        medium: createdTasks.filter((t: any) => t.priority === 'medium').length,
        low: createdTasks.filter((t: any) => t.priority === 'low').length,
      },
      estimated_total_time: createdTasks.reduce(
        (sum: number, t: any) => sum + (t.estimated_time_seconds || 0),
        0
      ),
    };

    return NextResponse.json({
      success: true,
      message: `Created ${createdTasks.length} tasks from audit`,
      audit_id,
      company_id,
      tasks: createdTasks,
      summary,
      auto_execute,
    });

  } catch (error: any) {
    console.error('[Task Generator] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate tasks from audit',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent-tasks/create-from-audit?audit_id=xxx
 * 
 * Preview tasks that would be created from audit (dry-run)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auditId = searchParams.get('audit_id');
    const companyId = searchParams.get('company_id');

    if (!auditId || !companyId) {
      return NextResponse.json(
        { error: 'audit_id and company_id required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch audit
    const { data: audit, error } = await supabase
      .from('seo_audits')
      .select('*')
      .eq('id', auditId)
      .single();

    if (error || !audit) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      );
    }

    // Generate task preview without saving
    const tasks = await mapAuditToTasks(audit, companyId);

    // Group by category
    const tasksByCategory = tasks.reduce((acc: any, task: any) => {
      if (!acc[task.category]) {
        acc[task.category] = [];
      }
      acc[task.category].push(task);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      preview: true,
      audit_id: auditId,
      company_id: companyId,
      task_count: tasks.length,
      tasks,
      summary: {
        total_tasks: tasks.length,
        by_category: Object.keys(tasksByCategory).map(category => ({
          category,
          count: tasksByCategory[category].length,
        })),
        by_priority: {
          critical: tasks.filter(t => t.priority === 'critical').length,
          high: tasks.filter(t => t.priority === 'high').length,
          medium: tasks.filter(t => t.priority === 'medium').length,
          low: tasks.filter(t => t.priority === 'low').length,
        },
        estimated_total_time: tasks.reduce(
          (sum, t) => sum + (t.estimated_time_seconds || 0),
          0
        ),
      },
    });

  } catch (error: any) {
    console.error('[Task Generator] Preview error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to preview tasks',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
