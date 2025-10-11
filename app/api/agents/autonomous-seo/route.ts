import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';
import type { AgentStatus, AgentSchedule, AgentAlert } from '@/types/agent';

const scheduleSchema = z.object({
  type: z.enum(['audit', 'content', 'technical', 'rankings']),
  frequency: z.enum(['daily', 'weekly', 'custom']),
  time: z.string().optional(),
  cron_expression: z.string().optional(),
  companies: z.array(z.string().uuid()).optional(),
  config: z.any().optional(),
});

// GET /api/agents/autonomous-seo - Handle various agent queries based on action param
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Handle status query
    if (action === 'status') {
      // Get agent statistics
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: auditsToday } = await supabase
        .from('audits')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      const { count: alertsSent } = await supabase
        .from('agent_alerts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      const status: AgentStatus = {
        status: 'running',
        current_task: 'Monitoring SEO performance',
        last_run: new Date().toISOString(),
        next_run: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        stats: {
          audits_today: auditsToday || 0,
          content_generated: 0, // TODO: Track this
          issues_fixed: 0, // TODO: Track this
          alerts_sent: alertsSent || 0,
        },
      };

      return NextResponse.json(status);
    }

    // Handle schedules query
    if (action === 'schedules') {
      const { data, error } = await supabase
        .from('agent_schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Agent API] Schedules error:', error);
        return NextResponse.json(
          { schedules: [], error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ schedules: data as AgentSchedule[] || [] });
    }

    // Handle alerts query
    if (action === 'alerts') {
      const limit = parseInt(searchParams.get('limit') || '50');
      const type = searchParams.get('type');
      const company_id = searchParams.get('company_id');

      let query = supabase
        .from('agent_alerts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (type) {
        query = query.eq('type', type);
      }
      if (company_id) {
        query = query.eq('company_id', company_id);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('[Agent API] Alerts error:', error);
        return NextResponse.json(
          { alerts: [], total: 0, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        alerts: data as AgentAlert[] || [],
        total: count || 0,
      });
    }

    // Handle recent-audits query
    if (action === 'recent-audits') {
      const limit = parseInt(searchParams.get('limit') || '10');
      const company_id = searchParams.get('company_id');

      let query = supabase
        .from('audits')
        .select(`
          id,
          company_id,
          performance_score,
          accessibility_score,
          best_practices_score,
          seo_score,
          created_at,
          companies (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (company_id) {
        query = query.eq('company_id', company_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Agent API] Recent audits error:', error);
        return NextResponse.json(
          { audits: [], error: error.message },
          { status: 500 }
        );
      }

      const audits = data?.map((audit: any) => ({
        id: audit.id,
        company_id: audit.company_id,
        company_name: audit.companies?.name || 'Unknown',
        score: Math.round((
          (audit.performance_score || 0) +
          (audit.accessibility_score || 0) +
          (audit.best_practices_score || 0) +
          (audit.seo_score || 0)
        ) / 4),
        issues_found: 0, // TODO: Calculate from audit data
        issues_fixed: 0, // TODO: Track this
        run_at: audit.created_at,
        duration_ms: 45000, // Placeholder
      }));

      return NextResponse.json({ audits: audits || [] });
    }

    // Default response for unknown action
    return NextResponse.json(
      { error: 'Unknown action parameter' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Agent API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Agent API error' },
      { status: 500 }
    );
  }
}

// POST /api/agents/autonomous-seo - Handle agent actions (pause/resume/schedules)
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Handle pause action
    if (action === 'pause') {
      // TODO: Implement actual pause logic (stop cron jobs)
      return NextResponse.json({
        success: true,
        status: 'paused',
      });
    }

    // Handle resume action
    if (action === 'resume') {
      // TODO: Implement actual resume logic (start cron jobs)
      return NextResponse.json({
        success: true,
        status: 'running',
      });
    }

    // Handle create schedule action
    if (action === 'schedules') {
      const body = await request.json();
      const validatedData = scheduleSchema.parse(body);

      const { data, error } = await supabase
        .from('agent_schedules')
        .insert([validatedData])
        .select()
        .single();

      if (error) {
        console.error('[Agent API] Create schedule error:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ schedule: data as AgentSchedule }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Unknown action parameter' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Agent API] Fatal error:', error);
    return NextResponse.json(
      { error: 'Agent API error' },
      { status: 500 }
    );
  }
}
