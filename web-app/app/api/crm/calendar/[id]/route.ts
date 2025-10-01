import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const calendarEventUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  event_date: z.string().optional(),
  event_time: z.string().optional(),
  duration: z.string().optional(),
  type: z.enum(['meeting', 'call', 'demo', 'follow-up']).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  contact_id: z.string().uuid().optional().nullable(),
});

// GET /api/crm/calendar/[id] - Get a single calendar event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('crm_calendar_events')
      .select('*, crm_contacts(name, email)')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ event: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch calendar event' },
      { status: 500 }
    );
  }
}

// PUT /api/crm/calendar/[id] - Update a calendar event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = calendarEventUpdateSchema.parse(body);

    const { data, error } = await supabase
      .from('crm_calendar_events')
      .update({ ...validatedData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ event: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    );
  }
}

// DELETE /api/crm/calendar/[id] - Delete a calendar event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from('crm_calendar_events')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Calendar event deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    );
  }
}
