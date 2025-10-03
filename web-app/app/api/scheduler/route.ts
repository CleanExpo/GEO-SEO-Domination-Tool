import { NextRequest, NextResponse } from 'next/server';
import { getRankingScheduler } from '@/services/scheduler/RankingScheduler';
import { initializeScheduler, isSchedulerInitialized } from '@/services/scheduler/init';

// GET /api/scheduler - Get scheduler status
export async function GET(request: NextRequest) {
  try {
    const scheduler = getRankingScheduler();
    const status = scheduler.getStatus();

    return NextResponse.json({
      status,
      autoInitialized: isSchedulerInitialized(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get scheduler status' },
      { status: 500 }
    );
  }
}

// POST /api/scheduler - Initialize or control scheduler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const scheduler = getRankingScheduler();

    switch (action) {
      case 'initialize':
        await initializeScheduler();
        return NextResponse.json({
          message: 'Scheduler initialized',
          status: scheduler.getStatus(),
        });

      case 'shutdown':
        scheduler.shutdown();
        return NextResponse.json({ message: 'Scheduler shutdown' });

      case 'reload':
        scheduler.shutdown();
        await initializeScheduler();
        return NextResponse.json({
          message: 'Scheduler reloaded',
          status: scheduler.getStatus(),
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: initialize, shutdown, or reload' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to control scheduler' },
      { status: 500 }
    );
  }
}
