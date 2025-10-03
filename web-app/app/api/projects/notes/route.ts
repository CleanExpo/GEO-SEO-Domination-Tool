import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
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
    const supabase = await createClient();
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

    // Transform data to match frontend expectations (camelCase)
    const transformedNotes = (data || []).map((note: any) => ({
      id: note.id,
      title: note.title,
      content: note.content,
      tags: note.tags ? JSON.parse(note.tags) : [],
      createdAt: note.created_at,
      updatedAt: note.updated_at,
      project: note.project_id,
    }));

    return NextResponse.json({ notes: transformedNotes });
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
    const supabase = await createClient();
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

    // Transform response to match frontend expectations (camelCase)
    const responseData = {
      id: data.id,
      title: data.title,
      content: data.content,
      tags: data.tags ? JSON.parse(data.tags) : [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      project: data.project_id,
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
