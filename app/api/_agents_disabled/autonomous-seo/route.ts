/**
 * Autonomous SEO Agent API Routes
 *
 * Manages the autonomous SEO monitoring agent:
 * - Start/stop autonomous mode
 * - Add/remove companies from monitoring
 * - Get agent status and schedules
 * - Configure alert rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { autonomousSEOAgent } from '@/services/agents/autonomous-seo-agent';
import { getDatabase } from '@/lib/db';

const db = getDatabase();

/**
 * GET /api/agents/autonomous-seo
 * Get agent status and monitoring schedules
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        return getAgentStatus();

      case 'schedules':
        return getSchedules();

      case 'alerts':
        return getAlerts();

      case 'recent-audits':
        const limit = parseInt(searchParams.get('limit') || '10');
        return getRecentAudits(limit);

      default:
        return Response.json({
          error: 'Invalid action. Use: status, schedules, alerts, or recent-audits'
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in GET /api/agents/autonomous-seo:', error);
    return Response.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/agents/autonomous-seo
 * Control agent and manage schedules
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'start':
        return startAgent();

      case 'stop':
        return stopAgent();

      case 'add-schedule':
        return addSchedule(body);

      case 'create-alert-rule':
        return createAlertRule(body);

      default:
        return Response.json({
          error: 'Invalid action. Use: start, stop, add-schedule, or create-alert-rule'
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in POST /api/agents/autonomous-seo:', error);
    return Response.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}

/**
 * DELETE /api/agents/autonomous-seo
 * Remove schedule or delete alert rule
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'ID is required' }, { status: 400 });
    }

    switch (type) {
      case 'schedule':
        return removeSchedule(id);

      case 'alert-rule':
        return deleteAlertRule(id);

      default:
        return Response.json({
          error: 'Invalid type. Use: schedule or alert-rule'
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in DELETE /api/agents/autonomous-seo:', error);
    return Response.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}

// ============================================================
// Action Handlers
// ============================================================

/**
 * Get agent operational status
 */
async function getAgentStatus() {
  const statusRow = await db.get(`
    SELECT * FROM agent_status WHERE agent_name = 'autonomous-seo'
  `) as any;

  const schedules = await db.all(`
    SELECT COUNT(*) as total,
           SUM(active) as active
    FROM seo_audit_schedules
  `) as any[];

  const recentAudits = await db.all(`
    SELECT COUNT(*) as count
    FROM seo_audits
    WHERE created_at >= datetime('now', '-24 hours')
  `) as any[];

  return Response.json({
    success: true,
    status: {
      agent_status: statusRow?.status || 'stopped',
      companies_monitored: statusRow?.companies_monitored || 0,
      active_cron_jobs: statusRow?.active_cron_jobs || 0,
      last_health_check: statusRow?.last_health_check,
      total_audits_run: statusRow?.total_audits_run || 0,
      total_reports_generated: statusRow?.total_reports_generated || 0,
      audits_last_24h: recentAudits[0]?.count || 0,
      started_at: statusRow?.started_at
    },
    schedules: {
      total: schedules[0]?.total || 0,
      active: schedules[0]?.active || 0
    }
  });
}

/**
 * Get all monitoring schedules
 */
async function getSchedules() {
  const schedules = await db.all(`
    SELECT * FROM v_monitoring_summary
  `) as any[];

  return Response.json({
    success: true,
    schedules: schedules.map(s => ({
      company_id: s.company_id,
      company_name: s.company_name,
      website: s.website,
      frequency: s.frequency,
      next_run: s.next_run,
      last_run: s.last_run,
      active: s.active === 1,
      last_score: s.last_score,
      last_audit_date: s.last_audit_date,
      audits_this_week: s.audits_this_week
    }))
  });
}

/**
 * Get unresolved alerts
 */
async function getAlerts() {
  const alerts = await db.all(`
    SELECT * FROM v_unresolved_alerts
    LIMIT 50
  `) as any[];

  return Response.json({
    success: true,
    alerts: alerts.map(a => ({
      id: a.id,
      company_id: a.company_id,
      company_name: a.company_name,
      severity: a.severity,
      message: a.message,
      rule_name: a.rule_name,
      created_at: a.created_at,
      acknowledged: a.acknowledged === 1
    }))
  });
}

/**
 * Get recent audit results
 */
