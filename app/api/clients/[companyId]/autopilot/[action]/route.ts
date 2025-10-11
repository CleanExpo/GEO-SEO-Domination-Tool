import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';
import type { CompanyAutopilot } from '@/types/agent';

const enableSchema = z.object({
  schedule: z.string().default('daily'),
  features: z.array(z.string()).default(['audits', 'content', 'technical']),
});

// GET /api/clients/[companyId]/autopilot/[action]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; action: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { companyId, action } = await params;

    if (action === 'status') {
      // Get autopilot status for company
      const { data, error } = await supabase
        .from('company_autopilot')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[Autopilot API] Status error:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      // Return default status if not configured
      const autopilot: CompanyAutopilot = data || {
        company_id: companyId,
        enabled: false,
        schedule: 'daily',
        features: [],
        stats: {},
      };

      return NextResponse.json(autopilot);
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Autopilot API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get autopilot status' },
      { status: 500 }
    );
  }
}

// POST /api/clients/[companyId]/autopilot/[action]
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; action: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { companyId, action } = await params;

    if (action === 'enable') {
      const body = await request.json();
      const validatedData = enableSchema.parse(body);

      // Check if autopilot config exists
      const { data: existing } = await supabase
        .from('company_autopilot')
        .select('*')
        .eq('company_id', companyId)
        .single();

      let data, error;

      if (existing) {
        // Update existing config
        ({ data, error } = await supabase
          .from('company_autopilot')
          .update({
            enabled: true,
            schedule: validatedData.schedule,
            features: validatedData.features,
            updated_at: new Date().toISOString(),
          })
          .eq('company_id', companyId)
          .select()
          .single());
      } else {
        // Create new config
        ({ data, error } = await supabase
          .from('company_autopilot')
          .insert([{
            company_id: companyId,
            enabled: true,
            schedule: validatedData.schedule,
            features: validatedData.features,
          }])
          .select()
          .single());
      }

      if (error) {
        console.error('[Autopilot API] Enable error:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, autopilot: data });
    }

    if (action === 'disable') {
      const { error } = await supabase
        .from('company_autopilot')
        .update({
          enabled: false,
          updated_at: new Date().toISOString(),
        })
        .eq('company_id', companyId);

      if (error) {
        console.error('[Autopilot API] Disable error:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'run-now') {
      // Trigger immediate agent run for this company
      // TODO: Implement actual agent execution logic

      const execution_id = `exec-${companyId}-${Date.now()}`;

      return NextResponse.json({
        execution_id,
        message: 'Agent execution started for company',
      });
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Autopilot API] Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to execute autopilot action' },
      { status: 500 }
    );
  }
}
