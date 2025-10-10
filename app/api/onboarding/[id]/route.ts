/**
 * Onboarding Status API
 *
 * GET: Get onboarding progress for a specific session
 */

import { NextRequest, NextResponse } from 'next/server';
import { onboardingOrchestrator } from '@/services/onboarding/onboarding-orchestrator';
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

    console.log(`[Onboarding API] Getting progress for: ${onboardingId}`);

    // Try to get from memory first
    let progress = onboardingOrchestrator.getProgress(onboardingId);

    // If not in memory, load from database
    if (!progress) {
      console.log(`[Onboarding API] Not in memory, checking database...`);

      const result = await db.query(
        'SELECT * FROM onboarding_sessions WHERE id = ?',
        [onboardingId]
      );

      const row = result.rows ? result.rows[0] : result[0];

      if (!row) {
        console.log(`[Onboarding API] Session not found in database`);
        return NextResponse.json(
          {
            success: false,
            error: 'Onboarding session not found',
            onboardingId
          },
          { status: 404 }
        );
      }

      console.log(`[Onboarding API] Found in database: ${row.status}`);

      progress = {
        onboardingId: row.id,
        companyId: row.company_id,
        status: row.status,
        currentStep: row.current_step || '',
        steps: row.steps_data ? JSON.parse(row.steps_data) : [],
        startedAt: row.created_at,
        completedAt: row.completed_at,
        error: row.error
      };
    } else {
      console.log(`[Onboarding API] Found in memory: ${progress.status}`);
    }

    return NextResponse.json({
      success: true,
      progress
    });
  } catch (error: any) {
    console.error('[Onboarding API] Error getting progress:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get onboarding progress',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
