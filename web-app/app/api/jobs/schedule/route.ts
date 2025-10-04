import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import cron from 'node-cron';

// Initialize database pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'geo_seo_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
});

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
    const { searchParams } = new URL(request.url);
    const jobName = searchParams.get('job');

    // Get schedules from database
    let query = `
      SELECT
        job_name,
        schedule,
        enabled,
        description,
        metadata,
        updated_at
      FROM job_schedules
    `;

    const queryParams: any[] = [];

    if (jobName) {
      query += ' WHERE job_name = $1';
      queryParams.push(jobName);
    }

    query += ' ORDER BY job_name';

    const result = await pool.query(query, queryParams);

    // If no schedules in database, return defaults
    if (result.rows.length === 0) {
      const schedules = jobName
        ? DEFAULT_SCHEDULES[jobName as keyof typeof DEFAULT_SCHEDULES]
          ? [DEFAULT_SCHEDULES[jobName as keyof typeof DEFAULT_SCHEDULES]]
          : []
        : Object.values(DEFAULT_SCHEDULES);

      return NextResponse.json({
        success: true,
        data: {
          schedules,
          source: 'defaults',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Add human-readable cron descriptions
    const schedulesWithDescriptions = result.rows.map((row) => ({
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
  } catch (error) {
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

    // Insert or update schedule
    const query = `
      INSERT INTO job_schedules (
        job_name,
        schedule,
        enabled,
        description,
        metadata,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (job_name)
      DO UPDATE SET
        schedule = EXCLUDED.schedule,
        enabled = EXCLUDED.enabled,
        description = EXCLUDED.description,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await pool.query(query, [
      jobName,
      schedule,
      enabled !== undefined ? enabled : true,
      description || null,
      metadata ? JSON.stringify(metadata) : null,
    ]);

    return NextResponse.json({
      success: true,
      message: 'Job schedule updated successfully',
      data: {
        schedule: {
          ...result.rows[0],
          cronDescription: describeCronPattern(schedule),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
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
    const body = await request.json();
    const { jobName, schedule, enabled } = body;

    // Validate required fields
    if (!jobName) {
      return NextResponse.json(
        { error: 'Missing required field: jobName' },
        { status: 400 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const queryParams: any[] = [jobName];

    if (schedule !== undefined) {
      // Validate cron pattern
      if (!cron.validate(schedule)) {
        return NextResponse.json(
          { error: 'Invalid cron pattern', pattern: schedule },
          { status: 400 }
        );
      }
      updates.push(`schedule = $${queryParams.length + 1}`);
      queryParams.push(schedule);
    }

    if (enabled !== undefined) {
      updates.push(`enabled = $${queryParams.length + 1}`);
      queryParams.push(enabled);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push('updated_at = NOW()');

    const query = `
      UPDATE job_schedules
      SET ${updates.join(', ')}
      WHERE job_name = $1
      RETURNING *
    `;

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Job schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Job schedule updated successfully',
      data: {
        schedule: {
          ...result.rows[0],
          cronDescription: describeCronPattern(result.rows[0].schedule),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
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
    const { searchParams } = new URL(request.url);
    const jobName = searchParams.get('job');

    if (!jobName) {
      return NextResponse.json(
        { error: 'Missing required parameter: job' },
        { status: 400 }
      );
    }

    const query = `
      DELETE FROM job_schedules
      WHERE job_name = $1
      RETURNING *
    `;

    const result = await pool.query(query, [jobName]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Job schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Job schedule deleted (reverted to default)',
      data: {
        deleted: result.rows[0],
        default: DEFAULT_SCHEDULES[jobName as keyof typeof DEFAULT_SCHEDULES] || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
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
