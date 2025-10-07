import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';

// Verify API key
function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    console.warn('[Jobs/Status] API_KEY not configured - allowing request');
    return true; // Allow if not configured (dev mode)
  }

  return apiKey === validApiKey;
}

// GET endpoint to check job status
export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const jobName = searchParams.get('job');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('[Jobs/Status] Fetching job status', { jobName, limit, offset });

    // Build query for executions
    let executionsQuery = supabase
      .from('job_executions')
      .select('job_name, start_time, end_time, duration_ms, status, details, created_at')
      .order('start_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (jobName) {
      executionsQuery = executionsQuery.eq('job_name', jobName);
    }

    const { data: executions, error: execError } = await executionsQuery;

    if (execError) throw execError;

    // Get total count
    let countQuery = supabase
      .from('job_executions')
      .select('*', { count: 'exact', head: true });

    if (jobName) {
      countQuery = countQuery.eq('job_name', jobName);
    }

    const { count: total, error: countError } = await countQuery;

    if (countError) throw countError;

    // Get summary statistics - note: Supabase doesn't support complex aggregations easily,
    // so we'll fetch data and calculate in memory for now
    let summaryQuery = supabase
      .from('job_executions')
      .select('job_name, status, duration_ms, start_time');

    if (jobName) {
      summaryQuery = summaryQuery.eq('job_name', jobName);
    }

    const { data: allExecutions, error: summaryError } = await summaryQuery;

    if (summaryError) throw summaryError;

    // Calculate summary statistics
    const summaryMap = new Map<string, any>();
    allExecutions?.forEach((exec) => {
      const name = exec.job_name;
      if (!summaryMap.has(name)) {
        summaryMap.set(name, {
          job_name: name,
          total_executions: 0,
          successful: 0,
          failed: 0,
          total_duration: 0,
          last_execution: exec.start_time,
        });
      }
      const summary = summaryMap.get(name);
      summary.total_executions++;
      if (exec.status === 'success') summary.successful++;
      if (exec.status === 'failed') summary.failed++;
      if (exec.duration_ms) summary.total_duration += exec.duration_ms;
      if (new Date(exec.start_time) > new Date(summary.last_execution)) {
        summary.last_execution = exec.start_time;
      }
    });

    const summary = Array.from(summaryMap.values()).map((s) => ({
      ...s,
      avg_duration_ms: s.total_executions > 0 ? Math.round(s.total_duration / s.total_executions) : 0,
      total_duration: undefined, // Remove temporary field
    }));

    return NextResponse.json({
      success: true,
      data: {
        executions: executions || [],
        summary,
        pagination: {
          total: total || 0,
          limit,
          offset,
          hasMore: offset + limit < (total || 0),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Jobs/Status] Error fetching job status:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch job status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST endpoint to check specific job execution status
export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const body = await request.json();
    const { jobNames, startDate, endDate } = body;

    console.log('[Jobs/Status] Fetching executions with filters', { jobNames, startDate, endDate });

    // Build query for specific jobs and date range
    let query = supabase
      .from('job_executions')
      .select('job_name, start_time, end_time, duration_ms, status, details')
      .order('start_time', { ascending: false })
      .limit(100);

    if (jobNames && Array.isArray(jobNames) && jobNames.length > 0) {
      query = query.in('job_name', jobNames);
    }

    if (startDate) {
      query = query.gte('start_time', new Date(startDate).toISOString());
    }

    if (endDate) {
      query = query.lte('start_time', new Date(endDate).toISOString());
    }

    const { data: executions, error } = await query;

    if (error) throw error;

    // Calculate statistics
    const stats = {
      total: executions?.length || 0,
      successful: executions?.filter((r) => r.status === 'success').length || 0,
      failed: executions?.filter((r) => r.status === 'failed').length || 0,
      avgDuration:
        executions && executions.length > 0
          ? Math.round(executions.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / executions.length)
          : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        executions: executions || [],
        statistics: stats,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Jobs/Status] Error processing request:', error);
    return NextResponse.json(
      {
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
