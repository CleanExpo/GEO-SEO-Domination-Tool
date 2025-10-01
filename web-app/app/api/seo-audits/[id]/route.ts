import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/seo-audits/[id] - Get a single SEO audit
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('seo_audits')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ audit: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch SEO audit' },
      { status: 500 }
    );
  }
}

// DELETE /api/seo-audits/[id] - Delete an SEO audit
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('seo_audits')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'SEO audit deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete SEO audit' },
      { status: 500 }
    );
  }
}
