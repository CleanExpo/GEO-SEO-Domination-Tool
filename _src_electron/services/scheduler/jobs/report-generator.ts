import { Pool } from 'pg';

interface Company {
  id: number;
  name: string;
  website: string;
  email?: string;
}

interface ReportData {
  companyId: number;
  companyName: string;
  weekStart: Date;
  weekEnd: Date;
  auditsSummary: any;
  rankingsSummary: any;
  keyMetrics: any;
  recommendations: string[];
}

interface WeeklyMetrics {
  totalAudits: number;
  averageScore: number;
  rankingsTracked: number;
  averageRank: number;
  rankImprovements: number;
  rankDeclines: number;
  criticalIssues: number;
}

export class ReportGenerator {
  private pool: Pool;
  private isRunning = false;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'geo_seo_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }

  public async execute(): Promise<void> {
    if (this.isRunning) {

      return;
    }

    this.isRunning = true;
    const startTime = new Date();
    console.log(`[ReportGenerator] Starting weekly report generation at ${startTime.toISOString()}`);

    try {
      // Get date range for last week
      const { weekStart, weekEnd } = this.getLastWeekRange();
      console.log(
        `[ReportGenerator] Generating reports for week: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`
      );

      // Get companies to generate reports for
      const companies = await this.getCompaniesForReports();

      if (companies.length === 0) {

        return;
      }

      const reports: ReportData[] = [];

      // Generate report for each company
      for (const company of companies) {
        try {

          const report = await this.generateReport(company, weekStart, weekEnd);
          reports.push(report);

          // Save report to database
          await this.saveReport(report);

          // Optionally send email report
          if (company.email) {
            await this.sendEmailReport(company, report);
          }
        } catch (error) {
          console.error(`[ReportGenerator] Failed to generate report for ${company.name}:`, error);
        }
      }

      // Log summary
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();


      // Log to job execution table
      await this.logJobExecution('report-generator', startTime, endTime, 'success', {
        companiesProcessed: companies.length,
        reportsGenerated: reports.length,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
      });
    } catch (error) {
      const endTime = new Date();
      console.error('[ReportGenerator] Job execution failed:', error);
      await this.logJobExecution(
        'report-generator',
        startTime,
        endTime,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private getLastWeekRange(): { weekStart: Date; weekEnd: Date } {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - now.getDay()); // Last Sunday
    weekEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6); // Monday of last week
    weekStart.setHours(0, 0, 0, 0);

    return { weekStart, weekEnd };
  }

  private async getCompaniesForReports(): Promise<Company[]> {
    const query = `
      SELECT id, name, website, email
      FROM companies
      WHERE website IS NOT NULL
        AND website != ''
        AND COALESCE((metadata->>'weekly_reports')::boolean, true) = true
      ORDER BY name ASC
      LIMIT 50
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('[ReportGenerator] Error fetching companies:', error);
      return [];
    }
  }

  private async generateReport(
    company: Company,
    weekStart: Date,
    weekEnd: Date
  ): Promise<ReportData> {
    // Get audit data for the week
    const auditsSummary = await this.getAuditsSummary(company.id, weekStart, weekEnd);

    // Get ranking data for the week
    const rankingsSummary = await this.getRankingsSummary(company.id, weekStart, weekEnd);

    // Calculate key metrics
    const keyMetrics = this.calculateKeyMetrics(auditsSummary, rankingsSummary);

    // Generate recommendations
    const recommendations = this.generateRecommendations(keyMetrics, auditsSummary, rankingsSummary);

    return {
      companyId: company.id,
      companyName: company.name,
      weekStart,
      weekEnd,
      auditsSummary,
      rankingsSummary,
      keyMetrics,
      recommendations,
    };
  }

  private async getAuditsSummary(
    companyId: number,
    weekStart: Date,
    weekEnd: Date
  ): Promise<any> {
    const query = `
      SELECT
        COUNT(*) as total_audits,
        AVG((lighthouse_scores->>'performance')::int) as avg_performance,
        AVG((lighthouse_scores->>'accessibility')::int) as avg_accessibility,
        AVG((lighthouse_scores->>'seo')::int) as avg_seo,
        AVG((eeat_scores->>'experience')::int) as avg_experience,
        AVG((eeat_scores->>'expertise')::int) as avg_expertise,
        AVG((eeat_scores->>'authoritativeness')::int) as avg_authoritativeness,
        AVG((eeat_scores->>'trustworthiness')::int) as avg_trustworthiness,
        COUNT(CASE WHEN priority_level = 'critical' THEN 1 END) as critical_issues
      FROM audits
      WHERE company_id = $1
        AND audit_date BETWEEN $2 AND $3
    `;

    try {
      const result = await this.pool.query(query, [companyId, weekStart, weekEnd]);
      return result.rows[0] || {};
    } catch (error) {
      console.error('[ReportGenerator] Error fetching audits summary:', error);
      return {};
    }
  }

  private async getRankingsSummary(
    companyId: number,
    weekStart: Date,
    weekEnd: Date
  ): Promise<any> {
    const query = `
      SELECT
        COUNT(DISTINCT r.keyword_id) as keywords_tracked,
        AVG(r.rank) as avg_rank,
        COUNT(CASE WHEN r.rank_change < 0 THEN 1 END) as improvements,
        COUNT(CASE WHEN r.rank_change > 0 THEN 1 END) as declines,
        MIN(r.rank) as best_rank,
        MAX(r.rank) as worst_rank
      FROM rankings r
      JOIN keywords k ON r.keyword_id = k.id
      WHERE k.company_id = $1
        AND r.checked_at BETWEEN $2 AND $3
    `;

    try {
      const result = await this.pool.query(query, [companyId, weekStart, weekEnd]);
      return result.rows[0] || {};
    } catch (error) {
      console.error('[ReportGenerator] Error fetching rankings summary:', error);
      return {};
    }
  }

  private calculateKeyMetrics(auditsSummary: any, rankingsSummary: any): WeeklyMetrics {
    const avgAuditScore =
      (parseFloat(auditsSummary.avg_performance || 0) +
        parseFloat(auditsSummary.avg_accessibility || 0) +
        parseFloat(auditsSummary.avg_seo || 0)) /
      3;

    return {
      totalAudits: parseInt(auditsSummary.total_audits || 0),
      averageScore: Math.round(avgAuditScore * 10) / 10,
      rankingsTracked: parseInt(rankingsSummary.keywords_tracked || 0),
      averageRank: parseFloat(rankingsSummary.avg_rank || 0),
      rankImprovements: parseInt(rankingsSummary.improvements || 0),
      rankDeclines: parseInt(rankingsSummary.declines || 0),
      criticalIssues: parseInt(auditsSummary.critical_issues || 0),
    };
  }

  private generateRecommendations(
    metrics: WeeklyMetrics,
    auditsSummary: any,
    rankingsSummary: any
  ): string[] {
    const recommendations: string[] = [];

    // Audit-based recommendations
    if (metrics.averageScore < 75) {
      recommendations.push('Overall site performance needs improvement - focus on technical SEO');
    }

    if (parseFloat(auditsSummary.avg_performance || 0) < 80) {
      recommendations.push('Optimize page load speed and Core Web Vitals');
    }

    if (parseFloat(auditsSummary.avg_seo || 0) < 85) {
      recommendations.push('Address SEO issues identified in recent audits');
    }

    if (metrics.criticalIssues > 0) {
      recommendations.push(`Address ${metrics.criticalIssues} critical issues immediately`);
    }

    // Ranking-based recommendations
    if (metrics.rankDeclines > metrics.rankImprovements) {
      recommendations.push('Rankings are trending down - review content and backlink strategy');
    }

    if (metrics.averageRank > 20) {
      recommendations.push('Focus on improving rankings for high-priority keywords');
    }

    if (metrics.rankingsTracked === 0) {
      recommendations.push('No rankings tracked this week - verify keyword monitoring is active');
    }

    // E-E-A-T recommendations
    if (parseFloat(auditsSummary.avg_expertise || 0) < 75) {
      recommendations.push('Strengthen expertise signals with author credentials and bios');
    }

    if (parseFloat(auditsSummary.avg_trustworthiness || 0) < 75) {
      recommendations.push('Improve trust signals - add testimonials, reviews, and security badges');
    }

    // Default recommendation if everything is good
    if (recommendations.length === 0) {
      recommendations.push('Performance is strong - maintain current optimization efforts');
    }

    return recommendations;
  }

  private async saveReport(report: ReportData): Promise<void> {
    const query = `
      INSERT INTO reports (
        company_id,
        report_type,
        report_date,
        date_range_start,
        date_range_end,
        metrics,
        recommendations,
        data
      ) VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7)
    `;

    try {
      await this.pool.query(query, [
        report.companyId,
        'weekly',
        report.weekStart,
        report.weekEnd,
        JSON.stringify(report.keyMetrics),
        JSON.stringify(report.recommendations),
        JSON.stringify({
          auditsSummary: report.auditsSummary,
          rankingsSummary: report.rankingsSummary,
        }),
      ]);

    } catch (error) {
      console.error(`[ReportGenerator] Error saving report for ${report.companyName}:`, error);
      throw error;
    }
  }

  private async sendEmailReport(company: Company, report: ReportData): Promise<void> {
    // This would integrate with an email service (SendGrid, AWS SES, etc.)

    // Simulate email sending
    const emailContent = this.formatEmailReport(report);

    // In production, this would call an email service

    console.log(`Subject: Weekly SEO Report - ${report.weekStart.toLocaleDateString()}`);

  }

  private formatEmailReport(report: ReportData): string {
    const { keyMetrics, recommendations } = report;

    return `
      Weekly SEO Report for ${report.companyName}
      Week: ${report.weekStart.toLocaleDateString()} - ${report.weekEnd.toLocaleDateString()}

      KEY METRICS:
      - Audits Performed: ${keyMetrics.totalAudits}
      - Average Score: ${keyMetrics.averageScore}/100
      - Rankings Tracked: ${keyMetrics.rankingsTracked}
      - Average Rank: #${Math.round(keyMetrics.averageRank)}
      - Rank Improvements: ${keyMetrics.rankImprovements}
      - Rank Declines: ${keyMetrics.rankDeclines}
      - Critical Issues: ${keyMetrics.criticalIssues}

      RECOMMENDATIONS:
      ${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

      View detailed report: [Dashboard Link]
    `;
  }

  private async logJobExecution(
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
      await this.pool.query(query, [
        jobName,
        startTime,
        endTime,
        duration,
        status,
        JSON.stringify(details),
      ]);
    } catch (error) {
      console.error('[ReportGenerator] Error logging job execution:', error);
    }
  }

  public async cleanup(): Promise<void> {
    await this.pool.end();
  }
}
