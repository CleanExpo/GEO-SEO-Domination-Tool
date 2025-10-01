import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/rankings/[id] - Get a single ranking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('rankings')
      .select('*, keywords(*)')
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ ranking: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch ranking' },
      { status: 500 }
    );
  }
}

// DELETE /api/rankings/[id] - Delete a ranking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('rankings')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Ranking deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete ranking' },
      { status: 500 }
    );
  }
}
