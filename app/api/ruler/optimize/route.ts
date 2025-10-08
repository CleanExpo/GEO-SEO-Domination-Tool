import { NextRequest, NextResponse } from 'next/server';
import { ruler } from '@/services/ai/ruler-integration';

/**
 * POST /api/ruler/optimize
 *
 * Optimize agent behavior based on RULER feedback and performance history
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskType, currentApproach } = body;

    if (!taskType || !currentApproach) {
      return NextResponse.json(
        { error: 'taskType and currentApproach are required' },
        { status: 400 }
      );
    }

    const optimization = await ruler.optimizeAgentBehavior(
      taskType,
      currentApproach
    );

    return NextResponse.json({
      success: true,
      taskType,
      currentApproach,
      optimization,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('RULER optimization error:', error);
    return NextResponse.json(
      {
        error: 'Failed to optimize agent behavior',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
