import { NextRequest, NextResponse } from 'next/server';
import {
  startPostAuditJobs,
  stopPostAuditJobs,
  getJobStatus,
  triggerJob
} from '@/services/scheduler/post-audit-jobs';

/**
 * GET /api/post-audit/scheduler
 * Get status of all background jobs
 */
export async function GET(request: NextRequest) {
  try {
    const status = getJobStatus();
    return NextResponse.json({
      success: true,
      jobs: status,
    });
  } catch (error) {
    console.error('Failed to get scheduler status:', error);
    return NextResponse.json(
      { error: 'Failed to get scheduler status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/post-audit/scheduler
 * Start or stop background jobs
 * Body: { action: 'start' | 'stop' | 'trigger', jobName?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobName } = body;

    if (action === 'start') {
      startPostAuditJobs();
      return NextResponse.json({
        success: true,
        message: 'Background jobs started successfully',
      });
    }

    if (action === 'stop') {
      stopPostAuditJobs();
      return NextResponse.json({
        success: true,
        message: 'Background jobs stopped successfully',
      });
    }

    if (action === 'trigger') {
      if (!jobName) {
        return NextResponse.json(
          { error: 'Job name is required for trigger action' },
          { status: 400 }
        );
      }

      const result = await triggerJob(jobName);

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `Job '${jobName}' triggered successfully`,
          result: result.data,
        });
      } else {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid action. Must be "start", "stop", or "trigger"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Scheduler API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
