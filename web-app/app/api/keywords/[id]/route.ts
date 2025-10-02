import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { z } from 'zod';

const keywordUpdateSchema = z.object({
  keyword: z.string().min(1).optional(),
  search_volume: z.number().optional(),
  difficulty: z.number().optional(),
  cpc: z.number().optional(),
  trend: z.enum(['up', 'down', 'stable']).optional(),
});

// GET /api/keywords/[id] - Get a single keyword
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ keyword: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch keyword' },
      { status: 500 }
    );
  }
}

// PUT /api/keywords/[id] - Update a keyword
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();
    const validatedData = keywordUpdateSchema.parse(body);

    const { data, error } = await supabase
      .from('keywords')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ keyword: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update keyword' },
      { status: 500 }
    );
  }
}

// DELETE /api/keywords/[id] - Delete a keyword
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { error } = await supabase
      .from('keywords')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Keyword deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete keyword' },
      { status: 500 }
    );
  }
}
