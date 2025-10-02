import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { z } from 'zod';

const componentUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  code: z.string().min(1).optional(),
  framework: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  demo_url: z.string().optional(),
  favorite: z.boolean().optional(),
  usage_count: z.number().optional(),
});

// GET /api/resources/components/[id] - Get a single component
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { data, error } = await supabase
      .from('crm_components')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Parse tags from JSON string
    const component = {
      ...data,
      tags: data.tags ? JSON.parse(data.tags) : [],
    };

    return NextResponse.json({ component });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch component' },
      { status: 500 }
    );
  }
}

// PUT /api/resources/components/[id] - Update a component
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();
    const validatedData = componentUpdateSchema.parse(body);

    // Convert tags array to JSON string for SQLite
    const updateData: any = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    if (validatedData.tags) {
      updateData.tags = JSON.stringify(validatedData.tags);
    }

    const { data, error } = await supabase
      .from('crm_components')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Parse tags back to array
    const component = {
      ...data,
      tags: data.tags ? JSON.parse(data.tags) : [],
    };

    return NextResponse.json({ component });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update component' },
      { status: 500 }
    );
  }
}

// DELETE /api/resources/components/[id] - Delete a component
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { error } = await supabase
      .from('crm_components')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Component deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete component' },
      { status: 500 }
    );
  }
}
