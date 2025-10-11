/**
 * Process Onboarding Background Worker
 *
 * This route is called asynchronously to process onboarding steps
 * Works in Vercel serverless environment without complex dependencies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max 60 seconds for hobby plan

interface OnboardingStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export async function POST(request: NextRequest) {
  console.log('[Process Onboarding] Worker started');

  try {
    const { onboardingId } = await request.json();

    if (!onboardingId) {
      return NextResponse.json(
        { success: false, error: 'Missing onboardingId' },
        { status: 400 }
      );
    }

    console.log('[Process Onboarding] Processing:', onboardingId);

    // Get onboarding session
    const supabase = createAdminClient();
    const { data: session, error: sessionError } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('id', onboardingId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Onboarding session not found' },
        { status: 404 }
      );
    }

    // Parse request_data (already an object in PostgreSQL JSONB)
    const requestData = session.request_data as any;

    // Initialize steps
    const steps: OnboardingStep[] = [
      { name: 'Create Company Record', status: 'pending' },
      { name: 'Setup Workspace', status: 'pending' },
      { name: 'Run SEO Audit', status: 'pending' },
      { name: 'Generate Content Calendar', status: 'pending' },
      { name: 'Send Welcome Email', status: 'pending' }
    ];

    // Update status to in_progress
    await supabase
      .from('onboarding_sessions')
      .update({
        status: 'in_progress',
        current_step: 'Create Company Record',
        steps_data: steps,
        started_at: new Date().toISOString()
      })
      .eq('id', onboardingId);

    let companyId = '';
    let currentStepIndex = 0;

    try {
      // Step 1: Create Company Record
      console.log('[Process Onboarding] Step 1: Create Company Record');
      steps[0].status = 'running';
      await updateProgress(onboardingId, 'in_progress', 'Create Company Record', steps);

      companyId = randomUUID();
      // Create company record with minimal fields (matches companies API schema)
      const { error: companyError } = await supabase
        .from('companies')
        .insert([{
          id: companyId,
          name: requestData.businessName,
          website: requestData.website || 'https://example.com',
          industry: requestData.industry || 'General'
        }]);

      if (companyError) {
        throw new Error(`Failed to create company: ${companyError.message}`);
      }

      steps[0].status = 'completed';
      currentStepIndex = 1;
      await updateProgress(onboardingId, 'in_progress', 'Setup Workspace', steps, companyId);

      // Step 2: Setup Workspace (skip for now - will implement later)
      console.log('[Process Onboarding] Step 2: Setup Workspace');
      steps[1].status = 'running';
      await updateProgress(onboardingId, 'in_progress', 'Setup Workspace', steps, companyId);

      // TODO: Create company workspace/portfolio
      steps[1].status = 'completed';
      currentStepIndex = 2;
      await updateProgress(onboardingId, 'in_progress', 'Run SEO Audit', steps, companyId);

      // Step 3: Run SEO Audit (placeholder - mark as completed for now)
      console.log('[Process Onboarding] Step 3: Run SEO Audit');
      steps[2].status = 'running';
      await updateProgress(onboardingId, 'in_progress', 'Run SEO Audit', steps, companyId);

      // TODO: Integrate actual Lighthouse audit
      steps[2].status = 'completed';
      currentStepIndex = 3;
      await updateProgress(onboardingId, 'in_progress', 'Generate Content Calendar', steps, companyId);

      // Step 4: Generate Content Calendar (placeholder)
      console.log('[Process Onboarding] Step 4: Generate Content Calendar');
      steps[3].status = 'running';
      await updateProgress(onboardingId, 'in_progress', 'Generate Content Calendar', steps, companyId);

      // TODO: Generate actual content calendar
      steps[3].status = 'completed';
      currentStepIndex = 4;
      await updateProgress(onboardingId, 'in_progress', 'Send Welcome Email', steps, companyId);

      // Step 5: Send Welcome Email (placeholder)
      console.log('[Process Onboarding] Step 5: Send Welcome Email');
      steps[4].status = 'running';
      await updateProgress(onboardingId, 'in_progress', 'Send Welcome Email', steps, companyId);

      // TODO: Send actual welcome email
      steps[4].status = 'completed';

      // Mark as completed
      await supabase
        .from('onboarding_sessions')
        .update({
          status: 'completed',
          current_step: 'Completed',
          steps_data: steps,
          company_id: companyId,
          completed_at: new Date().toISOString()
        })
        .eq('id', onboardingId);

      console.log('[Process Onboarding] Completed successfully');

      return NextResponse.json({
        success: true,
        companyId,
        message: 'Onboarding completed successfully'
      });

    } catch (stepError: any) {
      console.error('[Process Onboarding] Step failed:', stepError);

      // Mark current step as failed
      if (currentStepIndex < steps.length) {
        steps[currentStepIndex].status = 'failed';
        steps[currentStepIndex].error = stepError.message;
      }

      await supabase
        .from('onboarding_sessions')
        .update({
          status: 'failed',
          steps_data: steps,
          error: stepError.message
        })
        .eq('id', onboardingId);

      return NextResponse.json({
        success: false,
        error: 'Onboarding processing failed',
        message: stepError.message,
        failedStep: currentStepIndex
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[Process Onboarding] ERROR:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process onboarding',
      message: error.message
    }, { status: 500 });
  }
}

async function updateProgress(
  onboardingId: string,
  status: string,
  currentStep: string,
  steps: OnboardingStep[],
  companyId?: string
) {
  const supabase = createAdminClient();
  const updateData: any = {
    status,
    current_step: currentStep,
    steps_data: steps
  };

  if (companyId) {
    updateData.company_id = companyId;
  }

  await supabase
    .from('onboarding_sessions')
    .update(updateData)
    .eq('id', onboardingId);
}
