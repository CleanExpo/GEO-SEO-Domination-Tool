/**
 * Cascading AI Service
 *
 * Cost-optimized AI strategy: Try cheaper models first, fall back to premium models
 * Cascade order: Qwen (cheapest) → Claude Opus → Claude Sonnet 4.5
 *
 * Cost comparison (per 1M tokens):
 * - Qwen Plus: $0.40 input / $1.20 output
 * - Claude Opus: $15.00 input / $75.00 output
 * - Claude Sonnet 4.5: $3.00 input / $15.00 output
 *
 * Estimated savings: 85-95% on most requests
 */

import { getQwenClient, getQwenModelName, isQwenAvailable, QWEN_MODELS } from '@/lib/qwen-config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// ============================================================================
// TYPES
// ============================================================================

export interface CascadingAIOptions {
  /** Skip Qwen and start with Claude */
  skipQwen?: boolean;
  /** Use specific Qwen model (default: qwen-plus) */
  qwenModel?: 'qwen-plus' | 'qwen-turbo' | 'qwen-max';
  /** Temperature for AI generation (0-1) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Request JSON response */
  jsonMode?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
}

export interface CascadingAIResult<T = any> {
  /** The parsed response */
  data: T;
  /** Which model successfully responded */
  model: 'qwen' | 'claude-opus' | 'claude-sonnet-4.5';
  /** Cost in USD */
  estimatedCost: number;
  /** How many models were tried */
  attemptCount: number;
  /** Tokens used */
  tokens: {
    input: number;
    output: number;
  };
}

export interface CascadingAIError {
  message: string;
  attemptedModels: string[];
  lastError: Error;
}

// ============================================================================
// AI CLIENTS
// ============================================================================

// Lazy-load clients to avoid build-time errors
let _anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!_anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set');
    }
    _anthropicClient = new Anthropic({ apiKey });
  }
  return _anthropicClient;
}

// ============================================================================
// CASCADING AI SERVICE
// ============================================================================

export class CascadingAI {
  /**
   * Send a prompt with cascading fallback
   * Tries Qwen → Claude Opus → Claude Sonnet 4.5
   */
  async generate<T = any>(
    systemPrompt: string,
    userPrompt: string,
    options: CascadingAIOptions = {}
  ): Promise<CascadingAIResult<T>> {
    const {
      skipQwen = false,
      qwenModel = QWEN_MODELS.PLUS,
      temperature = 0.3,
      maxTokens = 3000,
      jsonMode = false,
      timeout = 30000,
    } = options;

    const attemptedModels: string[] = [];
    let lastError: Error | null = null;

    // ========================================================================
    // ATTEMPT 1: Qwen (Cheapest - $0.40/$1.20 per 1M tokens)
    // ========================================================================
    if (!skipQwen && isQwenAvailable()) {
      try {
        console.log('🔄 [CascadingAI] Trying Qwen first (cost-optimized)...');
        const result = await this.tryQwen<T>(
          systemPrompt,
          userPrompt,
          qwenModel,
          temperature,
          maxTokens,
          jsonMode,
          timeout
        );
        console.log(`✅ [CascadingAI] Qwen succeeded! Cost: $${result.estimatedCost.toFixed(4)}`);
        return result;
      } catch (error) {
        attemptedModels.push('qwen');
        lastError = error as Error;
        console.warn('⚠️  [CascadingAI] Qwen failed, trying Claude Opus...', error);
      }
    }

    // ========================================================================
    // ATTEMPT 2: Claude Opus (Premium - $15/$75 per 1M tokens)
    // ========================================================================
    try {
      console.log('🔄 [CascadingAI] Trying Claude Opus...');
      const result = await this.tryClaudeOpus<T>(
        systemPrompt,
        userPrompt,
        temperature,
        maxTokens,
        timeout
      );
      console.log(`✅ [CascadingAI] Claude Opus succeeded! Cost: $${result.estimatedCost.toFixed(4)}`);
      return result;
    } catch (error) {
      attemptedModels.push('claude-opus');
      lastError = error as Error;
      console.warn('⚠️  [CascadingAI] Claude Opus failed, trying Claude Sonnet 4.5...', error);
    }

    // ========================================================================
    // ATTEMPT 3: Claude Sonnet 4.5 (Mid-tier - $3/$15 per 1M tokens)
    // ========================================================================
    try {
      console.log('🔄 [CascadingAI] Trying Claude Sonnet 4.5 (final fallback)...');
      const result = await this.tryClaudeSonnet<T>(
        systemPrompt,
        userPrompt,
        temperature,
        maxTokens,
        timeout
      );
      console.log(`✅ [CascadingAI] Claude Sonnet 4.5 succeeded! Cost: $${result.estimatedCost.toFixed(4)}`);
      return result;
    } catch (error) {
      attemptedModels.push('claude-sonnet-4.5');
      lastError = error as Error;
      console.error('❌ [CascadingAI] All models failed!');
    }

    // All models failed
    throw {
      message: 'All AI models failed to respond',
      attemptedModels,
      lastError: lastError || new Error('Unknown error'),
    } as CascadingAIError;
  }

