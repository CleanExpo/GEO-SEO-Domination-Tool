import { NextRequest, NextResponse } from 'next/server';
import { ruler } from '@/services/ai/ruler-integration';

/**
 * POST /api/ruler/insights
 *
 * Generate learning insights from performance history
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskType, minDataPoints = 10 } = body;

    if (!taskType) {
      return NextResponse.json(
        { error: 'taskType is required' },
        { status: 400 }
      );
    }

    const insights = await ruler.generateLearningInsights(taskType, minDataPoints);

    return NextResponse.json({
      success: true,
      taskType,
      totalInsights: insights.length,
      insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('RULER insights error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
