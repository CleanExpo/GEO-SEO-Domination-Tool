import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';
import type { AITool } from '@/types/resources';

const aiToolSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.enum(['content', 'technical', 'local', 'analytics']).optional(),
  url: z.string().url().optional(),
  pricing: z.enum(['free', 'freemium', 'paid']).optional(),
  use_cases: z.array(z.string()).optional(),
});

// GET /api/resources/ai-tools - List all AI tools
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('resource_ai_tools')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[AI Tools API] Supabase error:', error);
      return NextResponse.json(
        { tools: [], total: 0, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tools: data as AITool[] || [],
      total: count || 0,
    });
  } catch (error: any) {
    console.error('[AI Tools API] Fatal error:', error);
    return NextResponse.json(
      { tools: [], total: 0, error: error.message || 'Failed to fetch AI tools' },
      { status: 500 }
    );
  }
}

// POST /api/resources/ai-tools - Create a new AI tool (Admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    // Validate input
    const validatedData = aiToolSchema.parse(body);

    const { data, error } = await supabase
      .from('resource_ai_tools')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      console.error('[AI Tools API] Insert error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ tool: data as AITool }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[AI Tools API] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create AI tool' },
      { status: 500 }
    );
  }
}
