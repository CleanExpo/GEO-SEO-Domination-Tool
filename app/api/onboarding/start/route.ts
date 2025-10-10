/**
 * Start Client Onboarding API
 *
 * POST: Initialize onboarding process for a new client
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { randomUUID } from 'crypto';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const db = getDatabase();

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

    // Generate onboarding ID
    const onboardingId = `onboarding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('[Start Onboarding] Creating onboarding session:', onboardingId);

    // Save to database
    await db.query(`
      INSERT INTO onboarding_sessions (
        id, business_name, email, status, request_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      onboardingId,
      body.businessName,
      body.email,
      'pending',
      JSON.stringify(body),
      new Date().toISOString()
    ]);

    console.log('[Start Onboarding] Session saved to database');

    // TODO: Trigger background processing
    // For now, just return success

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
