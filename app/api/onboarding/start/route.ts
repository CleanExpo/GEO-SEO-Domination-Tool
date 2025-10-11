/**
 * Start Client Onboarding API
 *
 * POST: Initialize onboarding process for a new client
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { randomUUID } from 'crypto';

// Force Node.js runtime
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

    // Generate onboarding ID
    const onboardingId = `onboarding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('[Start Onboarding] Creating onboarding session:', onboardingId);

    // Save to database
    const supabase = createAdminClient();
    const { error: insertError } = await supabase
      .from('onboarding_sessions')
      .insert([{
        id: onboardingId,
        business_name: body.businessName,
        email: body.email,
        status: 'pending',
        request_data: body,
        created_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error('[Start Onboarding] Insert error:', insertError);
      throw new Error(`Failed to save onboarding session: ${insertError.message}`);
    }

    console.log('[Start Onboarding] Session saved to database');

    // Process onboarding INLINE (same process) instead of separate HTTP call
    // This avoids timeout issues in Vercel serverless
    console.log('[Start Onboarding] Processing onboarding inline...');

    try {
      // Import and call the processor directly
      const { processOnboarding } = await import('@/services/onboarding/onboarding-processor');
      const result = await processOnboarding(onboardingId);

      if (result.success) {
        console.log('[Start Onboarding] Processing completed:', result.companyId);
        return NextResponse.json({
          success: true,
          onboardingId,
          companyId: result.companyId,
          message: 'Client onboarding completed successfully!'
        }, { status: 201 });
      } else {
        console.error('[Start Onboarding] Processing failed:', result.error);
        return NextResponse.json({
          success: true,
          onboardingId,
          message: 'Client onboarding started, but processing encountered errors.',
          error: result.error
        }, { status: 201 });
      }
    } catch (processingError: any) {
      console.error('[Start Onboarding] Processing error:', processingError);
      // Still return success since the session was created
      return NextResponse.json({
        success: true,
        onboardingId,
        message: 'Client onboarding session created. Processing will continue.',
        warning: processingError.message
      }, { status: 201 });
    }
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
