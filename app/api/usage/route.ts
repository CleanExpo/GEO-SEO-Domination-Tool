import { NextRequest, NextResponse } from 'next/server';
import { usageTracker } from '@/services/usage-tracker';
import { getCurrentOrganisationId } from '@/lib/tenant-context';

/**
 * GET /api/usage
 * Get usage status and alerts for the current organisation
 */
export async function GET(request: NextRequest) {
  try {
    const organisationId = await getCurrentOrganisationId();

    if (!organisationId) {
      return NextResponse.json({ error: 'No organisation context' }, { status: 401 });
    }

    const quotaStatus = await usageTracker.getQuotaStatus(organisationId);
    const alerts = await usageTracker.getAlerts(organisationId);

    return NextResponse.json({
      quota: quotaStatus,
      alerts,
    });
  } catch (error: any) {
    console.error('Failed to get usage data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/usage
 * Log a usage event (for manual tracking if needed)
 */
export async function POST(request: NextRequest) {
  try {
    const organisationId = await getCurrentOrganisationId();

    if (!organisationId) {
      return NextResponse.json({ error: 'No organisation context' }, { status: 401 });
    }

    const body = await request.json();
    const { eventType, resource, quantity, metadata } = body;

    if (!eventType || !resource) {
      return NextResponse.json({ error: 'eventType and resource are required' }, { status: 400 });
    }

    await usageTracker.logEvent({
      organisationId,
      eventType,
      resource,
      quantity,
      metadata,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to log usage event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
