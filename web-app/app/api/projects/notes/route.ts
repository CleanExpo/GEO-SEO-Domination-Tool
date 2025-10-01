import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const projectNoteSchema = z.object({
  project_id: z.string().uuid('Valid project ID is required'),
  title: z.string().min(1, 'Note title is required'),
  content: z.string().min(1, 'Note content is required'),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/projects/notes - List all project notes or filter by project_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const category = searchParams.get('category');

    let query = supabase
      .from('crm_project_notes')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by project_id if provided
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notes: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch project notes' },
      { status: 500 }
    );
  }
}

// POST /api/projects/notes - Create a new project note
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = projectNoteSchema.parse(body);

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('crm_projects')
      .select('id')
      .eq('id', validatedData.project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Convert tags array to JSON string if present (for SQLite compatibility)
    const dataToInsert = {
      ...validatedData,
      tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
    };

    const { data, error } = await supabase
      .from('crm_project_notes')
      .insert([dataToInsert])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Parse tags back to array for response
    const responseData = {
      ...data,
      tags: data.tags ? JSON.parse(data.tags) : [],
    };

    return NextResponse.json({ note: responseData }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create project note' },
      { status: 500 }
    );
  }
}
