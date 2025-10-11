import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const deploySchema = z.object({
  repo: z.string().min(1, 'Repository is required'),
  branch: z.string().default('main'),
  environment: z.string().default('production'),
});

// POST /api/projects/github/deploy - Trigger deployment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = deploySchema.parse(body);

    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    // Trigger GitHub Actions workflow dispatch
    // This assumes a workflow file exists (e.g., .github/workflows/deploy.yml)
    const response = await fetch(
      `https://api.github.com/repos/${validatedData.repo}/actions/workflows/deploy.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: validatedData.branch,
          inputs: {
            environment: validatedData.environment,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[GitHub Deploy API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to trigger deployment' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      deployment: {
        id: `deploy-${Date.now()}`,
        repo: validatedData.repo,
        branch: validatedData.branch,
        environment: validatedData.environment,
        status: 'triggered',
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
    console.error('[GitHub Deploy API] Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger deployment' },
      { status: 500 }
    );
  }
}
