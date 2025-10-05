/**
 * API Route: Detailed Health Check
 * GET /api/health/detailed - Comprehensive system health status
 * Phase 3: MONITOR-001
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    storage: HealthCheck;
    environment: HealthCheck;
    memory: HealthCheck;
  };
}

interface HealthCheck {
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  responseTime?: number;
  details?: Record<string, any>;
}

export async function GET() {
  const startTime = Date.now();

  const checks = {
    database: await checkDatabase(),
    storage: await checkStorage(),
    environment: checkEnvironment(),
    memory: checkMemory(),
  };

  // Determine overall status
  const hasFailures = Object.values(checks).some((check) => check.status === 'fail');
  const hasWarnings = Object.values(checks).some((check) => check.status === 'warn');

  const overallStatus = hasFailures ? 'unhealthy' : hasWarnings ? 'degraded' : 'healthy';

  const result: HealthCheckResult = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'unknown',
    uptime: process.uptime(),
    checks,
  };

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 207 : 503;

  return NextResponse.json(result, { status: statusCode });
}

// ============================================================
// HEALTH CHECK FUNCTIONS
// ============================================================

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Simple query to check connectivity
    const { error, count } = await supabase
      .from('organisations')
      .select('*', { count: 'exact', head: true });

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'fail',
        message: `Database query failed: ${error.message}`,
        responseTime,
      };
    }

    if (responseTime > 1000) {
      return {
        status: 'warn',
        message: 'Database response time is slow',
        responseTime,
      };
    }

    return {
      status: 'pass',
      message: 'Database connectivity OK',
      responseTime,
      details: { recordCount: count },
    };
  } catch (error: any) {
    return {
      status: 'fail',
      message: `Database check failed: ${error.message}`,
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Check storage connectivity
 */
async function checkStorage(): Promise<HealthCheck> {
  const startTime = Date.now();

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // List buckets to verify storage API
    const { data, error } = await supabase.storage.listBuckets();

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'fail',
        message: `Storage API failed: ${error.message}`,
        responseTime,
      };
    }

    return {
      status: 'pass',
      message: 'Storage API OK',
      responseTime,
      details: { bucketCount: data?.length || 0 },
    };
  } catch (error: any) {
    return {
      status: 'fail',
      message: `Storage check failed: ${error.message}`,
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Check environment configuration
 */
function checkEnvironment(): HealthCheck {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    return {
      status: 'fail',
      message: `Missing required environment variables: ${missing.join(', ')}`,
    };
  }

  const optionalEnvVars = [
    'NEXT_PUBLIC_SENTRY_DSN',
    'GITHUB_WEBHOOK_SECRET',
  ];

  const missingOptional = optionalEnvVars.filter((key) => !process.env[key]);

  if (missingOptional.length > 0) {
    return {
      status: 'warn',
      message: `Optional environment variables not configured: ${missingOptional.join(', ')}`,
      details: { missingOptional },
    };
  }

  return {
    status: 'pass',
    message: 'All environment variables configured',
  };
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheck {
  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const usagePercent = Math.round((usage.heapUsed / usage.heapTotal) * 100);

  if (usagePercent > 90) {
    return {
      status: 'fail',
      message: 'Memory usage critical',
      details: { heapUsedMB, heapTotalMB, usagePercent },
    };
  }

  if (usagePercent > 75) {
    return {
      status: 'warn',
      message: 'Memory usage high',
      details: { heapUsedMB, heapTotalMB, usagePercent },
    };
  }

  return {
    status: 'pass',
    message: 'Memory usage normal',
    details: { heapUsedMB, heapTotalMB, usagePercent },
  };
}
