/**
 * Start Client Onboarding API
 *
 * POST: Initialize onboarding process for a new client
 */

import { NextRequest, NextResponse } from 'next/server';
import { onboardingOrchestrator } from '@/services/onboarding/onboarding-orchestrator';

// Force Node.js runtime (orchestrator uses fs, path, EventEmitter)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('[Start Onboarding] API called');

  try {
    const body = await request.json();
    console.log('[Start Onboarding] Request body received:', {
      businessName: body.businessName,
      email: body.email,
      hasGoals: !!body.primaryGoals,
      hasKeywords: !!body.targetKeywords
    });

    // Validate required fields
    const requiredFields = [
      'businessName',
      'email',
      'contactName',
      'primaryGoals',
      'targetKeywords',
      'contentTypes',
      'selectedServices'
    ];

    for (const field of requiredFields) {
      if (!body[field] || (Array.isArray(body[field]) && body[field].length === 0)) {
        console.log(`[Start Onboarding] Missing field: ${field}`);
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    console.log('[Start Onboarding] Starting orchestrator...');

    // Start client onboarding process
    const onboardingId = await onboardingOrchestrator.startOnboarding(body);

    console.log('[Start Onboarding] Orchestrator started successfully:', onboardingId);

    return NextResponse.json({
      success: true,
      onboardingId,
      message: 'Client onboarding started successfully. Processing in background.'
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Start Onboarding] ERROR:', error);
    console.error('[Start Onboarding] Stack trace:', error.stack);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start onboarding',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
