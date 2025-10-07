import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import cron from 'node-cron';

// Verify API key
function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    console.warn('[Jobs/Schedule] API_KEY not configured - allowing request');
    return true; // Allow if not configured (dev mode)
  }

  return apiKey === validApiKey;
}

// Default job schedules
const DEFAULT_SCHEDULES = {
  'audit-runner': {
    name: 'audit-runner',
    description: 'Run automated SEO audits for companies',
    schedule: '0 2 * * *', // Daily at 2 AM
    enabled: true,
  },
  'ranking-tracker': {
    name: 'ranking-tracker',
    description: 'Track keyword rankings daily',
    schedule: '0 3 * * *', // Daily at 3 AM
    enabled: true,
  },
  'ranking-tracker-hourly': {
    name: 'ranking-tracker-hourly',
    description: 'Track high-priority keyword rankings hourly',
    schedule: '0 * * * *', // Every hour
    enabled: false,
  },
  'report-generator': {
    name: 'report-generator',
    description: 'Generate and send weekly reports',
    schedule: '0 8 * * 1', // Monday at 8 AM
    enabled: true,
  },
};

// GET endpoint to retrieve job schedules
export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const jobName = searchParams.get('job');

    console.log('[Jobs/Schedule] Fetching job schedules', { jobName });

    // Get schedules from database
    let query = supabase
      .from('job_schedules')
      .select('job_name, schedule, enabled, description, metadata, updated_at')
      .order('job_name');

    if (jobName) {
      query = query.eq('job_name', jobName);
    }

    const { data: schedules, error } = await query;

    if (error) {
      console.error('[Jobs/Schedule] Database error:', error);
      throw error;
    }

    // If no schedules in database, return defaults
    if (!schedules || schedules.length === 0) {
      const defaultSchedules = jobName
        ? DEFAULT_SCHEDULES[jobName as keyof typeof DEFAULT_SCHEDULES]
          ? [DEFAULT_SCHEDULES[jobName as keyof typeof DEFAULT_SCHEDULES]]
          : []
        : Object.values(DEFAULT_SCHEDULES);

      console.log('[Jobs/Schedule] No schedules in database, returning defaults');

      return NextResponse.json({
        success: true,
        data: {
          schedules: defaultSchedules,
          source: 'defaults',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Add human-readable cron descriptions
    const schedulesWithDescriptions = schedules.map((row) => ({
      ...row,
      cronDescription: describeCronPattern(row.schedule),
    }));

    return NextResponse.json({
      success: true,
      data: {
        schedules: schedulesWithDescriptions,
        source: 'database',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Jobs/Schedule] Error fetching schedules:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch job schedules',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST endpoint to create or update job schedules
export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const body = await request.json();
    const { jobName, schedule, enabled, description, metadata } = body;

    // Validate required fields
    if (!jobName || !schedule) {
      return NextResponse.json(
        { error: 'Missing required fields: jobName and schedule' },
        { status: 400 }
      );
    }

    // Validate cron pattern
    if (!cron.validate(schedule)) {
      return NextResponse.json(
        { error: 'Invalid cron pattern', pattern: schedule },
        { status: 400 }
      );
    }

    console.log('[Jobs/Schedule] Creating/updating job schedule:', jobName);

    // Check if schedule already exists
    const { data: existing } = await supabase
      .from('job_schedules')
      .select('id')
      .eq('job_name', jobName)
      .single();

    let result;
    if (existing) {
      // Update existing schedule
      const { data, error } = await supabase
        .from('job_schedules')
        .update({
          schedule,
          enabled: enabled !== undefined ? enabled : true,
          description: description || null,
          metadata: metadata || null,
          updated_at: new Date().toISOString(),
        })
        .eq('job_name', jobName)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new schedule
      const { data, error } = await supabase
        .from('job_schedules')
        .insert([{
          job_name: jobName,
          schedule,
          enabled: enabled !== undefined ? enabled : true,
          description: description || null,
          metadata: metadata || null,
        }])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      message: 'Job schedule updated successfully',
      data: {
        schedule: {
          ...result,
          cronDescription: describeCronPattern(schedule),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Jobs/Schedule] Error updating schedule:', error);
    return NextResponse.json(
      {
        error: 'Failed to update job schedule',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT endpoint to update job schedule
export async function PUT(request: NextRequest) {
  // Verify authorization
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const body = await request.json();
    const { jobName, schedule, enabled } = body;

    // Validate required fields
    if (!jobName) {
      return NextResponse.json(
        { error: 'Missing required field: jobName' },
        { status: 400 }
      );
    }

    // Build update object dynamically
    const updates: any = {};

    if (schedule !== undefined) {
      // Validate cron pattern
      if (!cron.validate(schedule)) {
        return NextResponse.json(
          { error: 'Invalid cron pattern', pattern: schedule },
          { status: 400 }
        );
      }
      updates.schedule = schedule;
    }

    if (enabled !== undefined) {
      updates.enabled = enabled;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    console.log('[Jobs/Schedule] Updating job schedule:', jobName);

    const { data, error } = await supabase
      .from('job_schedules')
      .update(updates)
      .eq('job_name', jobName)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Job schedule not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Job schedule updated successfully',
      data: {
        schedule: {
          ...data,
          cronDescription: describeCronPattern(data.schedule),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Jobs/Schedule] Error updating schedule:', error);
    return NextResponse.json(
      {
        error: 'Failed to update job schedule',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove job schedule (reverts to default)
export async function DELETE(request: NextRequest) {
  // Verify authorization
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const jobName = searchParams.get('job');

    if (!jobName) {
      return NextResponse.json(
        { error: 'Missing required parameter: job' },
        { status: 400 }
      );
    }

    console.log('[Jobs/Schedule] Deleting job schedule:', jobName);

    const { data, error } = await supabase
      .from('job_schedules')
      .delete()
      .eq('job_name', jobName)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Job schedule not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Job schedule deleted (reverted to default)',
      data: {
        deleted: data,
        default: DEFAULT_SCHEDULES[jobName as keyof typeof DEFAULT_SCHEDULES] || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Jobs/Schedule] Error deleting schedule:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete job schedule',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper function to describe cron patterns in human-readable format
function describeCronPattern(pattern: string): string {
  const patterns: { [key: string]: string } = {
    '0 2 * * *': 'Daily at 2:00 AM',
    '0 3 * * *': 'Daily at 3:00 AM',
    '0 * * * *': 'Every hour',
    '0 8 * * 1': 'Every Monday at 8:00 AM',
    '*/15 * * * *': 'Every 15 minutes',
    '*/30 * * * *': 'Every 30 minutes',
    '0 0 * * *': 'Daily at midnight',
    '0 12 * * *': 'Daily at noon',
    '0 0 * * 0': 'Every Sunday at midnight',
  };

  return patterns[pattern] || 'Custom schedule';
}
