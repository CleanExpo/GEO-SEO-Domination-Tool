import { NextRequest, NextResponse } from 'next/server';
import { createClient, getUser } from '@/lib/auth/supabase-server';
import { getCurrentOrganisationId } from '@/lib/tenant-context';
import { z } from 'zod';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  website: z.string().url('Valid website URL is required'),
  industry: z.string().optional(),
  location: z.string().optional(),
});

// GET /api/companies - List all companies (scoped to current organisation)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    // If no authenticated user, return empty array (not an error)
    if (!user) {
      return NextResponse.json({ companies: [] });
    }

    // Get companies filtered by RLS policies (organisation_id is handled automatically)
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // RLS policy errors should not crash the API
      console.error('[Companies API] Supabase error:', error);
      return NextResponse.json({ companies: [], error: error.message }, { status: 200 });
    }

    return NextResponse.json({ companies: data || [] });
  } catch (error: any) {
    console.error('[Companies API] Fatal error:', error);
    return NextResponse.json(
      { companies: [], error: error.message || 'Failed to fetch companies' },
      { status: 200 }
    );
  }
}

// POST /api/companies - Create a new company
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current organisation ID for the user
    const organisationId = await getCurrentOrganisationId();

    const body = await request.json();
    const validatedData = companySchema.parse(body);

    const { data, error } = await supabase
      .from('companies')
      .insert([{ ...validatedData, organisation_id: organisationId, user_id: user.id }])
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
