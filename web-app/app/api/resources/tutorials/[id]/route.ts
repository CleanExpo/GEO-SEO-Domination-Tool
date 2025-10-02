import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { z } from 'zod';

const tutorialUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  content: z.string().min(1).optional(),
  category: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  duration: z.number().optional(),
  tags: z.array(z.string()).optional(),
  video_url: z.string().optional(),
  resources: z.array(z.string()).optional(),
  favorite: z.boolean().optional(),
  views: z.number().optional(),
});

// GET /api/resources/tutorials/[id] - Get a single tutorial
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { data, error } = await supabase
      .from('crm_tutorials')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Parse JSON arrays from strings
    const tutorial = {
      ...data,
      tags: data.tags ? JSON.parse(data.tags) : [],
      resources: data.resources ? JSON.parse(data.resources) : [],
    };

    return NextResponse.json({ tutorial });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tutorial' },
      { status: 500 }
    );
  }
}

// PUT /api/resources/tutorials/[id] - Update a tutorial
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();
    const validatedData = tutorialUpdateSchema.parse(body);

    // Convert arrays to JSON strings for SQLite
    const updateData: any = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    if (validatedData.tags) {
      updateData.tags = JSON.stringify(validatedData.tags);
    }

    if (validatedData.resources) {
      updateData.resources = JSON.stringify(validatedData.resources);
    }

    const { data, error } = await supabase
      .from('crm_tutorials')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Parse arrays back from JSON strings
    const tutorial = {
      ...data,
      tags: data.tags ? JSON.parse(data.tags) : [],
      resources: data.resources ? JSON.parse(data.resources) : [],
    };

    return NextResponse.json({ tutorial });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update tutorial' },
      { status: 500 }
    );
  }
}

// DELETE /api/resources/tutorials/[id] - Delete a tutorial
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { error } = await supabase
      .from('crm_tutorials')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Tutorial deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete tutorial' },
      { status: 500 }
    );
  }
}
