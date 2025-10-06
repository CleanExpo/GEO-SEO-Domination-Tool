/**
 * MCP Health Monitor API
 *
 * GET /api/guardian/mcp-health - Get latest health report
 * POST /api/guardian/mcp-health - Trigger manual health check
 */

import { NextResponse } from 'next/server';
import { mcpHealthMonitor } from '@/services/guardian/mcp-health-monitor';

export async function GET() {
  try {
    const latestStatus = await mcpHealthMonitor.getLatestStatus();

    if (!latestStatus) {
      // No status available, perform initial check
      const report = await mcpHealthMonitor.performHealthCheck();
      return NextResponse.json(report);
    }

    // Check if status is stale (>10 minutes old)
    const ageMinutes =
      (Date.now() - latestStatus.timestamp.getTime()) / (1000 * 60);

    if (ageMinutes > 10) {
      // Stale data, refresh
      const report = await mcpHealthMonitor.performHealthCheck();
      return NextResponse.json(report);
    }

    return NextResponse.json(latestStatus);
  } catch (error) {
    console.error('[MCP Health API] Failed to get health status:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const report = await mcpHealthMonitor.performHealthCheck();
    return NextResponse.json(report);
  } catch (error) {
    console.error('[MCP Health API] Failed to perform health check:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
