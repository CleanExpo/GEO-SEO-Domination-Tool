/**
 * AI Orchestrator Service
 *
 * Multi-model AI workflow orchestration for cost-effective project generation:
 * 1. DeepSeek V3.2-Exp: Primary model for bulk generation (50%+ cost savings)
 * 2. Claude Sonnet: Enhancement layer for refinement and quality checks
 * 3. GPT-4: Specialized tasks requiring advanced reasoning
 * 4. Perplexity: Real-time data and citation research
 *
 * Strategy:
 * - Use DeepSeek for initial generation (project structure, content outlines, keyword research)
 * - Use Claude for engineering/UI/UX enhancement and code generation
 * - Use GPT-4 for complex reasoning and strategic planning
 * - Use Perplexity for competitive research and market data
 */

import { DeepSeekService } from './deepseek';
import { ClaudeService } from './claude';
import { PerplexityService } from './perplexity';

export interface AIModel {
  provider: 'deepseek' | 'claude' | 'openai' | 'perplexity';
  cost: 'low' | 'medium' | 'high';
  strengths: string[];
}

export interface GenerationTask {
  type: 'project-structure' | 'content-outline' | 'keyword-research' | 'competitor-analysis' | 'technical-audit' | 'code-generation' | 'ui-enhancement';
  input: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high';
}

export interface GenerationResult {
  task: GenerationTask;
  primaryModel: string;
  enhancementModel?: string;
  result: string;
  cost: number;
  processingTime: number;
}

export class AIOrchestrator {
  private deepseek: DeepSeekService;
  private claude?: ClaudeService;
  private perplexity?: PerplexityService;

  // Cost estimates per 1K tokens (approximate)
  private costEstimates = {
    'deepseek/deepseek-v3.2-exp': 0.0001, // Ultra low cost
    'claude-sonnet-4': 0.003, // Medium cost
    'gpt-4': 0.03, // High cost
    'perplexity-sonar': 0.001, // Low cost
  };

  constructor(
    openrouterApiKey: string,
    claudeApiKey?: string,
    perplexityApiKey?: string
  ) {
    this.deepseek = new DeepSeekService(openrouterApiKey);
    if (claudeApiKey) this.claude = new ClaudeService(claudeApiKey);
    if (perplexityApiKey) this.perplexity = new PerplexityService(perplexityApiKey);
  }

  /**
   * Route task to optimal model based on type and cost requirements
   */
  private selectPrimaryModel(task: GenerationTask): AIModel {
    const modelMap: Record<string, AIModel> = {
      'project-structure': {
        provider: 'deepseek',
        cost: 'low',
        strengths: ['bulk generation', 'structured output', 'long context'],
      },
      'content-outline': {
        provider: 'deepseek',
        cost: 'low',
        strengths: ['content planning', 'scalability', 'SEO optimization'],
      },
      'keyword-research': {
        provider: 'deepseek',
        cost: 'low',
        strengths: ['topic clustering', 'keyword mapping', 'search intent'],
      },
      'competitor-analysis': {
        provider: 'perplexity',
        cost: 'low',
        strengths: ['real-time data', 'citations', 'market research'],
      },
      'technical-audit': {
        provider: 'deepseek',
        cost: 'low',
        strengths: ['technical analysis', 'checklist generation', 'comprehensive audits'],
      },
      'code-generation': {
        provider: 'claude',
        cost: 'medium',
        strengths: ['code quality', 'engineering best practices', 'refactoring'],
      },
      'ui-enhancement': {
        provider: 'claude',
        cost: 'medium',
        strengths: ['UI/UX design', 'accessibility', 'component architecture'],
      },
    };

    return modelMap[task.type] || modelMap['project-structure'];
  }

  /**
   * Generate project structure using DeepSeek (primary)
   * Optionally enhance with Claude for engineering refinement
   */
  async generateProject(
    domain: string,
    industry: string,
    location: string,
    goals: string[],
    options: { enhance?: boolean } = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    // Primary generation with DeepSeek (cost-effective)
    const primaryResult = await this.deepseek.generateProjectStructure(
      domain,
      industry,
      location,
      goals
    );

    let finalResult = primaryResult;
    let enhancementModel: string | undefined;

    // Optional: Enhance with Claude for engineering refinement
    if (options.enhance && this.claude) {
      enhancementModel = 'claude-sonnet-4';
      const enhancementPrompt = `Enhance this SEO project structure with engineering best practices, technical implementation details, and code architecture recommendations:

${primaryResult}

Add:
1. Technical architecture diagram (Mermaid syntax)
2. Database schema recommendations
3. API integration checklist
4. CI/CD pipeline setup
5. Performance monitoring strategy
6. Security considerations
7. Scalability recommendations
8. Testing strategy

Maintain the original structure and add technical depth.`;

      finalResult = await this.claude.query(
        enhancementPrompt,
        'You are a senior software architect specializing in SEO SaaS platforms. Enhance project plans with engineering excellence.'
      );
    }

    const processingTime = Date.now() - startTime;
    const estimatedCost = this.estimateCost(finalResult, 'deepseek/deepseek-v3.2-exp', enhancementModel);

    return {
      task: {
        type: 'project-structure',
        input: { domain, industry, location, goals },
        priority: 'high',
      },
      primaryModel: 'deepseek/deepseek-v3.2-exp',
      enhancementModel,
      result: finalResult,
      cost: estimatedCost,
      processingTime,
    };
  }

