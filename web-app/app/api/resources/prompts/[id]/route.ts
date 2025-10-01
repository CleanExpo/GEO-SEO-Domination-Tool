import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const promptUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  favorite: z.boolean().optional(),
  usage_count: z.number().optional(),
});

// GET /api/resources/prompts/[id] - Get a single prompt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('crm_prompts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Parse tags from JSON string
    const prompt = {
      ...data,
      tags: data.tags ? JSON.parse(data.tags) : [],
    };

    return NextResponse.json({ prompt });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch prompt' },
      { status: 500 }
    );
  }
}

// PUT /api/resources/prompts/[id] - Update a prompt
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = promptUpdateSchema.parse(body);

    // Convert tags array to JSON string for SQLite
    const updateData: any = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    if (validatedData.tags) {
      updateData.tags = JSON.stringify(validatedData.tags);
    }

    const { data, error } = await supabase
      .from('crm_prompts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Parse tags back to array
    const prompt = {
      ...data,
      tags: data.tags ? JSON.parse(data.tags) : [],
    };

    return NextResponse.json({ prompt });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update prompt' },
      { status: 500 }
    );
  }
}

// DELETE /api/resources/prompts/[id] - Delete a prompt
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from('crm_prompts')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    );
  }
}
