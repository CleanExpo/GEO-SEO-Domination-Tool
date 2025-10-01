export interface Company {
  id: string;
  name: string;
  website: string;
  industry?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface SEOAudit {
  id: string;
  company_id: string;
  url: string;
  score: number;
  title?: string;
  meta_description?: string;
  h1_tags?: string[];
  meta_tags?: Record<string, any>;
  performance_score?: number;
  accessibility_score?: number;
  seo_score?: number;
  issues: AuditIssue[];
  created_at: string;
}

export interface AuditIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
}

export interface Keyword {
  id: string;
  company_id: string;
  keyword: string;
  search_volume?: number;
  difficulty?: number;
  cpc?: number;
  trend?: 'up' | 'down' | 'stable';
  created_at: string;
}

export interface Ranking {
  id: string;
  company_id: string;
  keyword_id: string;
  position: number;
  url: string;
  location: string;
  search_engine: 'google' | 'bing';
  date: string;
  created_at: string;
}

export interface Competitor {
  id: string;
  company_id: string;
  competitor_name: string;
  competitor_url: string;
  domain_authority?: number;
  backlinks?: number;
  created_at: string;
}

export interface Report {
  id: string;
  company_id: string;
  title: string;
  type: 'seo_audit' | 'keyword_research' | 'competitor_analysis' | 'ranking_report';
  data: Record<string, any>;
  generated_at: string;
  created_at: string;
}
