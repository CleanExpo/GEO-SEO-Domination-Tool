/**
 * Start Client Onboarding API
 *
 * POST: Initialize onboarding process for a new client
 */

import { NextRequest, NextResponse } from 'next/server';
import { onboardingOrchestrator } from '@/services/onboarding/onboarding-orchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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
        return Response.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Start onboarding
    const onboardingId = await onboardingOrchestrator.startOnboarding(body);

    return Response.json({
      success: true,
      onboardingId,
      message: 'Onboarding started successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error starting onboarding:', error);
    return Response.json(
      {
        error: 'Failed to start onboarding',
        message: error.message
      },
      { status: 500 }
    );
  }
}
