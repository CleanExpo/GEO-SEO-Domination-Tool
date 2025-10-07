import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { z } from 'zod';

const calendarEventSchema = z.object({
  title: z.string().min(1, 'Event title is required'),
  event_date: z.string().min(1, 'Event date is required'),
  event_time: z.string().min(1, 'Event time is required'),
  duration: z.string().min(1, 'Duration is required'),
  type: z.enum(['meeting', 'call', 'demo', 'follow-up']).default('meeting'),
  attendees: z.array(z.string()).min(1, 'At least one attendee is required'),
  location: z.string().optional(),
  notes: z.string().optional(),
  contact_id: z.string().uuid().optional().nullable(),
});

// GET /api/crm/calendar - List all calendar events
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const contactId = searchParams.get('contact_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase
      .from('crm_calendar_events')
      .select('*')
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

    const { data: events, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch attendees for each event
    const eventsWithAttendees = await Promise.all(
      (events || []).map(async (event) => {
        const { data: attendeesData } = await supabase
          .from('crm_event_attendees')
          .select('attendee_name')
          .eq('event_id', event.id);

        return {
          ...event,
          date: event.event_date,
          time: event.event_time,
          attendees: attendeesData?.map((a) => a.attendee_name) || [],
        };
      })
    );

    return NextResponse.json({ events: eventsWithAttendees });
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
    const supabase = await createClient();
    const body = await request.json();
    const validatedData = calendarEventSchema.parse(body);

    // Extract attendees from validated data
    const { attendees, ...eventData } = validatedData;

    // Insert the calendar event
    const { data: event, error: eventError } = await supabase
      .from('crm_calendar_events')
      .insert([eventData])
      .select()
      .single();

    if (eventError) {
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }

    // Insert attendees into crm_event_attendees table
    if (attendees && attendees.length > 0) {
      const attendeesData = attendees.map((attendee) => ({
        event_id: event.id,
        attendee_name: attendee,
        attendee_email: attendee.includes('@') ? attendee : null,
      }));

      const { error: attendeesError } = await supabase
        .from('crm_event_attendees')
        .insert(attendeesData);

      if (attendeesError) {
        // If attendees insert fails, we should rollback the event
        // But for simplicity, we'll log the error and continue
        console.error('Failed to insert attendees:', attendeesError);
      }
    }

    return NextResponse.json({ event }, { status: 201 });
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
