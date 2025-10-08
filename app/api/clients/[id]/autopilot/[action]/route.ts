// API: Pause or Resume Autopilot
// POST /api/clients/[id]/autopilot/pause
// POST /api/clients/[id]/autopilot/resume

import { NextRequest, NextResponse } from 'next/server';
import { getClientAutopilotAgent } from '@/services/agents/client-autopilot-agent';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; action: string } }
) {
  try {
    const companyId = parseInt(params.id);
    const action = params.action;

    if (!['pause', 'resume'].includes(action)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use "pause" or "resume"'
      }, { status: 400 });
    }

    // Get autopilot agent
    const autopilotAgent = await getClientAutopilotAgent();

    // Get subscription
    const { db } = await import('@/database/init');
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

    // Perform action
    if (action === 'pause') {
      await autopilotAgent.pauseAutopilot(subscription.id);
    } else {
      await autopilotAgent.resumeAutopilot(subscription.id);
    }

    return NextResponse.json({
      success: true,
      message: `Autopilot ${action}d successfully`,
      action,
      subscriptionId: subscription.id
    });
  } catch (error: any) {
    console.error(`Error ${params.action}ing autopilot:`, error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
