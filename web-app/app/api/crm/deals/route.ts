import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { z } from 'zod';

const dealSchema = z.object({
  title: z.string().min(1, 'Deal title is required'),
  contact_id: z.string().uuid('Valid contact ID is required'),
  company: z.string().optional(),
  value: z.number().positive('Deal value must be positive'),
  stage: z.enum(['prospect', 'qualification', 'proposal', 'negotiation', 'closed']).default('prospect'),
  probability: z.number().min(0).max(100).default(0),
  close_date: z.string().optional(),
});

// GET /api/crm/deals - List all deals
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const contactId = searchParams.get('contact_id');

    let query = supabase
      .from('crm_deals')
      .select('*, crm_contacts(name, email)')
      .order('created_at', { ascending: false });

    // Filter by stage if provided
    if (stage) {
      query = query.eq('stage', stage);
    }

    // Filter by contact_id if provided
    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deals: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

// POST /api/crm/deals - Create a new deal
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const validatedData = dealSchema.parse(body);

    const { data, error } = await supabase
      .from('crm_deals')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deal: data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    );
  }
}
