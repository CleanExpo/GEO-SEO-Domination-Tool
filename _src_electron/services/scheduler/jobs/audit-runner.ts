import { Pool } from 'pg';

interface Company {
  id: number;
  name: string;
  website: string;
  scheduled_audits: boolean;
}

interface AuditResult {
  companyId: number;
  companyName: string;
  lighthouseScore: any;
  eeatScore: any;
  recommendations: string[];
  status: 'success' | 'failed';
  error?: string;
}

export class AuditRunner {
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
    console.log(`[AuditRunner] Starting scheduled audit run at ${startTime.toISOString()}`);

    try {
      // Get companies with scheduled audits enabled
      const companies = await this.getCompaniesForAudit();

      if (companies.length === 0) {

        return;
      }

      const results: AuditResult[] = [];

      // Process each company
      for (const company of companies) {
        try {
          console.log(`[AuditRunner] Auditing ${company.name} (ID: ${company.id})`);
          const result = await this.runAudit(company);
          results.push(result);

          // Save audit results
          await this.saveAuditResults(result);

          // Wait a bit between audits to avoid rate limiting
          await this.sleep(2000);
        } catch (error) {
          console.error(`[AuditRunner] Failed to audit ${company.name}:`, error);
          results.push({
            companyId: company.id,
            companyName: company.name,
            lighthouseScore: null,
            eeatScore: null,
            recommendations: [],
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Log summary
      const successful = results.filter((r) => r.status === 'success').length;
      const failed = results.filter((r) => r.status === 'failed').length;
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();


      // Log to job execution table
      await this.logJobExecution('audit-runner', startTime, endTime, 'success', {
        companiesProcessed: companies.length,
        successful,
        failed,
        results: results.map((r) => ({
          companyId: r.companyId,
          companyName: r.companyName,
          status: r.status,
        })),
      });
    } catch (error) {
      const endTime = new Date();
      console.error('[AuditRunner] Job execution failed:', error);
      await this.logJobExecution(
        'audit-runner',
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

  private async getCompaniesForAudit(): Promise<Company[]> {
    const query = `
      SELECT id, name, website,
             COALESCE((metadata->>'scheduled_audits')::boolean, false) as scheduled_audits
      FROM companies
      WHERE website IS NOT NULL
        AND website != ''
        AND (metadata->>'scheduled_audits')::boolean = true
      ORDER BY updated_at ASC
      LIMIT 50
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('[AuditRunner] Error fetching companies:', error);
      return [];
    }
  }

  private async runAudit(company: Company): Promise<AuditResult> {
    // Simulate running Lighthouse audit
    const lighthouseScore = await this.runLighthouseAudit(company.website);

    // Simulate E-E-A-T analysis
    const eeatScore = await this.analyzeEEAT(company);

    // Generate recommendations
    const recommendations = this.generateRecommendations(lighthouseScore, eeatScore);

    return {
      companyId: company.id,
      companyName: company.name,
      lighthouseScore,
      eeatScore,
      recommendations,
      status: 'success',
    };
  }

  private async runLighthouseAudit(website: string): Promise<any> {
    // This would call the actual Lighthouse API
    // For now, return mock data

    // Simulate API call delay
    await this.sleep(1000);

    return {
      performance: Math.floor(Math.random() * 30) + 70, // 70-100
      accessibility: Math.floor(Math.random() * 20) + 80, // 80-100
      bestPractices: Math.floor(Math.random() * 20) + 80, // 80-100
      seo: Math.floor(Math.random() * 20) + 80, // 80-100
      pwa: Math.floor(Math.random() * 50) + 50, // 50-100
    };
  }

  private async analyzeEEAT(company: Company): Promise<any> {
    // This would analyze E-E-A-T signals

    await this.sleep(500);

    return {
      experience: Math.floor(Math.random() * 30) + 70,
      expertise: Math.floor(Math.random() * 30) + 70,
      authoritativeness: Math.floor(Math.random() * 30) + 70,
      trustworthiness: Math.floor(Math.random() * 30) + 70,
    };
  }

  private generateRecommendations(
    lighthouseScore: any,
    eeatScore: any
  ): string[] {
    const recommendations: string[] = [];

    if (lighthouseScore.performance < 80) {
      recommendations.push('Optimize page load speed and performance');
    }
    if (lighthouseScore.accessibility < 85) {
      recommendations.push('Improve accessibility for better user experience');
    }
    if (lighthouseScore.seo < 90) {
      recommendations.push('Implement SEO best practices');
    }
    if (eeatScore.experience < 75) {
      recommendations.push('Add more experience-based content and case studies');
    }
    if (eeatScore.expertise < 75) {
      recommendations.push('Showcase team expertise and credentials');
    }
    if (eeatScore.authoritativeness < 75) {
      recommendations.push('Build authority through backlinks and citations');
    }
    if (eeatScore.trustworthiness < 75) {
      recommendations.push('Improve trust signals (reviews, testimonials, security)');
    }

    return recommendations;
  }

  private async saveAuditResults(result: AuditResult): Promise<void> {
    const query = `
      INSERT INTO audits (
        company_id,
        audit_date,
        lighthouse_scores,
        eeat_scores,
        recommendations,
        priority_level
      ) VALUES ($1, NOW(), $2, $3, $4, $5)
    `;

    const priorityLevel = this.calculatePriority(
      result.lighthouseScore,
      result.eeatScore
    );

    try {
      await this.pool.query(query, [
        result.companyId,
        JSON.stringify(result.lighthouseScore),
        JSON.stringify(result.eeatScore),
        JSON.stringify(result.recommendations),
        priorityLevel,
      ]);

    } catch (error) {
      console.error(
        `[AuditRunner] Error saving audit results for ${result.companyName}:`,
        error
      );
      throw error;
    }
  }

  private calculatePriority(lighthouseScore: any, eeatScore: any): string {
    const avgLighthouse =
      (lighthouseScore.performance +
        lighthouseScore.accessibility +
        lighthouseScore.bestPractices +
        lighthouseScore.seo) /
      4;

    const avgEEAT =
      (eeatScore.experience +
        eeatScore.expertise +
        eeatScore.authoritativeness +
        eeatScore.trustworthiness) /
      4;

    const overallScore = (avgLighthouse + avgEEAT) / 2;

    if (overallScore < 60) return 'critical';
    if (overallScore < 75) return 'high';
    if (overallScore < 85) return 'medium';
    return 'low';
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
      console.error('[AuditRunner] Error logging job execution:', error);
      // Don't throw - logging failure shouldn't fail the job
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async cleanup(): Promise<void> {
    await this.pool.end();
  }
}
