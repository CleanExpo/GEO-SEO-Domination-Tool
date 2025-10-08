/**
 * SEO Agent
 * Specialist agent for SEO analysis, keyword research, and ranking optimization
 */

import { AgentConfig } from './types';

export const seoAgent: AgentConfig = {
  id: 'seo-agent',
  name: 'SEO Agent',
  role: 'seo_optimization_specialist',
  description: 'Analyzes SEO metrics, researches keywords, and provides optimization recommendations',
  capabilities: [
    {
      name: 'keyword_research',
      description: 'Research and analyze keywords for SEO opportunities',
      requiredTools: ['dataforseo', 'semrush']
    },
    {
      name: 'rank_tracking',
      description: 'Monitor and track keyword rankings',
      requiredTools: ['serp_api', 'dataforseo']
    },
    {
      name: 'competitor_analysis',
      description: 'Analyze competitor SEO strategies',
      requiredTools: ['semrush', 'ahrefs']
    },
    {
      name: 'technical_audit',
      description: 'Perform technical SEO audits',
      requiredTools: ['lighthouse', 'screaming_frog']
    }
  ],
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.2,
  maxTokens: 8000
};
