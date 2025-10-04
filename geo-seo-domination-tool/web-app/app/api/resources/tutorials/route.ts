import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { z } from 'zod';

const tutorialSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  category: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  duration: z.number().optional(),
  tags: z.array(z.string()).optional(),
  video_url: z.string().optional(),
  resources: z.array(z.string()).optional(),
  favorite: z.boolean().optional(),
});

// GET /api/resources/tutorials - List all tutorials
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const favorite = searchParams.get('favorite');

    let query = supabase
      .from('crm_tutorials')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    if (favorite === 'true') {
      query = query.eq('favorite', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Parse JSON arrays from strings
    const tutorials = data.map(tutorial => ({
      ...tutorial,
      tags: tutorial.tags ? JSON.parse(tutorial.tags) : [],
      resources: tutorial.resources ? JSON.parse(tutorial.resources) : [],
    }));

    return NextResponse.json({ tutorials });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tutorials' },
      { status: 500 }
    );
  }
}

// POST /api/resources/tutorials - Create a new tutorial
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const validatedData = tutorialSchema.parse(body);

    // Convert arrays to JSON strings for SQLite
    const insertData = {
      ...validatedData,
      tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
      resources: validatedData.resources ? JSON.stringify(validatedData.resources) : null,
    };

    const { data, error } = await supabase
      .from('crm_tutorials')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Parse arrays back from JSON strings
    const tutorial = {
      ...data,
      tags: data.tags ? JSON.parse(data.tags) : [],
      resources: data.resources ? JSON.parse(data.resources) : [],
    };

    return NextResponse.json({ tutorial }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create tutorial' },
      { status: 500 }
    );
  }
}
