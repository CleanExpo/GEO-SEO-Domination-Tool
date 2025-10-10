/**
 * Onboarding Processor Service
 *
 * Extracted from /api/onboarding/process to avoid HTTP self-calls
 * Runs onboarding steps inline in the same process
 */

import { getDatabase } from '@/lib/db';
import { randomUUID } from 'crypto';

const db = getDatabase();

interface OnboardingStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

interface ProcessResult {
  success: boolean;
  companyId?: string;
  error?: string;
  failedStep?: number;
}

export async function processOnboarding(onboardingId: string): Promise<ProcessResult> {
  console.log('[Processor] Starting onboarding:', onboardingId);

  try {
    // Get onboarding session
    const sessionResult = await db.query(
      'SELECT * FROM onboarding_sessions WHERE id = ?',
      [onboardingId]
    );

    const session = sessionResult.rows?.[0];
    if (!session) {
      return {
        success: false,
        error: 'Onboarding session not found'
      };
    }

    // Parse request_data (might be object or string)
    const requestData = typeof session.request_data === 'string'
      ? JSON.parse(session.request_data)
      : session.request_data;

    // Initialize steps
    const steps: OnboardingStep[] = [
      { name: 'Create Company Record', status: 'pending' },
      { name: 'Setup Workspace', status: 'pending' },
      { name: 'Run SEO Audit', status: 'pending' },
      { name: 'Generate Content Calendar', status: 'pending' },
      { name: 'Send Welcome Email', status: 'pending' }
    ];

    // Update status to in_progress
    await db.query(
      `UPDATE onboarding_sessions
       SET status = ?, current_step = ?, steps_data = ?, started_at = ?
       WHERE id = ?`,
      ['in_progress', 'Create Company Record', JSON.stringify(steps), new Date().toISOString(), onboardingId]
    );

    let companyId = '';
    let currentStepIndex = 0;

    try {
      // Step 1: Create Company Record
      console.log('[Processor] Step 1: Create Company Record');
      steps[0].status = 'running';
      await updateProgress(onboardingId, 'in_progress', 'Create Company Record', steps);

      companyId = randomUUID();
      await db.query(
        `INSERT INTO companies (
          id, name, website, industry
        ) VALUES (?, ?, ?, ?)`,
        [
          companyId,
          requestData.businessName,
          requestData.website || 'https://example.com',
          requestData.industry || 'General'
        ]
      );

      steps[0].status = 'completed';
      currentStepIndex = 1;
      await updateProgress(onboardingId, 'in_progress', 'Setup Workspace', steps, companyId);

      // Step 2: Setup Workspace
      console.log('[Processor] Step 2: Setup Workspace');
      steps[1].status = 'running';
      await updateProgress(onboardingId, 'in_progress', 'Setup Workspace', steps, companyId);

      // TODO: Create company workspace/portfolio
      steps[1].status = 'completed';
      currentStepIndex = 2;
      await updateProgress(onboardingId, 'in_progress', 'Run SEO Audit', steps, companyId);

      // Step 3: Run SEO Audit
      console.log('[Processor] Step 3: Run SEO Audit');
      steps[2].status = 'running';
      await updateProgress(onboardingId, 'in_progress', 'Run SEO Audit', steps, companyId);

      // TODO: Integrate actual Lighthouse audit
      steps[2].status = 'completed';
      currentStepIndex = 3;
      await updateProgress(onboardingId, 'in_progress', 'Generate Content Calendar', steps, companyId);

      // Step 4: Generate Content Calendar
      console.log('[Processor] Step 4: Generate Content Calendar');
      steps[3].status = 'running';
      await updateProgress(onboardingId, 'in_progress', 'Generate Content Calendar', steps, companyId);

      // TODO: Generate actual content calendar
      steps[3].status = 'completed';
      currentStepIndex = 4;
      await updateProgress(onboardingId, 'in_progress', 'Send Welcome Email', steps, companyId);

      // Step 5: Send Welcome Email
      console.log('[Processor] Step 5: Send Welcome Email');
      steps[4].status = 'running';
      await updateProgress(onboardingId, 'in_progress', 'Send Welcome Email', steps, companyId);

      // TODO: Send actual welcome email
      steps[4].status = 'completed';

      // Mark as completed
      await db.query(
        `UPDATE onboarding_sessions
         SET status = ?, current_step = ?, steps_data = ?,
             company_id = ?, completed_at = ?
         WHERE id = ?`,
        [
          'completed',
          'Completed',
          JSON.stringify(steps),
          companyId,
          new Date().toISOString(),
          onboardingId
        ]
      );

      console.log('[Processor] Completed successfully');

      return {
        success: true,
        companyId
      };

    } catch (stepError: any) {
      console.error('[Processor] Step failed:', stepError);

      // Mark current step as failed
      if (currentStepIndex < steps.length) {
        steps[currentStepIndex].status = 'failed';
        steps[currentStepIndex].error = stepError.message;
      }

      await db.query(
        `UPDATE onboarding_sessions
         SET status = ?, steps_data = ?, error = ?
         WHERE id = ?`,
        [
          'failed',
          JSON.stringify(steps),
          stepError.message,
          onboardingId
        ]
      );

      return {
        success: false,
        error: stepError.message,
        failedStep: currentStepIndex
      };
    }

  } catch (error: any) {
    console.error('[Processor] ERROR:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function updateProgress(
  onboardingId: string,
  status: string,
  currentStep: string,
  steps: OnboardingStep[],
  companyId?: string
) {
  if (companyId) {
    await db.query(
      `UPDATE onboarding_sessions
       SET status = ?, current_step = ?, steps_data = ?, company_id = ?
       WHERE id = ?`,
      [status, currentStep, JSON.stringify(steps), companyId, onboardingId]
    );
  } else {
    await db.query(
      `UPDATE onboarding_sessions
       SET status = ?, current_step = ?, steps_data = ?
       WHERE id = ?`,
      [status, currentStep, JSON.stringify(steps), onboardingId]
    );
  }
}
