/**
 * Auto-Fix Agent API
 *
 * GET /api/guardian/auto-fix - Get available fixes
 * POST /api/guardian/auto-fix - Apply fixes
 * POST /api/guardian/auto-fix/rollback - Rollback a fix
 */

import { NextRequest, NextResponse } from 'next/server';
import { mcpHealthMonitor } from '@/services/guardian/mcp-health-monitor';
import { autoFixAgent } from '@/services/guardian/auto-fix-agent';

export async function GET() {
  try {
    // Get latest health status
    const healthReport = await mcpHealthMonitor.performHealthCheck();

    // Analyze issues and suggest fixes
    const fixes = await autoFixAgent.analyzeIssues(healthReport.servers);

    return NextResponse.json({
      totalIssues: healthReport.servers.filter((s) => s.status !== 'healthy').length,
      availableFixes: fixes.length,
      automatedFixes: fixes.filter((f) => f.automated && !f.requiresApproval).length,
      manualFixes: fixes.filter((f) => !f.automated || f.requiresApproval).length,
      fixes,
    });
  } catch (error) {
    console.error('[Auto-Fix API] Failed to analyze issues:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, fixId, autoApprove = false } = body;

    // Rollback action
    if (action === 'rollback') {
      if (!fixId) {
        return NextResponse.json({ error: 'fixId required for rollback' }, { status: 400 });
      }

      const success = await autoFixAgent.rollback(fixId);
      return NextResponse.json({
        success,
        message: success ? 'Fix rolled back successfully' : 'Rollback failed',
      });
    }

    // Apply fixes action
    if (action === 'apply') {
      // Get latest health status
      const healthReport = await mcpHealthMonitor.performHealthCheck();

      // Analyze issues
      const fixes = await autoFixAgent.analyzeIssues(healthReport.servers);

      // Filter to automated fixes if not auto-approving
      const fixesToApply = autoApprove
        ? fixes
        : fixes.filter((f) => f.automated && !f.requiresApproval);

      if (fixesToApply.length === 0) {
        return NextResponse.json({
          message: 'No automated fixes available',
          totalIssues: fixes.length,
        });
      }

      // Apply fixes
      const report = await autoFixAgent.applyFixes(fixesToApply, autoApprove);

      return NextResponse.json(report);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Auto-Fix API] Failed to apply fixes:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
