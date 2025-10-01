import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const componentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  code: z.string().min(1, 'Code is required'),
  framework: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  demo_url: z.string().optional(),
  favorite: z.boolean().optional(),
});

// GET /api/resources/components - List all components
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const framework = searchParams.get('framework');
    const favorite = searchParams.get('favorite');

    let query = supabase
      .from('crm_components')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (framework) {
      query = query.eq('framework', framework);
    }

    if (favorite === 'true') {
      query = query.eq('favorite', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Parse tags from JSON string
    const components = data.map(component => ({
      ...component,
      tags: component.tags ? JSON.parse(component.tags) : [],
    }));

    return NextResponse.json({ components });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch components' },
      { status: 500 }
    );
  }
}

// POST /api/resources/components - Create a new component
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = componentSchema.parse(body);

    // Convert tags array to JSON string for SQLite
    const insertData = {
      ...validatedData,
      tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
    };

    const { data, error } = await supabase
      .from('crm_components')
      .insert([insertData])
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

    return NextResponse.json({ component }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create component' },
      { status: 500 }
    );
  }
}
