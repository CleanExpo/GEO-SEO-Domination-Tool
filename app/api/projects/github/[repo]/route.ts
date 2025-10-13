import { NextRequest, NextResponse } from 'next/server';

// GET /api/projects/github/[repo] - Get repository details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repo: string }> }
) {
  try {
    const { repo } = await params;
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    // Fetch repository details
    const repoResponse = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!repoResponse.ok) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: repoResponse.status }
      );
    }

    const repoData = await repoResponse.json();

    // Fetch recent commits
    const commitsResponse = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=10`, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const commits = commitsResponse.ok ? await commitsResponse.json() : [];

    // Fetch branches
    const branchesResponse = await fetch(`https://api.github.com/repos/${repo}/branches`, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const branches = branchesResponse.ok ? await branchesResponse.json() : [];

    return NextResponse.json({
      repo: {
        id: repoData.id.toString(),
        name: repoData.name,
        full_name: repoData.full_name,
        html_url: repoData.html_url,
        default_branch: repoData.default_branch,
        updated_at: repoData.updated_at,
      },
      commits: commits.map((commit: any) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
      })),
      branches: branches.map((branch: any) => ({
        name: branch.name,
        sha: branch.commit.sha,
      })),
    });
  } catch (error: any) {
    console.error('[GitHub API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch repository details' },
      { status: 500 }
    );
  }
}
