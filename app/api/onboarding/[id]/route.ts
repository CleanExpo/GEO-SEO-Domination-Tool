/**
 * Onboarding Status API
 *
 * GET: Get onboarding progress for a specific session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

// Force Node.js runtime (uses database and file system)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const db = getDatabase();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const onboardingId = id;

    // Load from database
    const result = await db.query(
      'SELECT * FROM onboarding_sessions WHERE id = ?',
      [onboardingId]
    );

    const row = result.rows && result.rows.length > 0 ? result.rows[0] : null;

    if (!row) {

      return NextResponse.json(
        {
          success: false,
          error: 'Onboarding session not found',
          onboardingId
        },
        { status: 404 }
      );
    }

    // Parse steps_data (might already be an object in PostgreSQL)
    let steps;
    if (row.steps_data) {
      steps = typeof row.steps_data === 'string'
        ? JSON.parse(row.steps_data)
        : row.steps_data;
    } else {
      steps = [
        { name: 'Create Company Record', status: 'pending' },
        { name: 'Setup Workspace', status: 'pending' },
        { name: 'Run SEO Audit', status: 'pending' },
        { name: 'Generate Content Calendar', status: 'pending' },
        { name: 'Send Welcome Email', status: 'pending' }
      ];
    }

    // Build progress object from database record
    const progress = {
      onboardingId: row.id,
      companyId: row.company_id || '',
      status: row.status || 'pending',
      currentStep: row.current_step || 'Initializing',
      steps,
      startedAt: row.created_at,
      completedAt: row.completed_at || null,
      error: row.error || null
    };

    return NextResponse.json({
      success: true,
      progress
    });
  } catch (error: any) {
    console.error('[Onboarding API] Error getting progress:', error);
    console.error('[Onboarding API] Stack:', error.stack);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get onboarding progress',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
