import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import type { AITool } from '@/types/resources';

// GET /api/resources/ai-tools/[id] - Get single AI tool
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from('resource_ai_tools')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[AI Tools API] Get error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return NextResponse.json({ tool: data as AITool });
  } catch (error: any) {
    console.error('[AI Tools API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch AI tool' },
      { status: 500 }
    );
  }
}
