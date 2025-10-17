import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';
import type { Contact } from '@/types/crm';

const contactUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/crm/contacts/[id] - Get single contact by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    // Validate UUID format
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { error: 'Invalid contact ID format' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Contact not found' },
          { status: 404 }
        );
      }
      console.error('[Contacts API] Get by ID error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ contact: data as Contact });
  } catch (error: any) {
    console.error('[Contacts API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

// PUT /api/crm/contacts/[id] - Update contact by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    // Validate UUID format
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { error: 'Invalid contact ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = contactUpdateSchema.parse(body);

    // Check if contact exists
    const { data: existingContact, error: fetchError } = await supabase
      .from('crm_contacts')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Update contact
    const { data, error } = await supabase
      .from('crm_contacts')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Contacts API] Update error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ contact: data as Contact });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Contacts API] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

// DELETE /api/crm/contacts/[id] - Delete contact by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    // Validate UUID format
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { error: 'Invalid contact ID format' },
        { status: 400 }
      );
    }

    // Check if contact exists
    const { data: existingContact, error: fetchError } = await supabase
      .from('crm_contacts')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Delete contact
    const { error } = await supabase
      .from('crm_contacts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Contacts API] Delete error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Contacts API] Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
