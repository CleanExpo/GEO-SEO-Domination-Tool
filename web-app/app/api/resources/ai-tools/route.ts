import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { z } from 'zod';

const aiToolSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  url: z.string().url('Valid URL is required'),
  category: z.string().optional(),
  pricing: z.string().optional(),
  features: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  favorite: z.boolean().optional(),
});

// GET /api/resources/ai-tools - List all AI tools
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const pricing = searchParams.get('pricing');
    const favorite = searchParams.get('favorite');

    let query = supabase
      .from('resource_ai_tools')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (pricing) {
      query = query.eq('pricing', pricing);
    }

    if (favorite === 'true') {
      query = query.eq('favorite', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Parse JSON arrays from strings
    const aiTools = data.map(tool => ({
      ...tool,
      features: tool.features ? JSON.parse(tool.features) : [],
      tags: tool.tags ? JSON.parse(tool.tags) : [],
    }));

    return NextResponse.json({ aiTools });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch AI tools' },
      { status: 500 }
    );
  }
}

// POST /api/resources/ai-tools - Create a new AI tool
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const validatedData = aiToolSchema.parse(body);

    // Convert arrays to JSON strings for SQLite
    const insertData = {
      ...validatedData,
      features: validatedData.features ? JSON.stringify(validatedData.features) : null,
      tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
    };

    const { data, error } = await supabase
      .from('resource_ai_tools')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Parse arrays back from JSON strings
    const aiTool = {
      ...data,
      features: data.features ? JSON.parse(data.features) : [],
      tags: data.tags ? JSON.parse(data.tags) : [],
    };

    return NextResponse.json({ aiTool }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create AI tool' },
      { status: 500 }
    );
  }
}
