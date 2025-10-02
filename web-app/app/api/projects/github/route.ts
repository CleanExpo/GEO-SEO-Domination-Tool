import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { z } from 'zod';

const githubProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  url: z.string().url('Valid URL is required'),
  stars: z.number().int().min(0).default(0),
  forks: z.number().int().min(0).default(0),
  open_prs: z.number().int().min(0).default(0),
  language: z.string().optional(),
  last_updated: z.string().optional(),
});

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
    const validatedData = githubProjectSchema.parse(body);

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
