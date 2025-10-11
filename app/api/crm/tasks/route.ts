import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';
import type { Task } from '@/types/crm';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  due_date: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['pending', 'in_progress', 'completed']),
  contact_id: z.string().uuid().optional(),
  deal_id: z.string().uuid().optional(),
});

// GET /api/crm/tasks - List all tasks
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const contact_id = searchParams.get('contact_id');
    const deal_id = searchParams.get('deal_id');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('crm_tasks')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (contact_id) {
      query = query.eq('contact_id', contact_id);
    }
    if (deal_id) {
      query = query.eq('deal_id', deal_id);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[Tasks API] Supabase error:', error);
      return NextResponse.json(
        { tasks: [], total: 0, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tasks: data as Task[] || [],
      total: count || 0,
    });
  } catch (error: any) {
    console.error('[Tasks API] Fatal error:', error);
    return NextResponse.json(
      { tasks: [], total: 0, error: error.message || 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/crm/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    // Validate input
    const validatedData = taskSchema.parse(body);

    const { data, error } = await supabase
      .from('crm_tasks')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      console.error('[Tasks API] Insert error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ task: data as Task }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Tasks API] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
