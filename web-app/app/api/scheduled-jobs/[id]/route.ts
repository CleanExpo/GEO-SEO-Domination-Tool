import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { z } from 'zod';

const UpdateJobSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  schedule: z.string().regex(/^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})$/).optional(),
  is_active: z.boolean().optional(),
  config: z.object({
    keywords: z.array(z.string()).optional(),
    search_engine: z.string().optional(),
    location: z.string().optional(),
    url: z.string().optional(),
  }).optional(),
});

// GET /api/scheduled-jobs/[id] - Get a specific job
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data, error } = await supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Also fetch execution history
    const { data: executions } = await supabase
      .from('job_executions')
      .select('*')
      .eq('job_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      job: data,
      executions: executions || []
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch scheduled job' },
      { status: 500 }
    );
  }
}

// PUT /api/scheduled-jobs/[id] - Update a job
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const body = await request.json();

    const validatedData = UpdateJobSchema.parse(body);

    const { data, error } = await supabase
      .from('scheduled_jobs')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update scheduled job' },
      { status: 500 }
    );
  }
}

// DELETE /api/scheduled-jobs/[id] - Delete a job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { error } = await supabase
      .from('scheduled_jobs')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete scheduled job' },
      { status: 500 }
    );
  }
}
