import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const rollbackSchema = z.object({
  deployment_id: z.string().min(1, 'Deployment ID is required'),
});

// POST /api/deploy/rollback - Rollback to previous deployment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = rollbackSchema.parse(body);

    const vercelToken = process.env.VERCEL_TOKEN;

    if (!vercelToken) {
      return NextResponse.json(
        { error: 'Vercel token not configured' },
        { status: 500 }
      );
    }

    // Promote previous deployment to production
    const response = await fetch(
      `https://api.vercel.com/v13/deployments/${validatedData.deployment_id}/promote`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Deploy Rollback API] Vercel error:', error);
      return NextResponse.json(
        { error: 'Failed to rollback deployment' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Deployment rolled back successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Deploy Rollback API] Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to rollback deployment' },
      { status: 500 }
    );
  }
}
