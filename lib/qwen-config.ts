/**
 * Qwen (Alibaba Cloud Model Studio) Configuration
 *
 * Qwen offers cost-effective AI models via OpenAI-compatible API
 * Singapore region endpoint (International Edition)
 *
 * Supported models:
 * - qwen-plus: Balanced performance and cost
 * - qwen-turbo: Fast and economical
 * - qwen-max: Maximum capability
 */

import OpenAI from 'openai';

// Configuration
export const QWEN_MODELS = {
  PLUS: 'qwen-plus',      // Recommended for most use cases
  TURBO: 'qwen-turbo',    // Fast, economical
  MAX: 'qwen-max',        // Maximum capability
} as const;

export type QwenModel = typeof QWEN_MODELS[keyof typeof QWEN_MODELS];

// Default model to use
const DEFAULT_MODEL: QwenModel = QWEN_MODELS.PLUS;

// Determine which region endpoint to use
export function getQwenBaseURL(region: 'singapore' | 'beijing' = 'singapore'): string {
  return region === 'singapore'
    ? 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'
    : 'https://dashscope.aliyuncs.com/compatible-mode/v1';
}

// Create Qwen client (OpenAI-compatible)
export function createQwenClient(options: {
  region?: 'singapore' | 'beijing';
} = {}): OpenAI {
  // Check if we're in build time (when there's no process.env properly loaded)
  if (typeof window === 'undefined' && !process.env.NODE_ENV) {
    // During build time, create a dummy client
    return new OpenAI({
      apiKey: 'build-time-dummy-key',
      baseURL: 'https://api.openai.com/v1',
    });
  }

  const qwenKey = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;

  if (!qwenKey) {
    // Runtime error if no key available
    throw new Error(
      'No Qwen API key found. Please set QWEN_API_KEY or DASHSCOPE_API_KEY environment variable. ' +
      'Get your API key from: https://modelstudio.console.alibabacloud.com/?tab=model#/api-key'
    );
  }

  const region = options.region || 'singapore';

  return new OpenAI({
    apiKey: qwenKey,
    baseURL: getQwenBaseURL(region),
  });
}

// Get Qwen model name
export function getQwenModel(model?: QwenModel): string {
  return model || DEFAULT_MODEL;
}

// Check if Qwen is available
export function isQwenAvailable(): boolean {
  return !!(process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY);
}

// Get configuration info for debugging
export function getQwenConfig(options: { region?: 'singapore' | 'beijing' } = {}) {
  const qwenKey = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;
  const region = options.region || 'singapore';

  return {
    provider: 'Alibaba Cloud Model Studio (Qwen)',
    model: DEFAULT_MODEL,
    region,
    baseURL: getQwenBaseURL(region),
    available: isQwenAvailable(),
    hasKey: !!qwenKey,
  };
}

// Lazy-loaded client and model to avoid initialization errors during build
let _qwenClient: OpenAI | null = null;
let _qwenModel: string | null = null;

export function getQwenClient(options: { region?: 'singapore' | 'beijing' } = {}): OpenAI {
  if (!_qwenClient) {
    _qwenClient = createQwenClient(options);
  }
  return _qwenClient;
}

export function getQwenModelName(model?: QwenModel): string {
  if (!_qwenModel) {
    _qwenModel = getQwenModel(model);
  }
  return _qwenModel;
}

// Reset client (useful for testing or region switching)
export function resetQwenClient(): void {
  _qwenClient = null;
  _qwenModel = null;
}

// Pricing information (for reference)
export const QWEN_PRICING = {
  'qwen-plus': {
    inputPer1M: 0.40,   // $0.40 per 1M input tokens
    outputPer1M: 1.20,  // $1.20 per 1M output tokens
  },
  'qwen-turbo': {
    inputPer1M: 0.15,   // $0.15 per 1M input tokens
    outputPer1M: 0.60,  // $0.60 per 1M output tokens
  },
  'qwen-max': {
    inputPer1M: 4.00,   // $4.00 per 1M input tokens
    outputPer1M: 12.00, // $12.00 per 1M output tokens
  },
} as const;

// Cost calculator
export function estimateQwenCost(
  model: QwenModel,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = QWEN_PRICING[model];
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;
  return inputCost + outputCost;
}
