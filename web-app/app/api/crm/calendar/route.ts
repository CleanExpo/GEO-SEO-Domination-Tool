import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const calendarEventSchema = z.object({
  title: z.string().min(1, 'Event title is required'),
  event_date: z.string().min(1, 'Event date is required'),
  event_time: z.string().min(1, 'Event time is required'),
  duration: z.string().optional(),
  type: z.enum(['meeting', 'call', 'demo', 'follow-up']).default('meeting'),
  location: z.string().optional(),
  notes: z.string().optional(),
  contact_id: z.string().uuid().optional().nullable(),
});

// GET /api/crm/calendar - List all calendar events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const contactId = searchParams.get('contact_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase
      .from('crm_events')
      .select('*, crm_contacts(name, email)')
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true });

    // Apply filters if provided
    if (type) {
      query = query.eq('type', type);
    }
    if (contactId) {
      query = query.eq('contact_id', contactId);
    }
    if (startDate) {
      query = query.gte('event_date', startDate);
    }
    if (endDate) {
      query = query.lte('event_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

// POST /api/crm/calendar - Create a new calendar event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = calendarEventSchema.parse(body);

    const { data, error } = await supabase
      .from('crm_events')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ event: data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}
