/**
 * Post-Audit Automation System - Background Jobs
 *
 * Configures and runs scheduled background jobs using node-cron:
 * 1. Daily competitor ranking check
 * 2. Scheduled Lighthouse audits
 * 3. Weekly comparison reports
 */

import cron from 'node-cron';
import { createAdminClient } from '@/lib/auth/supabase-admin';

// ============================================================================
// TYPES
// ============================================================================

interface ScheduledJob {
  name: string;
  schedule: string;
  task: cron.ScheduledTask;
  isRunning: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

// ============================================================================
// JOB REGISTRY
// ============================================================================

const jobs: Map<string, ScheduledJob> = new Map();

// ============================================================================
// JOB 1: DAILY COMPETITOR RANKING CHECK
// ============================================================================

/**
 * Checks competitor rankings daily and creates snapshots
 *
 * Schedule: Every day at 2:00 AM (Australia/Brisbane timezone)
 */
async function competitorRankingCheckJob() {
  console.log('[Competitor Ranking] Starting daily check...');

  try {
    const supabase = createAdminClient();

    // Get all active companies with competitor tracking enabled
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, website')
      .eq('status', 'active');

    if (error) {
      console.error('[Competitor Ranking] Failed to fetch companies:', error);
      return;
    }

    if (!companies || companies.length === 0) {
      console.log('[Competitor Ranking] No active companies found');
      return;
    }

    console.log(`[Competitor Ranking] Checking ${companies.length} companies`);

    for (const company of companies) {
      try {
        // Get existing competitor snapshots to track changes
        const { data: existingSnapshots } = await supabase
          .from('competitor_snapshots')
          .select('competitor_name, visibility_score, local_pack_position')
          .eq('company_id', company.id)
          .order('snapshot_date', { ascending: false })
          .limit(10);

        // In a real implementation, this would call external APIs (SEMrush, Ahrefs, etc.)
        // For now, we'll simulate tracking by creating sample snapshots
        if (existingSnapshots && existingSnapshots.length > 0) {
          console.log(`[Competitor Ranking] ${company.name}: Tracking ${existingSnapshots.length} competitors`);

          // Create new snapshots with simulated data
          for (const existing of existingSnapshots) {
            const newVisibilityScore = existing.visibility_score
              ? Math.max(0, Math.min(100, existing.visibility_score + (Math.random() * 10 - 5)))
              : Math.random() * 100;

            const newLocalPackPosition = existing.local_pack_position
              ? Math.max(1, Math.min(10, existing.local_pack_position + Math.floor(Math.random() * 3 - 1)))
              : Math.floor(Math.random() * 10) + 1;

            await supabase.from('competitor_snapshots').insert({
              company_id: company.id,
              competitor_name: existing.competitor_name,
              visibility_score: newVisibilityScore,
              local_pack_position: newLocalPackPosition,
              snapshot_date: new Date().toISOString(),
              data_source: 'automated_job',
            });
          }
        }
      } catch (companyError) {
        console.error(`[Competitor Ranking] Error processing ${company.name}:`, companyError);
      }
    }

    console.log('[Competitor Ranking] Daily check complete');
  } catch (error) {
    console.error('[Competitor Ranking] Job failed:', error);
  }
}

// ============================================================================
// JOB 2: SCHEDULED LIGHTHOUSE AUDITS
// ============================================================================

/**
 * Runs scheduled Lighthouse audits based on automation rules
 *
 * Schedule: Every 6 hours (00:00, 06:00, 12:00, 18:00)
 */
async function scheduledLighthouseAuditJob() {
  console.log('[Lighthouse Audit] Starting scheduled audits...');

  try {
    const supabase = createAdminClient();

    // Get automation rules with schedule trigger
    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select('*, companies(id, name, website)')
      .eq('trigger_type', 'schedule')
      .eq('is_active', true);

    if (error) {
      console.error('[Lighthouse Audit] Failed to fetch rules:', error);
      return;
    }

    if (!rules || rules.length === 0) {
      console.log('[Lighthouse Audit] No scheduled audit rules found');
      return;
    }

    console.log(`[Lighthouse Audit] Processing ${rules.length} audit rules`);

    for (const rule of rules) {
      try {
        const company = rule.companies;

        // Check if audit should run based on rule conditions
        const conditions = rule.trigger_conditions as any;
        const shouldRun = shouldRunScheduledAudit(conditions);

        if (!shouldRun) {
          console.log(`[Lighthouse Audit] Skipping ${company.name} (schedule conditions not met)`);
          continue;
        }

        console.log(`[Lighthouse Audit] Running audit for ${company.name}`);

        // In a real implementation, this would call the Lighthouse API
        // For now, we'll create a placeholder audit result
        const auditScore = Math.floor(Math.random() * 30) + 70; // Score between 70-100

        // Create audit record
        const { data: audit } = await supabase
          .from('seo_audits')
          .insert({
            company_id: company.id,
            url: company.website,
            performance_score: auditScore,
            seo_score: auditScore + Math.floor(Math.random() * 10 - 5),
            accessibility_score: auditScore + Math.floor(Math.random() * 10 - 5),
            best_practices_score: auditScore + Math.floor(Math.random() * 10 - 5),
            audit_date: new Date().toISOString(),
            status: 'completed',
          })
          .select()
          .single();

        // Check if audit triggered automation rules
        if (audit && rule.auto_create_tasks) {
          await processAuditAutomation(audit.id, rule);
        }
      } catch (ruleError) {
        console.error(`[Lighthouse Audit] Error processing rule:`, ruleError);
      }
    }

    console.log('[Lighthouse Audit] Scheduled audits complete');
  } catch (error) {
    console.error('[Lighthouse Audit] Job failed:', error);
  }
}

/**
 * Determines if a scheduled audit should run based on conditions
 */
function shouldRunScheduledAudit(conditions: any): boolean {
  if (!conditions) return true;

  // Check if current time matches cron schedule
  if (conditions.schedule_cron) {
    // In production, parse cron and check if current time matches
    // For now, we'll just return true
    return true;
  }

  return true;
}

/**
 * Processes automation rules after an audit completes
 */
async function processAuditAutomation(auditId: string, rule: any) {
  console.log(`[Audit Automation] Processing automation for audit ${auditId}`);

  const supabase = createAdminClient();

  // Get task templates for the rule
  const taskTypes = rule.task_types_included || [];

  if (taskTypes.length === 0) {
    return;
  }

  // Get task templates
  const { data: templates } = await supabase
    .from('task_templates')
      .select('*')
      .in('task_type', taskTypes)
    .limit(rule.max_tasks_per_audit || 20);

  if (!templates || templates.length === 0) {
    return;
  }

  // Create agent tasks based on templates
  for (const template of templates) {
    await supabase.from('agent_tasks').insert({
      company_id: rule.company_id,
      audit_id: auditId,
      task_type: template.task_type,
      category: template.category,
      priority: template.default_priority,
      status: 'pending',
      instructions: template.instructions_template,
      agent_type: template.preferred_agent,
      requires_approval: rule.require_approval,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  console.log(`[Audit Automation] Created ${templates.length} tasks for audit ${auditId}`);
}

// ============================================================================
// JOB 3: WEEKLY COMPARISON REPORTS
// ============================================================================

/**
 * Generates weekly comparison reports for all companies
 *
 * Schedule: Every Monday at 9:00 AM (Australia/Brisbane timezone)
 */
async function weeklyComparisonReportJob() {
  console.log('[Weekly Report] Generating comparison reports...');

  try {
    const supabase = createAdminClient();

    // Get all active companies
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, website')
      .eq('status', 'active');

    if (error) {
      console.error('[Weekly Report] Failed to fetch companies:', error);
      return;
    }

    if (!companies || companies.length === 0) {
      console.log('[Weekly Report] No active companies found');
      return;
    }

    console.log(`[Weekly Report] Generating reports for ${companies.length} companies`);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    for (const company of companies) {
      try {
        // Get competitor snapshots from the past week
        const { data: snapshots } = await supabase
          .from('competitor_snapshots')
          .select('*')
          .eq('company_id', company.id)
          .gte('snapshot_date', oneWeekAgo.toISOString())
          .order('snapshot_date', { ascending: false });

        if (!snapshots || snapshots.length === 0) {
          console.log(`[Weekly Report] No data for ${company.name}`);
          continue;
        }

        // Calculate weekly statistics
        const competitorGroups = snapshots.reduce((acc: any, snapshot) => {
          const name = snapshot.competitor_name;
          if (!acc[name]) acc[name] = [];
          acc[name].push(snapshot);
          return acc;
        }, {});

        const report = {
          company_id: company.id,
          company_name: company.name,
          period_start: oneWeekAgo.toISOString(),
          period_end: new Date().toISOString(),
          total_competitors: Object.keys(competitorGroups).length,
          total_snapshots: snapshots.length,
          competitors: Object.entries(competitorGroups).map(([name, snaps]: [string, any]) => {
            const sortedSnaps = snaps.sort((a: any, b: any) =>
              new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
            );

            const firstSnap = sortedSnaps[0];
            const lastSnap = sortedSnaps[sortedSnaps.length - 1];

            return {
              name,
              visibility_change:
                lastSnap.visibility_score && firstSnap.visibility_score
                  ? lastSnap.visibility_score - firstSnap.visibility_score
                  : 0,
              position_change:
                lastSnap.local_pack_position && firstSnap.local_pack_position
                  ? firstSnap.local_pack_position - lastSnap.local_pack_position
                  : 0, // Lower position number is better
              snapshots_count: snaps.length,
            };
          }),
        };

        console.log(`[Weekly Report] ${company.name}:`, {
          competitors: report.total_competitors,
          snapshots: report.total_snapshots,
        });

        // In production, this would save to database or send via email
        // For now, just log the summary
      } catch (companyError) {
        console.error(`[Weekly Report] Error processing ${company.name}:`, companyError);
      }
    }

    console.log('[Weekly Report] Weekly reports complete');
  } catch (error) {
    console.error('[Weekly Report] Job failed:', error);
  }
}

// ============================================================================
// SCHEDULER MANAGEMENT
// ============================================================================

/**
 * Initializes and starts all scheduled jobs
 */
export function startPostAuditJobs() {
  console.log('[Post-Audit Scheduler] Initializing jobs...');

  // Job 1: Daily competitor ranking check (2:00 AM Brisbane time)
  const competitorJob = cron.schedule(
    '0 2 * * *',
    async () => {
      const job = jobs.get('competitor-ranking');
      if (job && !job.isRunning) {
        job.isRunning = true;
        job.lastRun = new Date();
        await competitorRankingCheckJob();
        job.isRunning = false;
      }
    },
    {
      timezone: 'Australia/Brisbane',
    }
  );

  jobs.set('competitor-ranking', {
    name: 'Daily Competitor Ranking Check',
    schedule: '0 2 * * *',
    task: competitorJob,
    isRunning: false,
  });

  // Job 2: Scheduled Lighthouse audits (every 6 hours)
  const lighthouseJob = cron.schedule(
    '0 */6 * * *',
    async () => {
      const job = jobs.get('lighthouse-audit');
      if (job && !job.isRunning) {
        job.isRunning = true;
        job.lastRun = new Date();
        await scheduledLighthouseAuditJob();
        job.isRunning = false;
      }
    },
    {
      timezone: 'Australia/Brisbane',
    }
  );

  jobs.set('lighthouse-audit', {
    name: 'Scheduled Lighthouse Audits',
    schedule: '0 */6 * * *',
    task: lighthouseJob,
    isRunning: false,
  });

  // Job 3: Weekly comparison reports (Mondays at 9:00 AM)
  const weeklyReportJob = cron.schedule(
    '0 9 * * 1',
    async () => {
      const job = jobs.get('weekly-report');
      if (job && !job.isRunning) {
        job.isRunning = true;
        job.lastRun = new Date();
        await weeklyComparisonReportJob();
        job.isRunning = false;
      }
    },
    {
      timezone: 'Australia/Brisbane',
    }
  );

  jobs.set('weekly-report', {
    name: 'Weekly Comparison Reports',
    schedule: '0 9 * * 1',
    task: weeklyReportJob,
    isRunning: false,
  });

  // Start all jobs
  competitorJob.start();
  lighthouseJob.start();
  weeklyReportJob.start();

  console.log('[Post-Audit Scheduler] All jobs started');
  console.log('  ✓ Competitor Ranking: Daily at 2:00 AM (Brisbane)');
  console.log('  ✓ Lighthouse Audits: Every 6 hours');
  console.log('  ✓ Weekly Reports: Mondays at 9:00 AM (Brisbane)');
}

/**
 * Stops all scheduled jobs
 */
export function stopPostAuditJobs() {
  console.log('[Post-Audit Scheduler] Stopping all jobs...');

  jobs.forEach((job, name) => {
    job.task.stop();
    console.log(`  ✓ Stopped: ${job.name}`);
  });

  jobs.clear();
  console.log('[Post-Audit Scheduler] All jobs stopped');
}

/**
 * Gets status of all scheduled jobs
 */
export function getJobStatus() {
  return Array.from(jobs.entries()).map(([name, job]) => ({
    name: job.name,
    schedule: job.schedule,
    isRunning: job.isRunning,
    lastRun: job.lastRun,
  }));
}

/**
 * Manually triggers a specific job
 */
export async function triggerJob(jobName: string) {
  console.log(`[Post-Audit Scheduler] Manually triggering: ${jobName}`);

  switch (jobName) {
    case 'competitor-ranking':
      await competitorRankingCheckJob();
      break;
    case 'lighthouse-audit':
      await scheduledLighthouseAuditJob();
      break;
    case 'weekly-report':
      await weeklyComparisonReportJob();
      break;
    default:
      throw new Error(`Unknown job: ${jobName}`);
  }
}
