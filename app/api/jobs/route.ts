import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';
import type { Job } from '@/types/projects';

const jobSchema = z.object({
  type: z.enum(['audit', 'ranking', 'report']),
  schedule: z.string().min(1, 'Schedule (cron expression) is required'),
  config: z.any().optional(),
  enabled: z.boolean().default(true),
});

// GET /api/jobs - List all scheduled jobs
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('scheduled_jobs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }
    if (status === 'enabled') {
      query = query.eq('enabled', true);
    } else if (status === 'disabled') {
      query = query.eq('enabled', false);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[Jobs API] Supabase error:', error);
      return NextResponse.json(
        { jobs: [], total: 0, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      jobs: data as Job[] || [],
      total: count || 0,
    });
  } catch (error: any) {
    console.error('[Jobs API] Fatal error:', error);
    return NextResponse.json(
      { jobs: [], total: 0, error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new scheduled job
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    // Validate input
    const validatedData = jobSchema.parse(body);

    const { data, error } = await supabase
      .from('scheduled_jobs')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      console.error('[Jobs API] Insert error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ job: data as Job }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Jobs API] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}
