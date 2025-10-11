import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';

// POST /api/agents/autonomous-seo/alerts/[id]/acknowledge - Acknowledge alert
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const { data, error } = await supabase
      .from('agent_alerts')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Agent Alerts API] Acknowledge error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return NextResponse.json({ success: true, alert: data });
  } catch (error: any) {
    console.error('[Agent Alerts API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to acknowledge alert' },
      { status: 500 }
    );
  }
}
