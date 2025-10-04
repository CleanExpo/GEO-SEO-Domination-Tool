// Core Types for GEO-SEO Domination Tool

export interface Company {
  id?: number
  name: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  website: string
  email?: string
  industry?: string
  services?: string[]
  description?: string
  gbp_url?: string
  social_profiles?: Record<string, string>
  created_at?: string
  updated_at?: string
}

export interface Individual {
  id?: number
  company_id: number
  name: string
  title?: string
  credentials?: string[]
  experience_years?: number
  bio?: string
  expertise_areas?: string[]
  author_page_url?: string
  social_profiles?: Record<string, string>
  created_at?: string
}

export interface LighthouseScores {
  performance: number
  accessibility: number
  best_practices: number
  seo: number
  pwa?: number
}

export interface EEATScores {
  experience: number
  expertise: number
  authoritativeness: number
  trustworthiness: number
  overall: number
}

export interface Audit {
  id?: number
  company_id: number
  audit_date: string
  lighthouse_scores: LighthouseScores
  eeat_scores: EEATScores
  local_pack_positions?: LocalPackPosition[]
  competitor_data?: CompetitorData
  recommendations?: Recommendation[]
  priority_level: 'low' | 'medium' | 'high' | 'critical'
}

export interface Keyword {
  id?: number
  company_id: number
  keyword: string
  location: string
  search_volume?: number
  difficulty?: number
  current_rank?: number
  competition_level?: 'low' | 'medium' | 'high'
  last_checked?: string
}

export interface Competitor {
  id?: number
  company_id: number
  competitor_name: string
  website?: string
  gbp_url?: string
  rankings?: Record<string, number>
  review_count?: number
  avg_rating?: number
  last_analyzed?: string
}

export interface Citation {
  id?: number
  company_id: number
  platform: string
  url: string
  nap_accurate: boolean
  last_checked?: string
  status: 'active' | 'pending' | 'inactive'
}

export interface LocalPackPosition {
  keyword: string
  location: string
  position: number
  competitor_in_pack?: string[]
  checked_at: string
}

export interface CompetitorData {
  keywords_gap: string[]
  backlinks_gap: number
  citation_gap: number
  review_gap: number
}

export interface Recommendation {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'technical' | 'content' | 'local' | 'eeat' | 'citations'
  estimated_impact: string
}

export interface ServiceArea {
  id?: number
  company_id: number
  area_name: string
  area_type: 'city' | 'state' | 'radius' | 'custom'
  latitude?: number
  longitude?: number
  radius_miles?: number
}
