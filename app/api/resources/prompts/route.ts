import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';
import type { Prompt } from '@/types/resources';

const promptSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  category: z.enum(['content', 'technical', 'local', 'general']).optional(),
  tags: z.array(z.string()).optional(),
  is_public: z.boolean().default(false),
  user_id: z.string().uuid().optional(),
});

// GET /api/resources/prompts - List all prompts
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const user_id = searchParams.get('user_id');
    const is_public = searchParams.get('is_public');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('resource_prompts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }
    if (user_id) {
      // Show user's own prompts + public prompts
      query = query.or(`user_id.eq.${user_id},is_public.eq.true`);
    } else if (is_public === 'true') {
      query = query.eq('is_public', true);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[Prompts API] Supabase error:', error);
      return NextResponse.json(
        { prompts: [], total: 0, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      prompts: data as Prompt[] || [],
      total: count || 0,
    });
  } catch (error: any) {
    console.error('[Prompts API] Fatal error:', error);
    return NextResponse.json(
      { prompts: [], total: 0, error: error.message || 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

// POST /api/resources/prompts - Create a new prompt
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    // Validate input
    const validatedData = promptSchema.parse(body);

    const { data, error } = await supabase
      .from('resource_prompts')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      console.error('[Prompts API] Insert error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ prompt: data as Prompt }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Prompts API] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    );
  }
}
