import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const aiToolUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  url: z.string().url().optional(),
  category: z.string().optional(),
  pricing: z.string().optional(),
  features: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  favorite: z.boolean().optional(),
  usage_count: z.number().optional(),
});

// GET /api/resources/ai-tools/[id] - Get a single AI tool
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('resource_ai_tools')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Parse JSON arrays from strings
    const aiTool = {
      ...data,
      features: data.features ? JSON.parse(data.features) : [],
      tags: data.tags ? JSON.parse(data.tags) : [],
    };

    return NextResponse.json({ aiTool });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch AI tool' },
      { status: 500 }
    );
  }
}

// PUT /api/resources/ai-tools/[id] - Update an AI tool
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = aiToolUpdateSchema.parse(body);

    // Convert arrays to JSON strings for SQLite
    const updateData: any = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    if (validatedData.features) {
      updateData.features = JSON.stringify(validatedData.features);
    }

    if (validatedData.tags) {
      updateData.tags = JSON.stringify(validatedData.tags);
    }

    const { data, error } = await supabase
      .from('resource_ai_tools')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Parse arrays back from JSON strings
    const aiTool = {
      ...data,
      features: data.features ? JSON.parse(data.features) : [],
      tags: data.tags ? JSON.parse(data.tags) : [],
    };

    return NextResponse.json({ aiTool });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update AI tool' },
      { status: 500 }
    );
  }
}

// DELETE /api/resources/ai-tools/[id] - Delete an AI tool
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from('resource_ai_tools')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'AI tool deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete AI tool' },
      { status: 500 }
    );
  }
}
