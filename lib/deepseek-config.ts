/**
 * DeepSeek Configuration
 * Handles both direct DeepSeek API and OpenRouter proxy
 */

import OpenAI from 'openai';

// Configuration priority:
// 1. Direct DeepSeek API (if DEEPSEEK_API_KEY is provided)
// 2. OpenRouter proxy (if OPENROUTER_API is provided)
// 3. Fallback to dummy configuration for build time

// Determine which API to use and configure accordingly
export function createDeepSeekClient(): OpenAI {
  // Check if we're in build time (when there's no process.env properly loaded)
  if (typeof window === 'undefined' && !process.env.NODE_ENV) {
    // During build time, create a dummy client
    return new OpenAI({
      apiKey: 'build-time-dummy-key',
      baseURL: 'https://api.openai.com/v1',
    });
  }
  
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API || process.env.OPENROUTER_API_KEY;
  
  if (deepseekKey) {
    // Direct DeepSeek API
    return new OpenAI({
      apiKey: deepseekKey,
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    });
  } else if (openrouterKey) {
    // OpenRouter proxy for DeepSeek
    return new OpenAI({
      apiKey: openrouterKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });
  } else {
    // Runtime error if no key available
    throw new Error('No DeepSeek API key found. Please set either DEEPSEEK_API_KEY or OPENROUTER_API environment variable.');
  }
}

// Model configuration based on API provider
export function getDeepSeekModel(): string {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API;
  
  if (deepseekKey) {
    return 'deepseek-chat'; // Direct API model name
  } else if (openrouterKey) {
    return 'deepseek/deepseek-chat'; // OpenRouter model name
  } else {
    return 'gpt-3.5-turbo'; // Fallback for build time
  }
}

// Check if DeepSeek is available
export function isDeepSeekAvailable(): boolean {
  return !!(process.env.DEEPSEEK_API_KEY || process.env.OPENROUTER_API);
}

// Get configuration info for debugging
export function getDeepSeekConfig() {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API;
  
  return {
    provider: deepseekKey ? 'direct' : openrouterKey ? 'openrouter' : 'none',
    model: getDeepSeekModel(),
    baseURL: deepseekKey 
      ? (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1') 
      : 'https://openrouter.ai/api/v1',
    available: isDeepSeekAvailable()
  };
}

// Lazy-loaded client and model to avoid initialization errors during build
let _deepseekClient: OpenAI | null = null;
let _deepseekModel: string | null = null;

export function getDeepSeekClient(): OpenAI {
  if (!_deepseekClient) {
    _deepseekClient = createDeepSeekClient();
  }
  return _deepseekClient;
}

export function getDeepSeekModelName(): string {
  if (!_deepseekModel) {
    _deepseekModel = getDeepSeekModel();
  }
  return _deepseekModel;
}