import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { z } from 'zod';

const aiToolSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  url: z.string().url('Valid URL is required'),
  category: z.string().min(1, 'Category is required'),
  icon: z.string().default('🤖'),
  features: z.union([
    z.array(z.string()),
    z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean))
  ]),
  rating: z.number().min(1).max(5).default(5),
  isPremium: z.boolean().default(false),
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
      .from('crm_ai_tools')
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

    // Parse JSON arrays from strings and map to page interface
    const tools = data.map(tool => ({
      id: tool.id,
      name: tool.title,
      description: tool.description,
      category: tool.category || 'Uncategorized',
      url: tool.url,
      icon: tool.tags ? (() => {
        try {
          const tags = JSON.parse(tool.tags);
          return tags[0] || '🤖';
        } catch {
          return '🤖';
        }
      })() : '🤖',
      features: tool.features ? JSON.parse(tool.features) : [],
      rating: tool.rating || 5,
      isPremium: tool.pricing === 'paid' || tool.pricing === 'enterprise',
    }));

    return NextResponse.json({ tools });
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

    // Map to database schema
    const insertData = {
      title: validatedData.name,
      description: validatedData.description,
      url: validatedData.url,
      category: validatedData.category,
      pricing: validatedData.isPremium ? 'paid' : 'free',
      features: JSON.stringify(validatedData.features),
      tags: JSON.stringify([validatedData.icon]),
      rating: validatedData.rating,
      favorite: false,
    };

    const { data, error } = await supabase
      .from('crm_ai_tools')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map back to page interface
    const tool = {
      id: data.id,
      name: data.title,
      description: data.description,
      category: data.category,
      url: data.url,
      icon: validatedData.icon,
      features: validatedData.features,
      rating: data.rating,
      isPremium: validatedData.isPremium,
    };

    return NextResponse.json({ tool }, { status: 201 });
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
