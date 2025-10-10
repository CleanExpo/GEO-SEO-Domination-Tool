/**
 * Master Orchestrator - Autonomous Value Generation System
 *
 * Coordinates all AI engines to deliver 10x value vs traditional agencies.
 * Triggered automatically on client onboarding.
 *
 * Architecture:
 * - CRITICAL TIER: Deploy immediately (Competitive Intel, SEO Fix, Content, Local)
 * - SUB-CRITICAL: Deploy Week 2 (Social, Backlinks, SERP)
 * - MUST-HAVE: Deploy Month 2 (AI Search, Influence, Predictive)
 */

import { EventEmitter } from 'events';
import { getDatabase } from '@/lib/db';
import type { OnboardingRequest } from '../onboarding/onboarding-orchestrator';

const db = getDatabase();

export interface EngineStatus {
  engineName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  valueDelivered?: number; // Dollar value of automation
}

export interface OrchestratorProgress {
  companyId: string;
  tier: 'critical' | 'sub-critical' | 'must-have';
  engines: EngineStatus[];
  totalValueDelivered: number;
  startedAt: Date;
  completedAt?: Date;
}

export class MasterOrchestrator extends EventEmitter {
  private activeOrchestrations: Map<string, OrchestratorProgress> = new Map();

  /**
   * Main entry point - Called when client completes onboarding
   */
  async onClientOnboarding(onboardingData: OnboardingRequest): Promise<string> {
    const companyId = await this.createCompanyRecord(onboardingData);

    // Start CRITICAL TIER immediately
    const criticalProgress: OrchestratorProgress = {
      companyId,
      tier: 'critical',
      engines: [
        { engineName: 'Competitive Intelligence', status: 'pending' },
        { engineName: 'Auto-SEO Fix', status: 'pending' },
        { engineName: 'AI Content Factory', status: 'pending' },
        { engineName: 'Local Domination', status: 'pending' }
      ],
      totalValueDelivered: 0,
      startedAt: new Date()
    };

    this.activeOrchestrations.set(companyId, criticalProgress);
    this.emit('orchestration:started', { companyId, tier: 'critical' });

    // Execute Critical Tier in parallel
    await this.executeCriticalTier(companyId, onboardingData);

    // Schedule Sub-Critical Tier (Week 2)
    this.scheduleSubCriticalTier(companyId, onboardingData);

    // Schedule Must-Have Tier (Month 2)
    this.scheduleMustHaveTier(companyId, onboardingData);

    return companyId;
  }

  /**
   * CRITICAL TIER - Deploy within 24 hours
   */
  private async executeCriticalTier(companyId: string, data: OnboardingRequest) {
    const progress = this.activeOrchestrations.get(companyId)!;

    try {
      // 1. Competitive Intelligence Engine
      await this.runEngine(progress, 'Competitive Intelligence', async () => {
        const { CompetitiveIntelligenceEngine } = await import('./competitive-intelligence-engine');
        const engine = new CompetitiveIntelligenceEngine();
        return await engine.runInitialCompetitorScan(companyId, data.competitors);
      });

      // 2. Auto-SEO Fix Engine
      await this.runEngine(progress, 'Auto-SEO Fix', async () => {
        const { AutoSEOFixEngine } = await import('./auto-seo-fix-engine');
        const engine = new AutoSEOFixEngine();
        return await engine.runInitialAudit(companyId, data.website || '');
      });

      // 3. AI Content Factory
      await this.runEngine(progress, 'AI Content Factory', async () => {
        const { AIContentFactory } = await import('./ai-content-factory');
        const engine = new AIContentFactory();
        return await engine.generateInitialContent(companyId, data.targetKeywords, data.contentTypes);
      });

      // 4. Local Domination Engine
      await this.runEngine(progress, 'Local Domination', async () => {
        const { LocalDominationEngine } = await import('./local-domination-engine');
        const engine = new LocalDominationEngine();
        return await engine.optimizeLocalPresence(companyId, data.targetLocations);
      });

      progress.completedAt = new Date();
      this.emit('orchestration:completed', { companyId, tier: 'critical', progress });

      // Save progress to database
      await this.saveProgress(companyId, progress);

    } catch (error: any) {
      console.error(`[MasterOrchestrator] Critical tier failed for ${companyId}:`, error);
      this.emit('orchestration:failed', { companyId, tier: 'critical', error: error.message });
      throw error;
    }
  }

