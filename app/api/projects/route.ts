import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';
import type { Project } from '@/types/projects';

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['planning', 'in_progress', 'completed', 'on_hold']),
  contact_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  deliverables: z.any().optional(),
  notes: z.string().optional(),
});

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const contact_id = searchParams.get('contact_id');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (contact_id) {
      query = query.eq('contact_id', contact_id);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[Projects API] Supabase error:', error);
      return NextResponse.json(
        { projects: [], total: 0, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      projects: data as Project[] || [],
      total: count || 0,
    });
  } catch (error: any) {
    console.error('[Projects API] Fatal error:', error);
    return NextResponse.json(
      { projects: [], total: 0, error: error.message || 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    // Validate input
    const validatedData = projectSchema.parse(body);

    const { data, error } = await supabase
      .from('projects')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      console.error('[Projects API] Insert error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ project: data as Project }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Projects API] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
