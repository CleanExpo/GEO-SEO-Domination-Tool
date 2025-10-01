// AI Search SEO Types

export interface AISearchStrategy {
  id?: number
  strategy_name: string
  category: 'content' | 'technical' | 'ai_optimization' | 'local' | 'citations' | 'eeat' | 'competitor'
  principle: string
  implementation_details: string
  tools_resources?: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  created_at?: string
}

export interface StrategyCaseStudy {
  id?: number
  strategy_id: number
  case_study_title: string
  industry?: string
  challenge?: string
  implementation: string
  results_achieved: string
  metrics?: Record<string, string | number>
  timeframe?: string
  created_at?: string
}

export interface AISearchCampaign {
  id?: number
  company_id: number
  campaign_name: string
  objective?: string
  target_ai_platforms: string[] // ['Perplexity', 'ChatGPT', 'Google AI Overview', etc.]
  start_date?: string
  end_date?: string
  status: 'planning' | 'active' | 'paused' | 'completed'
  budget?: number
  created_at?: string
}

export interface CampaignStrategy {
  id?: number
  campaign_id: number
  strategy_id: number
  implementation_status: 'not_started' | 'in_progress' | 'completed' | 'on_hold'
  assigned_to?: string
  due_date?: string
  notes?: string
}

export interface AISearchVisibility {
  id?: number
  company_id: number
  campaign_id?: number
  ai_platform: string // 'Perplexity', 'ChatGPT', etc.
  query: string
  brand_mentioned: boolean
  position_in_response?: number
  context_sentiment?: 'positive' | 'neutral' | 'negative'
  citation_included: boolean
  citation_url?: string
  full_response: string
  checked_at?: string
}

export interface PerplexityOptimization {
  id?: number
  company_id: number
  url: string
  content_type?: string
  optimization_score: number // 0-100
  ai_readability_score: number
  citation_worthiness_score: number
  key_facts_extracted: string[]
  recommended_improvements: string[]
  last_analyzed?: string
}

export interface AIContentStrategy {
  id?: number
  company_id: number
  topic_cluster: string
  target_ai_queries: string[]
  content_type?: string
  factual_angle?: string
  expert_sources?: string[]
  data_points?: string[]
  implementation_status: 'planned' | 'in_progress' | 'published' | 'optimizing'
  published_url?: string
  ai_citation_count: number
  created_at?: string
}

export interface CampaignResult {
  id?: number
  campaign_id: number
  metric_name: string
  metric_value: string
  metric_type?: string
  measurement_date?: string
  notes?: string
}

export interface AICompetitorAnalysis {
  id?: number
  company_id: number
  competitor_id?: number
  ai_platform: string
  queries_analyzed: number
  mention_frequency: number
  average_position?: number
  citation_quality_score: number
  topic_dominance?: Record<string, number>
  last_analyzed?: string
}

// AI Optimization Report Types
export interface AIOptimizationReport {
  url: string
  overall_score: number
  perplexity_score: number
  chatgpt_score: number
  google_ai_score: number
  strengths: string[]
  weaknesses: string[]
  critical_improvements: string[]
  quick_wins: string[]
}

// Topic Cluster Types
export interface TopicCluster {
  pillar_topic: string
  subtopics: string[]
  target_queries: string[]
  content_gaps: string[]
  internal_linking_opportunities: string[]
}

// Buyer Journey Types
export interface BuyerJourneyStage {
  stage: 'awareness' | 'consideration' | 'decision' | 'retention'
  psychographic_profile: {
    motivations: string[]
    fears: string[]
    objections: string[]
    values: string[]
  }
  content_needs: string[]
  ai_queries: string[]
}

// Seasonality Analysis Types
export interface SeasonalityAnalysis {
  keyword: string
  peak_seasons: {
    month: string
    search_volume_multiplier: number
  }[]
  content_calendar: {
    publish_date: string
    topic: string
    reason: string
  }[]
}