  /**
   * SUB-CRITICAL TIER - Deploy Week 2
   */
  private scheduleSubCriticalTier(companyId: string, data: OnboardingRequest) {
    const WEEK_2_DELAY = 7 * 24 * 60 * 60 * 1000; // 7 days

    setTimeout(async () => {
      const progress: OrchestratorProgress = {
        companyId,
        tier: 'sub-critical',
        engines: [
          { engineName: 'Social Media Autopilot', status: 'pending' },
          { engineName: 'Backlink Acquisition', status: 'pending' },
          { engineName: 'SERP Monitoring', status: 'pending' }
        ],
        totalValueDelivered: 0,
        startedAt: new Date()
      };

      this.activeOrchestrations.set(`${companyId}_subcritical`, progress);

      // 5. Social Media Autopilot
      await this.runEngine(progress, 'Social Media Autopilot', async () => {
        const { SocialMediaAutopilot } = await import('./social-media-autopilot');
        const engine = new SocialMediaAutopilot();
        return await engine.startAutopilot(companyId);
      });

      // 6. Backlink Acquisition Bot
      await this.runEngine(progress, 'Backlink Acquisition', async () => {
        const { BacklinkAcquisitionBot } = await import('./backlink-acquisition-bot');
        const engine = new BacklinkAcquisitionBot();
        return await engine.startProspecting(companyId);
      });

      // 7. SERP Monitoring Engine
      await this.runEngine(progress, 'SERP Monitoring', async () => {
        const { SERPMonitoringEngine } = await import('./serp-monitoring-engine');
        const engine = new SERPMonitoringEngine();
        return await engine.startMonitoring(companyId);
      });

      await this.saveProgress(companyId, progress);
    }, WEEK_2_DELAY);
  }

  /**
   * MUST-HAVE TIER - Deploy Month 2
   */
  private scheduleMustHaveTier(companyId: string, data: OnboardingRequest) {
    const MONTH_2_DELAY = 30 * 24 * 60 * 60 * 1000; // 30 days

    setTimeout(async () => {
      const progress: OrchestratorProgress = {
        companyId,
        tier: 'must-have',
        engines: [
          { engineName: 'AI Search Optimization', status: 'pending' },
          { engineName: 'Influence Strategy', status: 'pending' },
          { engineName: 'Predictive Ranking', status: 'pending' }
        ],
        totalValueDelivered: 0,
        startedAt: new Date()
      };

      this.activeOrchestrations.set(`${companyId}_musthave`, progress);

      // 8. AI Search Optimization Hub
      await this.runEngine(progress, 'AI Search Optimization', async () => {
        const { AISearchOptimizationHub } = await import('./ai-search-optimization-hub');
        const engine = new AISearchOptimizationHub();
        return await engine.startOptimization(companyId);
      });

      // 9. Influence Strategy Engine
      await this.runEngine(progress, 'Influence Strategy', async () => {
        const { InfluenceStrategyEngine } = await import('./influence-strategy-engine');
        const engine = new InfluenceStrategyEngine();
        return await engine.startCampaign(companyId);
      });

      // 10. Predictive Ranking Engine
      await this.runEngine(progress, 'Predictive Ranking', async () => {
        const { PredictiveRankingEngine } = await import('./predictive-ranking-engine');
        const engine = new PredictiveRankingEngine();
        return await engine.trainModel(companyId);
      });

      await this.saveProgress(companyId, progress);
    }, MONTH_2_DELAY);
  }

