import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { z } from 'zod';

// GitHub URL validation regex
const GITHUB_URL_REGEX = /github\.com\/[\w-]+\/[\w-]+/;

const githubProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  url: z.string()
    .url('Valid URL is required')
    .refine(
      (url) => GITHUB_URL_REGEX.test(url),
      'URL must be a valid GitHub repository URL (e.g., https://github.com/owner/repo)'
    ),
  stars: z.number().int().min(0).default(0),
  forks: z.number().int().min(0).default(0),
  open_prs: z.number().int().min(0).default(0),
  language: z.string().optional(),
  last_updated: z.string().optional(),
});

// Extract owner and repo from GitHub URL
function extractGitHubInfo(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([\w-]+)\/([\w-]+)/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
}

// Fetch repository metadata from GitHub API
async function fetchGitHubMetadata(owner: string, repo: string) {
  const token = process.env.GITHUB_TOKEN;

  try {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
    });

    if (!response.ok) {
      console.warn(`Failed to fetch GitHub metadata: ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    return {
      description: data.description || undefined,
      stars: data.stargazers_count || 0,
      forks: data.forks_count || 0,
      language: data.language || undefined,
      last_updated: data.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Error fetching GitHub metadata:', error);
    return null;
  }
}

// GET /api/projects/github - List all GitHub projects
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const order = searchParams.get('order') || 'desc';

    let query = supabase
      .from('crm_github_projects')
      .select('*');

    // Filter by language if provided
    if (language) {
      query = query.eq('language', language);
    }

    // Sort by specified field
    query = query.order(sortBy, { ascending: order === 'asc' });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ github_projects: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch GitHub projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects/github - Create a new GitHub project or sync from GitHub API
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Extract GitHub owner/repo info
    const githubInfo = extractGitHubInfo(body.url);

    // Fetch metadata from GitHub API if token exists and we have valid info
    let metadata = null;
    if (githubInfo && process.env.GITHUB_TOKEN) {
      metadata = await fetchGitHubMetadata(githubInfo.owner, githubInfo.repo);
    }

    // Merge user input with fetched metadata (user input takes precedence)
    const mergedData = {
      ...body,
      // Use fetched metadata as fallback
      description: body.description || metadata?.description,
      language: body.language || metadata?.language,
      stars: body.stars ?? metadata?.stars ?? 0,
      forks: body.forks ?? metadata?.forks ?? 0,
      open_prs: body.open_prs ?? 0, // GitHub API requires additional call for PRs
      last_updated: body.last_updated || metadata?.last_updated || new Date().toISOString(),
    };

    const validatedData = githubProjectSchema.parse(mergedData);

    // Check if URL already exists
    const { data: existing } = await supabase
      .from('crm_github_projects')
      .select('id')
      .eq('url', validatedData.url)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'GitHub project with this URL already exists' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('crm_github_projects')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ github_project: data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create GitHub project' },
      { status: 500 }
    );
  }
}
