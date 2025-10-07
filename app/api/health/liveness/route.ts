import { NextResponse } from 'next/server'

/**
 * GET /api/health/liveness - Simple liveness probe
 * Returns 200 if the application is running
 * Used by Kubernetes/container orchestration for liveness checks
 */
export async function GET() {
  return NextResponse.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  })
}
