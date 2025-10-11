import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';

const automationRuleSchema = z.object({
  company_id: z.string().uuid('Valid company ID is required'),
  rule_name: z.string().min(1, 'Rule name is required'),
  description: z.string().optional(),
  trigger_type: z.enum(['audit_completed', 'score_dropped', 'schedule', 'manual', 'webhook']),
  trigger_conditions: z.record(z.any()).optional(),
  auto_create_tasks: z.boolean().default(true),
  auto_execute_tasks: z.boolean().default(false),
  require_approval: z.boolean().default(true),
  task_types_included: z.array(z.string()).optional(),
  task_types_excluded: z.array(z.string()).optional(),
  max_tasks_per_audit: z.number().int().min(1).max(100).default(20),
  priority_threshold: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

/**
 * GET /api/post-audit/automated-audits
 *
 * Retrieves automation rules for a specific company.
 *
 * Query params:
 * - company_id (required): UUID of the company
 * - is_active (optional): Filter by active status (default: all)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const isActive = searchParams.get('is_active');

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id query parameter is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    let query = supabase
      .from('automation_rules')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    // Apply active filter if provided
    if (isActive !== null) {
      const activeBoolean = isActive === 'true';
      query = query.eq('is_active', activeBoolean);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Automated Audits API] Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      rules: data || []
    });
  } catch (error: any) {
    console.error('[Automated Audits API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch automation rules' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/post-audit/automated-audits
 *
 * Creates a new automation rule for a company.
 *
 * Body:
 * - company_id: UUID of the company
 * - rule_name: Name of the automation rule
 * - description: Description of what the rule does
 * - trigger_type: When to trigger ('audit_completed', 'score_dropped', 'schedule', 'manual', 'webhook')
 * - trigger_conditions: JSON conditions for triggering
 * - auto_create_tasks: Whether to automatically create tasks
 * - auto_execute_tasks: Whether to automatically execute tasks
 * - require_approval: Whether tasks require approval
 * - task_types_included: Array of task types to include
 * - task_types_excluded: Array of task types to exclude
 * - max_tasks_per_audit: Maximum number of tasks to create per audit
 * - priority_threshold: Minimum priority level for task creation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = automationRuleSchema.parse(body);

    const supabase = createAdminClient();

    // Insert automation rule
    const { data, error } = await supabase
      .from('automation_rules')
      .insert([{
        ...validatedData,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('[Automated Audits API] Insert error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { rule: data },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Automated Audits API] Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to create automation rule' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/post-audit/automated-audits
 *
 * Updates an existing automation rule.
 *
 * Body:
 * - id: UUID of the rule to update
 * - Updates to rule configuration (optional)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('automation_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Automated Audits API] Update error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ rule: data });
  } catch (error: any) {
    console.error('[Automated Audits API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update automation rule' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/post-audit/automated-audits
 *
 * Deletes an automation rule.
 *
 * Query params:
 * - id: UUID of the rule to delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Automated Audits API] Delete error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Automated Audits API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete automation rule' },
      { status: 500 }
    );
  }
}