  /**
   * Helper: Run individual engine with progress tracking
   */
  private async runEngine(
    progress: OrchestratorProgress,
    engineName: string,
    executor: () => Promise<any>
  ): Promise<void> {
    const engine = progress.engines.find(e => e.engineName === engineName);
    if (!engine) return;

    try {
      engine.status = 'running';
      engine.startedAt = new Date();
      this.emit('engine:started', { companyId: progress.companyId, engineName });

      const result = await executor();

      engine.status = 'completed';
      engine.completedAt = new Date();
      engine.result = result;
      engine.valueDelivered = this.calculateValueDelivered(engineName, result);
      progress.totalValueDelivered += engine.valueDelivered || 0;

      this.emit('engine:completed', { companyId: progress.companyId, engineName, result });

    } catch (error: any) {
      engine.status = 'failed';
      engine.completedAt = new Date();
      engine.error = error.message;

      this.emit('engine:failed', { companyId: progress.companyId, engineName, error: error.message });

      // Don't throw - allow other engines to continue
      console.error(`[MasterOrchestrator] Engine ${engineName} failed:`, error);
    }
  }

  /**
   * Calculate dollar value delivered by each engine
   * Based on equivalent agency hourly rates
   */
  private calculateValueDelivered(engineName: string, result: any): number {
    const VALUE_MAP: Record<string, number> = {
      'Competitive Intelligence': 5000,    // $5k/month for daily competitor monitoring
      'Auto-SEO Fix': 3000,               // $3k/month for daily audits + fixes
      'AI Content Factory': 12000,        // $12k/month for 30-50 blog posts
      'Local Domination': 4000,           // $4k/month for GBP optimization + citations
      'Social Media Autopilot': 3000,     // $3k/month for 30 posts/week
      'Backlink Acquisition': 6000,       // $6k/month for backlink outreach
      'SERP Monitoring': 2000,            // $2k/month for real-time tracking
      'AI Search Optimization': 4000,     // $4k/month for AI search prep
      'Influence Strategy': 5000,         // $5k/month for thought leadership
      'Predictive Ranking': 8000          // $8k/month for ML predictions
    };

    return VALUE_MAP[engineName] || 0;
  }

  /**
   * Create company record from onboarding data
   */
  private async createCompanyRecord(data: OnboardingRequest): Promise<string> {
    const companyId = `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const isPostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL;

    await db.query(`
      INSERT INTO company_portfolios (
        id, company_name, industry, website_url, email, phone,
        target_keywords, target_locations, content_preferences,
        autopilot_enabled, automation_level, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${isPostgres ? 'NOW()' : 'datetime(\'now\')'}, ${isPostgres ? 'NOW()' : 'datetime(\'now\')'})`, [
      companyId,
      data.businessName,
      data.industry || null,
      data.website || null,
      data.email,
      data.phone || null,
      isPostgres ? data.targetKeywords : JSON.stringify(data.targetKeywords),
      isPostgres ? data.targetLocations : JSON.stringify(data.targetLocations),
      isPostgres ? {
        contentTypes: data.contentTypes,
        contentFrequency: data.contentFrequency,
        brandVoice: data.brandVoice || ''
      } : JSON.stringify({
        contentTypes: data.contentTypes,
        contentFrequency: data.contentFrequency,
        brandVoice: data.brandVoice || ''
      }),
      true,  // autopilot_enabled
      'empire'  // automation_level
    ]);

    return companyId;
  }

  /**
   * Save orchestration progress to database
   */
  private async saveProgress(companyId: string, progress: OrchestratorProgress) {
    const isPostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL;

    await db.query(`
      INSERT INTO orchestrator_progress (
        company_id, tier, engines_status, total_value_delivered,
        started_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?)`, [
      companyId,
      progress.tier,
      JSON.stringify(progress.engines),
      progress.totalValueDelivered,
      progress.startedAt.toISOString(),
      progress.completedAt?.toISOString() || null
    ]);
  }

  /**
   * Get orchestration status for a company
   */
  async getOrchestratorStatus(companyId: string): Promise<OrchestratorProgress[]> {
    const results = await db.all(`
      SELECT * FROM orchestrator_progress
      WHERE company_id = ?
      ORDER BY started_at DESC`, [companyId]
    );

    return results.map((row: any) => ({
      companyId: row.company_id,
      tier: row.tier,
      engines: JSON.parse(row.engines_status),
      totalValueDelivered: row.total_value_delivered,
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined
    }));
  }
}

export const masterOrchestrator = new MasterOrchestrator();
