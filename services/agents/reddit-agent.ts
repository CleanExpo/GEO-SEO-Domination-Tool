/**
 * Reddit Agent
 * Specialist agent for Reddit community mining and gap analysis
 */

import { AgentConfig } from './types';

export const redditAgent: AgentConfig = {
  id: 'reddit-agent',
  name: 'Reddit Agent',
  role: 'community_mining_specialist',
  description: 'Mines Reddit discussions to find content gaps, unanswered questions, and community pain points',
  capabilities: [
    {
      name: 'mine_discussions',
      description: 'Search and analyze Reddit discussions',
      requiredTools: ['reddit_api', 'snoowrap']
    },
    {
      name: 'extract_questions',
      description: 'Extract and categorize questions from comments',
      requiredTools: ['nlp', 'question_detection']
    },
    {
      name: 'sentiment_analysis',
      description: 'Analyze community sentiment and pain points',
      requiredTools: ['nlp', 'sentiment_classifier']
    },
    {
      name: 'trend_detection',
      description: 'Detect trending topics and discussions',
      requiredTools: ['reddit_api', 'trend_analysis']
    }
  ],
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.3,
  maxTokens: 6000
};