  // ==========================================================================
  // INDIVIDUAL MODEL IMPLEMENTATIONS
  // ==========================================================================

  /**
   * Try Qwen (Alibaba Cloud Model Studio)
   */
  private async tryQwen<T>(
    systemPrompt: string,
    userPrompt: string,
    model: string,
    temperature: number,
    maxTokens: number,
    jsonMode: boolean,
    timeout: number
  ): Promise<CascadingAIResult<T>> {
    const qwen = getQwenClient();
    const modelName = getQwenModelName(model as any);

    const response = await Promise.race([
      qwen.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
        ...(jsonMode && { response_format: { type: 'json_object' } }),
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Qwen timeout')), timeout)
      ),
    ]);

    const content = response.choices[0]?.message?.content || '{}';
    const data = jsonMode ? JSON.parse(content) : content;

    // Estimate cost (Qwen Plus: $0.40 input / $1.20 output per 1M tokens)
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const estimatedCost =
      (inputTokens / 1_000_000) * 0.40 + (outputTokens / 1_000_000) * 1.20;

    return {
      data: data as T,
      model: 'qwen',
      estimatedCost,
      attemptCount: 1,
      tokens: {
        input: inputTokens,
        output: outputTokens,
      },
    };
  }

  /**
   * Try Claude Opus (Anthropic)
   */
  private async tryClaudeOpus<T>(
    systemPrompt: string,
    userPrompt: string,
    temperature: number,
    maxTokens: number,
    timeout: number
  ): Promise<CascadingAIResult<T>> {
    const anthropic = getAnthropicClient();

    const response = await Promise.race([
      anthropic.messages.create({
        model: 'claude-opus-4-20250514',
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Claude Opus timeout')), timeout)
      ),
    ]);

    const content = response.content[0];
    const textContent = content.type === 'text' ? content.text : '{}';
    const data = textContent.trim().startsWith('{') ? JSON.parse(textContent) : textContent;

    // Estimate cost (Claude Opus: $15 input / $75 output per 1M tokens)
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const estimatedCost =
      (inputTokens / 1_000_000) * 15.0 + (outputTokens / 1_000_000) * 75.0;

    return {
      data: data as T,
      model: 'claude-opus',
      estimatedCost,
      attemptCount: 2,
      tokens: {
        input: inputTokens,
        output: outputTokens,
      },
    };
  }

  /**
   * Try Claude Sonnet 4.5 (Anthropic)
   */
  private async tryClaudeSonnet<T>(
    systemPrompt: string,
    userPrompt: string,
    temperature: number,
    maxTokens: number,
    timeout: number
  ): Promise<CascadingAIResult<T>> {
    const anthropic = getAnthropicClient();

    const response = await Promise.race([
      anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Claude Sonnet timeout')), timeout)
      ),
    ]);

    const content = response.content[0];
    const textContent = content.type === 'text' ? content.text : '{}';
    const data = textContent.trim().startsWith('{') ? JSON.parse(textContent) : textContent;

    // Estimate cost (Claude Sonnet 4.5: $3 input / $15 output per 1M tokens)
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const estimatedCost =
      (inputTokens / 1_000_000) * 3.0 + (outputTokens / 1_000_000) * 15.0;

    return {
      data: data as T,
      model: 'claude-sonnet-4.5',
      estimatedCost,
      attemptCount: 3,
      tokens: {
        input: inputTokens,
        output: outputTokens,
      },
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const cascadingAI = new CascadingAI();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick generation with cascading fallback
 */
export async function generateWithFallback<T = any>(
  systemPrompt: string,
  userPrompt: string,
  options?: CascadingAIOptions
): Promise<T> {
  const result = await cascadingAI.generate<T>(systemPrompt, userPrompt, options);
  return result.data;
}

/**
 * Generate with cost tracking
 */
export async function generateWithCostTracking<T = any>(
  systemPrompt: string,
  userPrompt: string,
  options?: CascadingAIOptions
): Promise<CascadingAIResult<T>> {
  return cascadingAI.generate<T>(systemPrompt, userPrompt, options);
}
