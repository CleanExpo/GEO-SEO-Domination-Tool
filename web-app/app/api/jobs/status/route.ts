import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

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
    const { searchParams } = new URL(request.url);
    const jobName = searchParams.get('job');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query based on parameters
    let query = `
      SELECT
        job_name,
        start_time,
        end_time,
        duration_ms,
        status,
        details,
        created_at
      FROM job_executions
    `;

    const queryParams: any[] = [];
    const conditions: string[] = [];

    if (jobName) {
      conditions.push(`job_name = $${queryParams.length + 1}`);
      queryParams.push(jobName);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY start_time DESC';
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM job_executions';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const countResult = await pool.query(
      countQuery,
      queryParams.slice(0, queryParams.length - 2)
    );
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Get summary statistics by job
    const summaryQuery = `
      SELECT
        job_name,
        COUNT(*) as total_executions,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        AVG(duration_ms) as avg_duration_ms,
        MAX(start_time) as last_execution
      FROM job_executions
      ${jobName ? `WHERE job_name = $1` : ''}
      GROUP BY job_name
      ORDER BY job_name
    `;

    const summaryResult = await pool.query(
      summaryQuery,
      jobName ? [jobName] : []
    );

    return NextResponse.json({
      success: true,
      data: {
        executions: result.rows,
        summary: summaryResult.rows,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
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
    const body = await request.json();
    const { jobNames, startDate, endDate } = body;

    // Build query for specific jobs and date range
    let query = `
      SELECT
        job_name,
        start_time,
        end_time,
        duration_ms,
        status,
        details
      FROM job_executions
      WHERE 1=1
    `;

    const queryParams: any[] = [];

    if (jobNames && Array.isArray(jobNames) && jobNames.length > 0) {
      query += ` AND job_name = ANY($${queryParams.length + 1})`;
      queryParams.push(jobNames);
    }

    if (startDate) {
      query += ` AND start_time >= $${queryParams.length + 1}`;
      queryParams.push(new Date(startDate));
    }

    if (endDate) {
      query += ` AND start_time <= $${queryParams.length + 1}`;
      queryParams.push(new Date(endDate));
    }

    query += ' ORDER BY start_time DESC LIMIT 100';

    const result = await pool.query(query, queryParams);

    // Calculate statistics
    const stats = {
      total: result.rows.length,
      successful: result.rows.filter((r) => r.status === 'success').length,
      failed: result.rows.filter((r) => r.status === 'failed').length,
      avgDuration:
        result.rows.reduce((sum, r) => sum + (r.duration_ms || 0), 0) /
        (result.rows.length || 1),
    };

    return NextResponse.json({
      success: true,
      data: {
        executions: result.rows,
        statistics: stats,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
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
