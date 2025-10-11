import { NextRequest, NextResponse } from 'next/server';

// GET /api/projects/github - List user's GitHub repositories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const org = searchParams.get('org');
    const limit = parseInt(searchParams.get('limit') || '30');

    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
      return NextResponse.json(
        { repos: [], total: 0, error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    // Fetch repositories from GitHub API
    const endpoint = org
      ? `https://api.github.com/orgs/${org}/repos`
      : 'https://api.github.com/user/repos';

    const response = await fetch(`${endpoint}?per_page=${limit}&sort=updated`, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[GitHub API] Fetch error:', error);
      return NextResponse.json(
        { repos: [], total: 0, error: 'Failed to fetch GitHub repositories' },
        { status: response.status }
      );
    }

    const repos = await response.json();

    return NextResponse.json({
      repos: repos.map((repo: any) => ({
        id: repo.id.toString(),
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
        default_branch: repo.default_branch,
        updated_at: repo.updated_at,
      })),
      total: repos.length,
    });
  } catch (error: any) {
    console.error('[GitHub API] Fatal error:', error);
    return NextResponse.json(
      { repos: [], total: 0, error: error.message || 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}
