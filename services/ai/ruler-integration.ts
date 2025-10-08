/**
 * OpenPipe ART (RULER) Integration
 *
 * Reward-free Reinforcement Learning for Self-Improving Marketing Agents
 *
 * RULER (Relative Universal LLM-Elicited Rewards) eliminates manual reward
 * function engineering by using LLMs as automated judges.
 *
 * Benefits:
 * - 2-3x faster development vs traditional RL
 * - No labeled data required
 * - Automatic performance optimization
 * - Continuous improvement without manual tuning
 *
 * Use Cases:
 * 1. SEO Agent: Learns from successful keyword rankings
 * 2. Social Agent: Learns from viral content patterns
 * 3. Content Agent: Learns from high-converting copy
 */

import OpenAI from 'openai';

// Initialize DeepSeek V3 for RULER judging (cheaper than GPT-4)
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
});

// Fallback to OpenAI O3 for critical judgments
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// RULER Core Types
// ============================================================================

export interface AgentTrajectory {
  taskDescription: string;
  agentActions: string[];
  observations: string[];
  finalResult: string;
  metadata?: Record<string, any>;
}

export interface RULERScore {
  score: number; // 0-100
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  confidenceLevel: 'low' | 'medium' | 'high';
}

export interface TrajectoryGroup {
  taskType: 'seo' | 'social_media' | 'content_writing' | 'backlink_analysis';
  trajectories: AgentTrajectory[];
  expectedOutcome?: string;
}

export interface LearningInsight {
  pattern: string;
  frequency: number;
  successRate: number;
  recommendation: string;
  examples: string[];
}

// ============================================================================
// RULER Scoring Engine
// ============================================================================

export class RULEREngine {
  private judgingModel: 'deepseek' | 'openai';
  private performanceHistory: Map<string, RULERScore[]> = new Map();

  constructor(judgingModel: 'deepseek' | 'openai' = 'deepseek') {
    this.judgingModel = judgingModel;
  }

