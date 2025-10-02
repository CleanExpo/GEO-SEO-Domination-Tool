import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { z } from 'zod';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  website: z.string().url('Valid website URL is required'),
  industry: z.string().optional(),
  location: z.string().optional(),
});

// GET /api/companies - List all companies
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ companies: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

// POST /api/companies - Create a new company
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const validatedData = companySchema.parse(body);

    const { data, error } = await supabase
      .from('companies')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ company: data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    );
  }
}