  /**
   * Generate content outlines at scale (DeepSeek primary)
   */
  async generateContentPlan(
    topics: string[],
    industry: string,
    location: string,
    contentType: 'blog' | 'pillar' | 'service' | 'location'
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    const result = await this.deepseek.generateContentOutlines(
      topics,
      industry,
      location,
      contentType
    );

    const processingTime = Date.now() - startTime;
    const estimatedCost = this.estimateCost(result, 'deepseek/deepseek-v3.2-exp');

    return {
      task: {
        type: 'content-outline',
        input: { topics, industry, location, contentType },
        priority: 'medium',
      },
      primaryModel: 'deepseek/deepseek-v3.2-exp',
      result,
      cost: estimatedCost,
      processingTime,
    };
  }

  /**
   * Competitive analysis with Perplexity (real-time data) + DeepSeek (synthesis)
   */
  async analyzeCompetition(
    competitors: string[],
    domain: string,
    industry: string,
    location: string
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    let result: string;
    let primaryModel: string;

    if (this.perplexity) {
      // Use Perplexity for real-time competitive intelligence
      primaryModel = 'perplexity-sonar';
      result = await this.perplexity.query(
        `Analyze the competitive landscape for ${domain} against ${competitors.join(', ')} in the ${industry} industry (${location}). Focus on SEO strategy, content approach, local presence, and market positioning.`,
        'You are a competitive intelligence analyst. Provide data-driven insights with citations.'
      );
    } else {
      // Fallback to DeepSeek
      primaryModel = 'deepseek/deepseek-v3.2-exp';
      result = await this.deepseek.analyzeCompetitors(competitors, domain, industry, location);
    }

    const processingTime = Date.now() - startTime;
    const estimatedCost = this.estimateCost(result, primaryModel);

    return {
      task: {
        type: 'competitor-analysis',
        input: { competitors, domain, industry, location },
        priority: 'high',
      },
      primaryModel,
      result,
      cost: estimatedCost,
      processingTime,
    };
  }

  /**
   * Generate keyword research (DeepSeek primary)
   */
  async generateKeywordStrategy(
    seedKeywords: string[],
    industry: string,
    location: string
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    const result = await this.deepseek.generateKeywordClusters(seedKeywords, industry, location);

    const processingTime = Date.now() - startTime;
    const estimatedCost = this.estimateCost(result, 'deepseek/deepseek-v3.2-exp');

    return {
      task: {
        type: 'keyword-research',
        input: { seedKeywords, industry, location },
        priority: 'high',
      },
      primaryModel: 'deepseek/deepseek-v3.2-exp',
      result,
      cost: estimatedCost,
      processingTime,
    };
  }

  /**
   * Generate technical audit checklist (DeepSeek primary)
   */
  async generateTechnicalAudit(
    domain: string,
    industry: string,
    siteType: 'ecommerce' | 'local-business' | 'saas' | 'content'
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    const result = await this.deepseek.generateTechnicalAuditChecklist(domain, industry, siteType);

    const processingTime = Date.now() - startTime;
    const estimatedCost = this.estimateCost(result, 'deepseek/deepseek-v3.2-exp');

    return {
      task: {
        type: 'technical-audit',
        input: { domain, industry, siteType },
        priority: 'medium',
      },
      primaryModel: 'deepseek/deepseek-v3.2-exp',
      result,
      cost: estimatedCost,
      processingTime,
    };
  }

  /**
   * Batch processing for cost efficiency
   */
  async processBatch(tasks: GenerationTask[]): Promise<GenerationResult[]> {
    // Group tasks by model for batch efficiency
    const tasksByModel = tasks.reduce((acc, task) => {
      const model = this.selectPrimaryModel(task);
      if (!acc[model.provider]) acc[model.provider] = [];
      acc[model.provider].push(task);
      return acc;
    }, {} as Record<string, GenerationTask[]>);

    // Process each model group in parallel
    const results = await Promise.all(
      Object.entries(tasksByModel).flatMap(([provider, modelTasks]) =>
        modelTasks.map((task) => this.processTask(task))
      )
    );

    return results;
  }

  /**
   * Process individual task based on type
   */
  private async processTask(task: GenerationTask): Promise<GenerationResult> {
    // Route to appropriate method based on task type
    // This is a placeholder - actual implementation would route to specific methods
    const startTime = Date.now();
    const model = this.selectPrimaryModel(task);

    return {
      task,
      primaryModel: model.provider,
      result: JSON.stringify(task.input),
      cost: 0,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Estimate cost based on token count (rough approximation)
   */
  private estimateCost(text: string, primaryModel: string, enhancementModel?: string): number {
    const tokenCount = Math.ceil(text.length / 4); // Rough token estimate
    let cost = (tokenCount / 1000) * (this.costEstimates[primaryModel as keyof typeof this.costEstimates] || 0.001);

    if (enhancementModel) {
      cost += (tokenCount / 1000) * (this.costEstimates[enhancementModel as keyof typeof this.costEstimates] || 0.003);
    }

    return Number(cost.toFixed(6));
  }

  /**
   * Get cost summary for reporting
   */
  getCostAnalysis(results: GenerationResult[]): {
    total: number;
    byModel: Record<string, number>;
    savings: number;
  } {
    const total = results.reduce((sum, r) => sum + r.cost, 0);
    const byModel = results.reduce((acc, r) => {
      acc[r.primaryModel] = (acc[r.primaryModel] || 0) + r.cost;
      return acc;
    }, {} as Record<string, number>);

    // Calculate savings vs using GPT-4 for everything
    const gpt4Cost = results.reduce((sum, r) => {
      const tokenCount = Math.ceil(r.result.length / 4);
      return sum + (tokenCount / 1000) * 0.03;
    }, 0);
    const savings = gpt4Cost - total;

    return { total, byModel, savings };
  }
}
