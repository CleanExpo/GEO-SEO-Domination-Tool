import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const deploySchema = z.object({
  branch: z.string().default('main'),
  environment: z.string().default('production'),
  skip_tests: z.boolean().default(false),
});

// POST /api/deploy - Trigger production deployment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = deploySchema.parse(body);

    const vercelToken = process.env.VERCEL_TOKEN;

    if (!vercelToken) {
      return NextResponse.json(
        { error: 'Vercel token not configured' },
        { status: 500 }
      );
    }

    // Trigger Vercel deployment
    const response = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: process.env.VERCEL_PROJECT_NAME || 'geo-seo-domination-tool',
        gitSource: {
          type: 'github',
          ref: validatedData.branch,
        },
        target: validatedData.environment,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Deploy API] Vercel error:', error);
      return NextResponse.json(
        { error: 'Failed to trigger deployment' },
        { status: response.status }
      );
    }

    const deployment = await response.json();

    return NextResponse.json({
      deployment: {
        id: deployment.id,
        url: deployment.url,
        status: deployment.readyState,
        created_at: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Deploy API] Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger deployment' },
      { status: 500 }
    );
  }
}
