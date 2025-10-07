import { NextRequest, NextResponse } from 'next/server';
import { createClient, getUser } from '@/lib/auth/supabase-server';
import { getCurrentOrganisationId } from '@/lib/tenant-context';
import { getActiveCompanyId } from '@/lib/company-context';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().min(1, 'Location is required'),
  status: z.enum(['lead', 'active', 'inactive']).default('lead'),
  notes: z.string().optional(),
});

// GET /api/crm/contacts - List all contacts for the active company
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Get organisation and company context
    const organisationId = await getCurrentOrganisationId();
    const companyId = await getActiveCompanyId();

    let query = supabase
      .from('crm_contacts')
      .select('*')
      .eq('organisation_id', organisationId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contacts: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

// POST /api/crm/contacts - Create a new contact for the active company
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    // Get organisation and company context
    const organisationId = await getCurrentOrganisationId();
    const companyId = await getActiveCompanyId();

    const { data, error } = await supabase
      .from('crm_contacts')
      .insert([{
        ...validatedData,
        user_id: user.id,
        organisation_id: organisationId,
        company_id: companyId
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contact: data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
