/**
 * Reddit Agent
 * Specialist agent for Reddit community mining and gap analysis
 *
 * Now using secure direct Reddit OAuth API implementation (no vulnerable dependencies)
 */

import { AgentConfig } from './types';

export const redditAgent: AgentConfig = {
  id: 'reddit-agent',
  name: 'Reddit Agent',
  role: 'community_mining_specialist',
  description: 'Mines Reddit discussions to find content gaps, unanswered questions, and community pain points using secure direct Reddit API integration',
  capabilities: [
    {
      name: 'mine_discussions',
      description: 'Search and analyze Reddit discussions using OAuth 2.0',
      requiredTools: ['reddit_api', 'axios']
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
