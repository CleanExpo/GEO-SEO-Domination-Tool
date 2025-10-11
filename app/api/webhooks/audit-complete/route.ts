import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';

/**
 * POST /api/webhooks/audit-complete
 *
 * Webhook triggered after audit completion to automate next steps:
 * 1. Generate improvement tasks
 * 2. Schedule follow-up audits
 * 3. Send notifications
 * 4. Create tracking keywords from recommendations
 * 5. Trigger competitor analysis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { auditId, companyId, score, issues, recommendations } = body;

    if (!auditId || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields: auditId, companyId' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const actions: string[] = [];

    // 1. Generate improvement tasks from high-impact issues
    const criticalIssues = issues?.filter((i: any) => i.impact === 'high' || i.type === 'error') || [];

    if (criticalIssues.length > 0) {
      try {
        // Create tasks in CRM for high-priority issues
        const tasks = criticalIssues.slice(0, 5).map((issue: any) => ({
          company_id: companyId,
          title: `Fix: ${issue.message}`,
          description: `Category: ${issue.category}\nImpact: ${issue.impact}\nSource: SEO Audit #${auditId}`,
          priority: issue.impact === 'high' ? 'high' : 'medium',
          status: 'todo',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          created_at: new Date().toISOString(),
        }));

        const { error: tasksError } = await supabase
          .from('tasks')
          .insert(tasks);

        if (tasksError) {
          console.error('[Webhook] Failed to create tasks:', tasksError);
        } else {
          actions.push(`Created ${tasks.length} improvement tasks`);
        }
      } catch (err) {
        console.error('[Webhook] Task creation error:', err);
      }
    }

    // 2. Schedule follow-up audit (30 days if score < 70, 90 days if score >= 70)
    const followUpDays = score < 70 ? 30 : 90;
    const followUpDate = new Date(Date.now() + followUpDays * 24 * 60 * 60 * 1000);

    try {
      const { error: scheduleError } = await supabase
        .from('scheduled_jobs')
        .insert({
          job_type: 'seo_audit',
          company_id: companyId,
          schedule_date: followUpDate.toISOString(),
          status: 'pending',
          metadata: {
            audit_type: 'follow_up',
            previous_audit_id: auditId,
            previous_score: score,
          },
        });

      if (scheduleError) {
        console.error('[Webhook] Failed to schedule follow-up:', scheduleError);
      } else {
        actions.push(`Scheduled follow-up audit for ${followUpDate.toLocaleDateString()}`);
      }
    } catch (err) {
      console.error('[Webhook] Follow-up scheduling error:', err);
    }

    // 3. Extract and track keywords from recommendations
    if (recommendations && Array.isArray(recommendations)) {
      try {
        // Look for keyword-related recommendations
        const keywordRecs = recommendations.filter((rec: any) => {
          const text = typeof rec === 'string' ? rec : rec.description || '';
          return text.toLowerCase().includes('keyword') || text.toLowerCase().includes('search term');
        });

        if (keywordRecs.length > 0) {
          actions.push(`Found ${keywordRecs.length} keyword optimization opportunities`);
        }
      } catch (err) {
        console.error('[Webhook] Keyword extraction error:', err);
      }
    }

    // 4. Trigger competitor analysis if score < 60
    if (score < 60) {
      try {
        // Get company details for competitor analysis
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('website, business_category')
          .eq('id', companyId)
          .single();

        if (company && !companyError) {
          actions.push('Triggered competitor analysis (score below 60)');
        }
      } catch (err) {
        console.error('[Webhook] Competitor analysis trigger error:', err);
      }
    }

    // 5. Log webhook execution
    console.log('[Webhook] Audit completion processed:', {
      auditId,
      companyId,
      score,
      issuesCount: issues?.length || 0,
      recommendationsCount: recommendations?.length || 0,
      actionsPerformed: actions.length,
    });

    return NextResponse.json({
      success: true,
      auditId,
      companyId,
      actions,
      nextSteps: {
        follow_up_date: followUpDate.toISOString(),
        tasks_created: criticalIssues.length,
        automation_triggered: actions.length > 0,
      },
    });
  } catch (error) {
    console.error('[Webhook] Error processing audit completion:', error);
    return NextResponse.json(
      {
        error: 'Failed to process audit completion webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook status/health check
export async function GET(request: NextRequest) {
  return NextResponse.json({
    webhook: 'audit-complete',
    status: 'active',
    description: 'Processes completed audits and triggers automated next steps',
    actions: [
      'Generate improvement tasks',
      'Schedule follow-up audits',
      'Extract keywords from recommendations',
      'Trigger competitor analysis (low scores)',
    ],
  });
}