async function getRecentAudits(limit: number) {
  const audits = await db.all(`
    SELECT * FROM v_recent_audits
    LIMIT ?
  `, [limit]) as any[];

  return Response.json({
    success: true,
    audits: audits.map(a => ({
      id: a.id,
      company_id: a.company_id,
      company_name: a.company_name,
      website: a.website,
      overall_score: a.overall_score,
      lighthouse_overall: a.lighthouse_overall,
      eeat_overall: a.eeat_overall,
      audit_type: a.audit_type,
      created_at: a.created_at
    }))
  });
}

/**
 * Start autonomous agent
 */
async function startAgent() {
  await autonomousSEOAgent.startAutonomousMode();

  await db.run(`
    UPDATE agent_status
    SET status = 'running',
        started_at = datetime('now'),
        updated_at = datetime('now')
    WHERE agent_name = 'autonomous-seo'
  `);

  return Response.json({
    success: true,
    message: 'Autonomous SEO Agent started successfully'
  });
}

/**
 * Stop autonomous agent
 */
async function stopAgent() {
  autonomousSEOAgent.stopAutonomousMode();

  await db.run(`
    UPDATE agent_status
    SET status = 'stopped',
        stopped_at = datetime('now'),
        updated_at = datetime('now')
    WHERE agent_name = 'autonomous-seo'
  `);

  return Response.json({
    success: true,
    message: 'Autonomous SEO Agent stopped successfully'
  });
}

/**
 * Add company to monitoring schedule
 */
async function addSchedule(body: any) {
  const { company_id, company_name, website, frequency } = body;

  if (!company_id || !company_name || !website) {
    return Response.json({
      error: 'company_id, company_name, and website are required'
    }, { status: 400 });
  }

  const validFrequencies = ['daily', 'weekly', 'monthly'];
  const freq = frequency || 'daily';

  if (!validFrequencies.includes(freq)) {
    return Response.json({
      error: 'frequency must be daily, weekly, or monthly'
    }, { status: 400 });
  }

  // Add to agent's internal schedule
  await autonomousSEOAgent.addToSchedule(
    company_id,
    company_name,
    website,
    freq as 'daily' | 'weekly' | 'monthly'
  );

  // Update agent status
  await db.run(`
    UPDATE agent_status
    SET companies_monitored = (SELECT COUNT(*) FROM seo_audit_schedules WHERE active = 1),
        updated_at = datetime('now')
    WHERE agent_name = 'autonomous-seo'
  `);

  return Response.json({
    success: true,
    message: `Added ${company_name} to monitoring schedule (${freq})`
  }, { status: 201 });
}

/**
 * Remove company from monitoring
 */
async function removeSchedule(companyId: string) {
  await autonomousSEOAgent.removeFromSchedule(companyId);

  // Update agent status
  await db.run(`
    UPDATE agent_status
    SET companies_monitored = (SELECT COUNT(*) FROM seo_audit_schedules WHERE active = 1),
        updated_at = datetime('now')
    WHERE agent_name = 'autonomous-seo'
  `);

  return Response.json({
    success: true,
    message: `Removed company ${companyId} from monitoring`
  });
}

/**
 * Create alert rule
 */
async function createAlertRule(body: any) {
  const { company_id, rule_name, rule_type, threshold_config, notify_email } = body;

  if (!company_id || !rule_name || !rule_type || !threshold_config) {
    return Response.json({
      error: 'company_id, rule_name, rule_type, and threshold_config are required'
    }, { status: 400 });
  }

  const validRuleTypes = ['score_drop', 'ranking_drop', 'critical_issue', 'performance_degradation'];
  if (!validRuleTypes.includes(rule_type)) {
    return Response.json({
      error: 'Invalid rule_type. Must be: score_drop, ranking_drop, critical_issue, or performance_degradation'
    }, { status: 400 });
  }

  const ruleId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.run(`
    INSERT INTO seo_alert_rules (
      id, company_id, rule_name, rule_type, threshold_config, notify_email, enabled
    ) VALUES (?, ?, ?, ?, ?, ?, 1)
  `, [
    ruleId,
    company_id,
    rule_name,
    rule_type,
    JSON.stringify(threshold_config),
    notify_email || null
  ]);

  return Response.json({
    success: true,
    message: 'Alert rule created successfully',
    rule_id: ruleId
  }, { status: 201 });
}

/**
 * Delete alert rule
 */
async function deleteAlertRule(ruleId: string) {
  await db.run(`
    DELETE FROM seo_alert_rules WHERE id = ?
  `, [ruleId]);

  return Response.json({
    success: true,
    message: `Alert rule ${ruleId} deleted successfully`
  });
}
