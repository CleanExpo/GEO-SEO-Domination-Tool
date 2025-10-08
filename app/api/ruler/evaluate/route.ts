import { NextRequest, NextResponse } from 'next/server';
import { ruler, evaluateSEOTask, evaluateSocialMediaTask, evaluateContentWritingTask } from '@/services/ai/ruler-integration';

/**
 * POST /api/ruler/evaluate
 *
 * Evaluate agent performance using RULER (Relative Universal LLM-Elicited Rewards)
 *
 * Supports task types: seo, social_media, content_writing
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskType, taskDescription, data, useOpenAI = false } = body;

    if (!taskType || !taskDescription || !data) {
      return NextResponse.json(
        { error: 'taskType, taskDescription, and data are required' },
        { status: 400 }
      );
    }

    let score;

    switch (taskType) {
      case 'seo':
        score = await evaluateSEOTask(
          taskDescription,
          data.keywords || [],
          data.strategy || '',
          data.results || {}
        );
        break;

      case 'social_media':
        score = await evaluateSocialMediaTask(
          taskDescription,
          data.platform || '',
          data.content || '',
          data.results || {}
        );
        break;

      case 'content_writing':
        score = await evaluateContentWritingTask(
          taskDescription,
          data.contentType || '',
          data.content || '',
          data.results || {}
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported task type: ${taskType}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      taskType,
      taskDescription,
      evaluation: score,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('RULER evaluation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to evaluate task',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
