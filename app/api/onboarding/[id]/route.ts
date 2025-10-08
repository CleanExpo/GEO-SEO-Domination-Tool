/**
 * Onboarding Status API
 *
 * GET: Get onboarding progress for a specific session
 */

import { NextRequest, NextResponse } from 'next/server';
import { onboardingOrchestrator } from '@/services/onboarding/onboarding-orchestrator';
import { getDatabase } from '@/lib/db';

const db = getDatabase();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const onboardingId = id;

    // Try to get from memory first
    let progress = onboardingOrchestrator.getProgress(onboardingId);

    // If not in memory, load from database
    if (!progress) {
      const result = await db.query(
        'SELECT * FROM onboarding_sessions WHERE id = ?',
        [onboardingId]
      );

      const row = result.rows[0];

      if (!row) {
        return Response.json(
          { error: 'Onboarding session not found' },
          { status: 404 }
        );
      }

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
    }

    return Response.json({
      success: true,
      progress
    });
  } catch (error: any) {
    console.error('Error getting onboarding progress:', error);
    return Response.json(
      {
        error: 'Failed to get onboarding progress',
        message: error.message
      },
      { status: 500 }
    );
  }
}
