import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';
import type { Component } from '@/types/resources';

const componentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['form', 'card', 'chart', 'table', 'layout']).optional(),
  code: z.string().optional(),
  preview_url: z.string().url().optional(),
  dependencies: z.array(z.string()).optional(),
});

// GET /api/resources/components - List all components
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('resource_components')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[Components API] Supabase error:', error);
      return NextResponse.json(
        { components: [], total: 0, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      components: data as Component[] || [],
      total: count || 0,
    });
  } catch (error: any) {
    console.error('[Components API] Fatal error:', error);
    return NextResponse.json(
      { components: [], total: 0, error: error.message || 'Failed to fetch components' },
      { status: 500 }
    );
  }
}

// POST /api/resources/components - Create a new component (Admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    // Validate input
    const validatedData = componentSchema.parse(body);

    const { data, error } = await supabase
      .from('resource_components')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      console.error('[Components API] Insert error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ component: data as Component }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Components API] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create component' },
      { status: 500 }
    );
  }
}
