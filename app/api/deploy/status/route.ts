import { NextRequest, NextResponse } from 'next/server';

// GET /api/deploy/status - Get current deployment status
export async function GET(request: NextRequest) {
  try {
    const vercelToken = process.env.VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;

    if (!vercelToken || !projectId) {
      return NextResponse.json(
        { error: 'Vercel credentials not configured' },
        { status: 500 }
      );
    }

    // Fetch latest deployment from Vercel
    const response = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Deploy Status API] Vercel error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deployment status' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const deployment = data.deployments?.[0];

    if (!deployment) {
      return NextResponse.json({
        status: 'none',
        progress: 0,
        logs: [],
      });
    }

    // Map Vercel readyState to our status
    const statusMap: Record<string, string> = {
      'BUILDING': 'building',
      'READY': 'ready',
      'ERROR': 'error',
      'CANCELED': 'canceled',
    };

    return NextResponse.json({
      status: statusMap[deployment.readyState] || deployment.readyState,
      progress: deployment.readyState === 'READY' ? 100 : 50,
      logs: [], // TODO: Fetch build logs from Vercel
      url: deployment.url,
    });
  } catch (error: any) {
    console.error('[Deploy Status API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deployment status' },
      { status: 500 }
    );
  }
}
