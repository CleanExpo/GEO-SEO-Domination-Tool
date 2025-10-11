import { NextRequest, NextResponse } from 'next/server';
import { getJobStatus } from '@/services/scheduler/post-audit-jobs';

/**
 * GET /api/scheduler
 * Returns the current status of the job scheduler
 */
export async function GET(request: NextRequest) {
  try {
    const jobStatus = getJobStatus();
    const activeJobs = Object.values(jobStatus).filter((job: any) => job.running).length;
    const initialized = Object.keys(jobStatus).length > 0;

    return NextResponse.json({
      status: {
        initialized,
        running: activeJobs > 0,
        activeJobs,
      },
      jobs: jobStatus,
      message: 'Scheduler is operational',
    });
  } catch (error) {
    console.error('[Scheduler API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get scheduler status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scheduler
 * Initialize or control the job scheduler
 *
 * Body: { action: 'initialize' | 'start' | 'stop' | 'restart' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const { startPostAuditJobs, stopPostAuditJobs } = await import('@/services/scheduler/post-audit-jobs');

    // Handle different actions
    switch (action) {
      case 'initialize':
      case 'start':
        startPostAuditJobs();
        const startStatus = getJobStatus();
        return NextResponse.json({
          success: true,
          message: 'Scheduler initialized successfully',
          status: {
            initialized: true,
            running: Object.values(startStatus).some((job: any) => job.running),
            activeJobs: Object.values(startStatus).filter((job: any) => job.running).length,
          },
          jobs: startStatus,
        });

      case 'stop':
        stopPostAuditJobs();
        return NextResponse.json({
          success: true,
          message: 'Scheduler stopped successfully',
        });

      case 'restart':
        stopPostAuditJobs();
        // Wait a brief moment before restarting
        await new Promise(resolve => setTimeout(resolve, 100));
        startPostAuditJobs();
        const restartStatus = getJobStatus();
        return NextResponse.json({
          success: true,
          message: 'Scheduler restarted successfully',
          jobs: restartStatus,
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Scheduler API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to perform scheduler action' },
      { status: 500 }
    );
  }
}