  /**
   * Score a single agent trajectory using RULER
   */
  async scoreTrajectory(
    trajectory: AgentTrajectory,
    useOpenAI: boolean = false
  ): Promise<RULERScore> {
    const client = useOpenAI ? openai : deepseek;
    const model = useOpenAI ? 'o3-mini' : 'deepseek-chat';

    const prompt = this.constructJudgingPrompt(trajectory);

    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `You are an expert AI agent evaluator using the RULER (Relative Universal LLM-Elicited Rewards) methodology.

Your task is to score agent trajectories objectively based on:
1. Task completion accuracy (40%)
2. Efficiency of approach (30%)
3. Quality of reasoning (20%)
4. Adherence to best practices (10%)

Provide scores on a 0-100 scale with detailed reasoning.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      const score: RULERScore = {
        score: result.score || 0,
        reasoning: result.reasoning || 'No reasoning provided',
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        improvements: result.improvements || [],
        confidenceLevel: result.confidenceLevel || 'medium'
      };

      // Store in performance history
      const taskKey = trajectory.taskDescription.substring(0, 50);
      if (!this.performanceHistory.has(taskKey)) {
        this.performanceHistory.set(taskKey, []);
      }
      this.performanceHistory.get(taskKey)!.push(score);

      return score;
    } catch (error) {
      console.error('RULER scoring error:', error);
      throw new Error(`Failed to score trajectory: ${error}`);
    }
  }

  /**
   * Score a group of trajectories and identify the best approach
   */
  async scoreGroup(
    group: TrajectoryGroup,
    useOpenAI: boolean = false
  ): Promise<{
    scores: RULERScore[];
    bestTrajectoryIndex: number;
    groupInsights: string[];
  }> {
    const scores = await Promise.all(
      group.trajectories.map(t => this.scoreTrajectory(t, useOpenAI))
    );

    const bestIndex = scores.reduce(
      (maxIdx, score, idx, arr) => (score.score > arr[maxIdx].score ? idx : maxIdx),
      0
    );

    const insights = this.extractGroupInsights(group.trajectories, scores);

    return {
      scores,
      bestTrajectoryIndex: bestIndex,
      groupInsights: insights
    };
  }

  /**
   * Learn from performance history and generate recommendations
   */
  async generateLearningInsights(
    taskType: string,
    minDataPoints: number = 10
  ): Promise<LearningInsight[]> {
    const relevantHistory = Array.from(this.performanceHistory.entries())
      .filter(([key]) => key.includes(taskType))
      .flatMap(([_, scores]) => scores);

    if (relevantHistory.length < minDataPoints) {
      return [];
    }

    // Analyze patterns in high-scoring trajectories
    const highPerformers = relevantHistory.filter(s => s.score >= 80);
    const commonStrengths = this.findCommonPatterns(
      highPerformers.flatMap(s => s.strengths)
    );
    const commonImprovements = this.findCommonPatterns(
      relevantHistory.flatMap(s => s.improvements)
    );

    const insights: LearningInsight[] = [];

    // Convert common strengths to insights
    for (const [pattern, frequency] of commonStrengths.entries()) {
      const successRate =
        highPerformers.filter(s => s.strengths.includes(pattern)).length /
        relevantHistory.length;

      if (successRate > 0.5) {
        insights.push({
          pattern,
          frequency,
          successRate,
          recommendation: `Continue using this approach - ${(successRate * 100).toFixed(1)}% success rate`,
          examples: highPerformers
            .filter(s => s.strengths.includes(pattern))
            .slice(0, 3)
            .map(s => s.reasoning)
        });
      }
    }

    // Convert common improvements to insights
    for (const [pattern, frequency] of commonImprovements.entries()) {
      if (frequency > relevantHistory.length * 0.3) {
        insights.push({
          pattern,
          frequency,
          successRate: 0,
          recommendation: `Focus on improvement: mentioned in ${((frequency / relevantHistory.length) * 100).toFixed(1)}% of trajectories`,
          examples: relevantHistory
            .filter(s => s.improvements.includes(pattern))
            .slice(0, 3)
            .map(s => s.reasoning)
        });
      }
    }

    return insights;
  }

  /**
   * Optimize agent behavior based on RULER feedback
   */
  async optimizeAgentBehavior(
    taskType: string,
    currentApproach: string
  ): Promise<{
    optimizedApproach: string;
    expectedImprovement: number;
    rationale: string;
  }> {
    const insights = await this.generateLearningInsights(taskType);

    if (insights.length === 0) {
      return {
        optimizedApproach: currentApproach,
        expectedImprovement: 0,
        rationale: 'Insufficient data for optimization'
      };
    }

    const client = this.judgingModel === 'openai' ? openai : deepseek;
    const model = this.judgingModel === 'openai' ? 'o3-mini' : 'deepseek-chat';

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an AI optimization expert using RULER insights to improve agent performance.'
        },
        {
          role: 'user',
          content: `Based on the following learning insights, optimize this approach:

Current Approach:
${currentApproach}

Learning Insights:
${insights.map(i => `- ${i.pattern} (Success Rate: ${(i.successRate * 100).toFixed(1)}%): ${i.recommendation}`).join('\n')}

Provide:
1. Optimized approach (incorporating successful patterns)
2. Expected improvement percentage (0-100)
3. Detailed rationale

Respond in JSON format.`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      optimizedApproach: result.optimizedApproach || currentApproach,
      expectedImprovement: result.expectedImprovement || 0,
      rationale: result.rationale || 'No rationale provided'
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private constructJudgingPrompt(trajectory: AgentTrajectory): string {
    return `Evaluate this agent trajectory:

**Task Description:**
${trajectory.taskDescription}

**Agent Actions:**
${trajectory.agentActions.map((action, i) => `${i + 1}. ${action}`).join('\n')}

**Observations:**
${trajectory.observations.map((obs, i) => `${i + 1}. ${obs}`).join('\n')}

**Final Result:**
${trajectory.finalResult}

${trajectory.metadata ? `**Additional Context:**\n${JSON.stringify(trajectory.metadata, null, 2)}` : ''}

Please provide a comprehensive evaluation in JSON format:
{
  "score": <0-100>,
  "reasoning": "<detailed explanation>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "improvements": ["<improvement 1>", "<improvement 2>", ...],
  "confidenceLevel": "<low|medium|high>"
}`;
  }

  private extractGroupInsights(
    trajectories: AgentTrajectory[],
    scores: RULERScore[]
  ): string[] {
    const insights: string[] = [];

    // Average score
    const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
    insights.push(`Average performance: ${avgScore.toFixed(1)}/100`);

    // Score variance
    const variance =
      scores.reduce((sum, s) => sum + Math.pow(s.score - avgScore, 2), 0) /
      scores.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev > 15) {
      insights.push(`High variance detected (±${stdDev.toFixed(1)}) - approaches differ significantly`);
    } else {
      insights.push(`Consistent performance (±${stdDev.toFixed(1)}) - approaches are similar`);
    }

    // Common patterns
    const allStrengths = scores.flatMap(s => s.strengths);
    const strengthCounts = this.findCommonPatterns(allStrengths);
    const topStrength = Array.from(strengthCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];

    if (topStrength) {
      insights.push(
        `Common strength: "${topStrength[0]}" (${topStrength[1]}/${trajectories.length} trajectories)`
      );
    }

    return insights;
  }

  private findCommonPatterns(items: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    items.forEach(item => {
      counts.set(item, (counts.get(item) || 0) + 1);
    });
    return counts;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const ruler = new RULEREngine('deepseek');

// ============================================================================
// Task-Specific RULER Evaluators
// ============================================================================

/**
 * SEO Task Evaluator
 */
export async function evaluateSEOTask(
  taskDescription: string,
  keywords: string[],
  strategy: string,
  results: {
    rankings?: Record<string, number>;
    traffic?: number;
    conversions?: number;
  }
): Promise<RULERScore> {
  const trajectory: AgentTrajectory = {
    taskDescription,
    agentActions: [
      `Analyzed keywords: ${keywords.join(', ')}`,
      `Applied strategy: ${strategy}`,
      'Monitored rankings and performance'
    ],
    observations: [
      `Rankings: ${JSON.stringify(results.rankings || {})}`,
      `Traffic: ${results.traffic || 'N/A'}`,
      `Conversions: ${results.conversions || 'N/A'}`
    ],
    finalResult: `SEO campaign completed with ${Object.keys(results.rankings || {}).length} keywords tracked`,
    metadata: { keywords, strategy, results }
  };

  return ruler.scoreTrajectory(trajectory);
}

/**
 * Social Media Task Evaluator
 */
export async function evaluateSocialMediaTask(
  taskDescription: string,
  platform: string,
  content: string,
  results: {
    engagement?: number;
    reach?: number;
    conversions?: number;
  }
): Promise<RULERScore> {
  const trajectory: AgentTrajectory = {
    taskDescription,
    agentActions: [
      `Created content for ${platform}`,
      `Posted: ${content.substring(0, 100)}...`,
      'Monitored engagement metrics'
    ],
    observations: [
      `Engagement: ${results.engagement || 'N/A'}`,
      `Reach: ${results.reach || 'N/A'}`,
      `Conversions: ${results.conversions || 'N/A'}`
    ],
    finalResult: `Social media post achieved ${results.engagement || 0} engagement`,
    metadata: { platform, content, results }
  };

  return ruler.scoreTrajectory(trajectory);
}

/**
 * Content Writing Task Evaluator
 */
export async function evaluateContentWritingTask(
  taskDescription: string,
  contentType: string,
  content: string,
  results: {
    seoScore?: number;
    readabilityScore?: number;
    engagementRate?: number;
    conversionRate?: number;
  }
): Promise<RULERScore> {
  const trajectory: AgentTrajectory = {
    taskDescription,
    agentActions: [
      `Generated ${contentType}`,
      `Length: ${content.length} characters`,
      'Optimized for SEO and readability'
    ],
    observations: [
      `SEO Score: ${results.seoScore || 'N/A'}/100`,
      `Readability: ${results.readabilityScore || 'N/A'}/100`,
      `Engagement Rate: ${results.engagementRate || 'N/A'}%`,
      `Conversion Rate: ${results.conversionRate || 'N/A'}%`
    ],
    finalResult: `Content generated with ${results.seoScore || 0}/100 SEO score`,
    metadata: { contentType, contentLength: content.length, results }
  };

  return ruler.scoreTrajectory(trajectory);
}

// ============================================================================
// Export All
// ============================================================================

export default {
  RULEREngine,
  ruler,
  evaluateSEOTask,
  evaluateSocialMediaTask,
  evaluateContentWritingTask
};
