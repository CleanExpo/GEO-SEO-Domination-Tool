import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';
import type { Prompt } from '@/types/resources';

const promptUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  category: z.enum(['content', 'technical', 'local', 'general']).optional(),
  tags: z.array(z.string()).optional(),
  is_public: z.boolean().optional(),
});

// GET /api/resources/prompts/[id] - Get single prompt
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const { data, error } = await supabase
      .from('resource_prompts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Prompts API] Get error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return NextResponse.json({ prompt: data as Prompt });
  } catch (error: any) {
    console.error('[Prompts API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch prompt' },
      { status: 500 }
    );
  }
}

// PUT /api/resources/prompts/[id] - Update prompt
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;
    const body = await request.json();

    // Validate input
    const validatedData = promptUpdateSchema.parse(body);

    // TODO: Add ownership check - user can only edit their own prompts
    // For now, using admin client bypasses RLS

    const { data, error } = await supabase
      .from('resource_prompts')
      .update({ ...validatedData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Prompts API] Update error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return NextResponse.json({ prompt: data as Prompt });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Prompts API] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt' },
      { status: 500 }
    );
  }
}

// DELETE /api/resources/prompts/[id] - Delete prompt
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    // TODO: Add ownership check - user can only delete their own prompts
    // For now, using admin client bypasses RLS

    const { error } = await supabase
      .from('resource_prompts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Prompts API] Delete error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Prompts API] Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete prompt' },
      { status: 500 }
    );
  }
}
