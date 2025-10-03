import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { z } from 'zod';

const projectNoteUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/projects/notes/[id] - Get a single project note
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { data, error } = await supabase
      .from('crm_project_notes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
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

    return NextResponse.json({ note: responseData });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch project note' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/notes/[id] - Update a project note
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();
    const validatedData = projectNoteUpdateSchema.parse(body);

    // Convert tags array to JSON string if present (for SQLite compatibility)
    const dataToUpdate: any = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    if (validatedData.tags !== undefined) {
      dataToUpdate.tags = JSON.stringify(validatedData.tags);
    }

    const { data, error } = await supabase
      .from('crm_project_notes')
      .update(dataToUpdate)
      .eq('id', id)
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

    return NextResponse.json({ note: responseData });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update project note' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/notes/[id] - Delete a project note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { error } = await supabase
      .from('crm_project_notes')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Project note deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete project note' },
      { status: 500 }
    );
  }
}
