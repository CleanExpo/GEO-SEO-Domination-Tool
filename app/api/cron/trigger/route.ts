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

// Verify cron secret for security
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('[Cron] CRON_SECRET not configured - allowing request');
    return true; // Allow if not configured (dev mode)
  }

  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace('Bearer ', '');
  return token === cronSecret;
}

// Helper to run job logic
async function runAuditJob(): Promise<any> {

  const startTime = new Date();

  try {
    // Get companies with scheduled audits
    const result = await pool.query(`
      SELECT id, name, website
      FROM companies
      WHERE website IS NOT NULL
        AND website != ''
        AND COALESCE((metadata->>'scheduled_audits')::boolean, false) = true
      LIMIT 10
    `);

    const companies = result.rows;

    // In production, this would trigger the actual audit service
    // For now, just log the execution
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    await logJobExecution('audit-runner', startTime, endTime, 'success', {
      companiesFound: companies.length,
      note: 'Triggered via Vercel cron',
    });

    return {
      success: true,
      companiesProcessed: companies.length,
      duration,
    };
  } catch (error) {
    console.error('[Cron] Audit job failed:', error);
    const endTime = new Date();
    await logJobExecution('audit-runner', startTime, endTime, 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

async function runRankingJob(): Promise<any> {

  const startTime = new Date();

  try {
    // Get keywords to track
    const result = await pool.query(`
      SELECT k.id, k.keyword, k.location, c.name as company_name
      FROM keywords k
      JOIN companies c ON k.company_id = c.id
      WHERE c.website IS NOT NULL
      ORDER BY k.last_checked ASC
      LIMIT 50
    `);

    const keywords = result.rows;

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    await logJobExecution('ranking-tracker', startTime, endTime, 'success', {
      keywordsFound: keywords.length,
      note: 'Triggered via Vercel cron',
    });

    return {
      success: true,
      keywordsProcessed: keywords.length,
      duration,
    };
  } catch (error) {
    console.error('[Cron] Ranking job failed:', error);
    const endTime = new Date();
    await logJobExecution('ranking-tracker', startTime, endTime, 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

async function runReportJob(): Promise<any> {

  const startTime = new Date();

  try {
    // Get companies for reports
    const result = await pool.query(`
      SELECT id, name, email
      FROM companies
      WHERE website IS NOT NULL
        AND COALESCE((metadata->>'weekly_reports')::boolean, true) = true
      LIMIT 25
    `);

    const companies = result.rows;

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    await logJobExecution('report-generator', startTime, endTime, 'success', {
      companiesFound: companies.length,
      note: 'Triggered via Vercel cron',
    });

    return {
      success: true,
      reportsGenerated: companies.length,
      duration,
    };
  } catch (error) {
    console.error('[Cron] Report job failed:', error);
    const endTime = new Date();
    await logJobExecution('report-generator', startTime, endTime, 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

async function logJobExecution(
  jobName: string,
  startTime: Date,
  endTime: Date,
  status: string,
  details: any
): Promise<void> {
  const query = `
    INSERT INTO job_executions (
      job_name,
      start_time,
      end_time,
      duration_ms,
      status,
      details
    ) VALUES ($1, $2, $3, $4, $5, $6)
  `;

  const duration = endTime.getTime() - startTime.getTime();

  try {
    await pool.query(query, [
      jobName,
      startTime,
      endTime,
      duration,
      status,
      JSON.stringify(details),
    ]);
  } catch (error) {
    console.error('[Cron] Error logging job execution:', error);
  }
}

// POST endpoint for triggering cron jobs
export async function POST(request: NextRequest) {

  // Verify authorization
  if (!verifyCronSecret(request)) {
    console.error('[Cron] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { job } = body;

    let result: any;

    switch (job) {
      case 'audit':
        result = await runAuditJob();
        break;

      case 'ranking':
        result = await runRankingJob();
        break;

      case 'report':
        result = await runReportJob();
        break;

      case 'all':
      default:
        // Run all jobs sequentially
        const auditResult = await runAuditJob();
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s between jobs

        const rankingResult = await runRankingJob();
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const reportResult = await runReportJob();

        result = {
          audit: auditResult,
          ranking: rankingResult,
          report: reportResult,
        };
        break;
    }

    return NextResponse.json({
      success: true,
      message: `Job(s) executed successfully`,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error('[Cron] Job execution failed:', error);
    return NextResponse.json(
      {
        error: 'Job execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET endpoint for status check
export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get recent job executions
    const result = await pool.query(`
      SELECT job_name, start_time, end_time, duration_ms, status, details
      FROM job_executions
      ORDER BY start_time DESC
      LIMIT 10
    `);

    return NextResponse.json({
      success: true,
      recentExecutions: result.rows,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error fetching job status:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch job status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
