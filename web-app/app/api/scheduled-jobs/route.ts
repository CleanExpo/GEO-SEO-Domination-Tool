import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { z } from 'zod';

// Validation schema
const ScheduledJobSchema = z.object({
  job_type: z.enum(['ranking_check', 'audit', 'report']),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  schedule: z.string().regex(/^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})$/, 'Invalid cron expression'),
  is_active: z.boolean().default(true),
  config: z.object({
    keywords: z.array(z.string()).optional(),
    search_engine: z.string().optional(),
    location: z.string().optional(),
    url: z.string().optional(),
  }),
  company_id: z.string().uuid().optional().nullable(),
});

// GET /api/scheduled-jobs - List all scheduled jobs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id');
    const jobType = searchParams.get('job_type');
    const isActive = searchParams.get('is_active');

    let query = supabase
      .from('scheduled_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (jobType) {
      query = query.eq('job_type', jobType);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ jobs: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch scheduled jobs' },
      { status: 500 }
    );
  }
}

// POST /api/scheduled-jobs - Create a new scheduled job
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate input
    const validatedData = ScheduledJobSchema.parse(body);

    // Calculate next run time (simplified - using current time + 1 hour as example)
    const nextRunAt = new Date();
    nextRunAt.setHours(nextRunAt.getHours() + 1);

    const { data, error } = await supabase
      .from('scheduled_jobs')
      .insert([
        {
          ...validatedData,
          next_run_at: nextRunAt.toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ job: data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create scheduled job' },
      { status: 500 }
    );
  }
}

// PATCH /api/scheduled-jobs - Bulk update (enable/disable jobs)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { job_ids, is_active } = body;

    if (!job_ids || !Array.isArray(job_ids)) {
      return NextResponse.json(
        { error: 'job_ids array is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('scheduled_jobs')
      .update({ is_active })
      .in('id', job_ids)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ jobs: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update scheduled jobs' },
      { status: 500 }
    );
  }
}
