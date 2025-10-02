import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { z } from 'zod';

const promptSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  favorite: z.boolean().optional(),
});

// GET /api/resources/prompts - List all prompts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const favorite = searchParams.get('favorite');

    let query = supabase
      .from('crm_prompts')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (favorite === 'true') {
      query = query.eq('favorite', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Parse tags from JSON string
    const prompts = data.map(prompt => ({
      ...prompt,
      tags: prompt.tags ? JSON.parse(prompt.tags) : [],
    }));

    return NextResponse.json({ prompts });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

// POST /api/resources/prompts - Create a new prompt
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const validatedData = promptSchema.parse(body);

    // Convert tags array to JSON string for SQLite
    const insertData = {
      ...validatedData,
      tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
    };

    const { data, error } = await supabase
      .from('crm_prompts')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Parse tags back to array
    const prompt = {
      ...data,
      tags: data.tags ? JSON.parse(data.tags) : [],
    };

    return NextResponse.json({ prompt }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    );
  }
}
