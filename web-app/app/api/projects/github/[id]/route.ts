import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const githubProjectUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  stars: z.number().int().min(0).optional(),
  forks: z.number().int().min(0).optional(),
  open_prs: z.number().int().min(0).optional(),
  language: z.string().optional(),
  last_updated: z.string().optional(),
});

// GET /api/projects/github/[id] - Get a single GitHub project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('crm_github_projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ github_project: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch GitHub project' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/github/[id] - Update a GitHub project (sync from GitHub API)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = githubProjectUpdateSchema.parse(body);

    // If URL is being updated, check for duplicates
    if (validatedData.url) {
      const { data: existing } = await supabase
        .from('crm_github_projects')
        .select('id')
        .eq('url', validatedData.url)
        .neq('id', id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Another GitHub project with this URL already exists' },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from('crm_github_projects')
      .update({ ...validatedData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ github_project: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update GitHub project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/github/[id] - Delete a GitHub project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from('crm_github_projects')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'GitHub project deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete GitHub project' },
      { status: 500 }
    );
  }
}
