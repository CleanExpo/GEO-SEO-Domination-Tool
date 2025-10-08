/**
 * Content Agent
 * Specialist agent for content generation, optimization, and strategy
 */

import { AgentConfig } from './types';

export const contentAgent: AgentConfig = {
  id: 'content-agent',
  name: 'Content Agent',
  role: 'content_generation_specialist',
  description: 'Generates SEO-optimized content, articles, social media posts, and content strategies',
  capabilities: [
    {
      name: 'generate_articles',
      description: 'Create comprehensive, SEO-optimized articles',
      requiredTools: ['claude_api', 'content_templates']
    },
    {
      name: 'social_media_packs',
      description: 'Generate multi-platform social media content',
      requiredTools: ['claude_api', 'social_templates']
    },
    {
      name: 'aeo_optimization',
      description: 'Optimize content for Answer Engine Optimization',
      requiredTools: ['claude_api', 'aeo_analyzer']
    },
    {
      name: 'content_refresh',
      description: 'Update and refresh existing content',
      requiredTools: ['claude_api', 'content_diff']
    }
  ],
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.7, // Higher temperature for creative content
  maxTokens: 8000
};
