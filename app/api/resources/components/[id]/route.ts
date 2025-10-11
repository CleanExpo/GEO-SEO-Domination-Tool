import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import type { Component } from '@/types/resources';

// GET /api/resources/components/[id] - Get single component
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const { data, error } = await supabase
      .from('resource_components')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Components API] Get error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return NextResponse.json({ component: data as Component });
  } catch (error: any) {
    console.error('[Components API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch component' },
      { status: 500 }
    );
  }
}
