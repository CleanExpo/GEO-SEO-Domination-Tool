// Supabase Database Types - Auto-generated from schema
// This file contains type definitions for all 30+ database tables

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: Omit<Company, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Company, 'id' | 'created_at' | 'updated_at'>>;
      };
      keywords: {
        Row: Keyword;
        Insert: Omit<Keyword, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Keyword, 'id' | 'created_at' | 'updated_at'>>;
      };
      rankings: {
        Row: Ranking;
        Insert: Omit<Ranking, 'id' | 'created_at'>;
        Update: Partial<Omit<Ranking, 'id' | 'created_at'>>;
      };
      seo_audits: {
        Row: SEOAudit;
        Insert: Omit<SEOAudit, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SEOAudit, 'id' | 'created_at' | 'updated_at'>>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>;
      };
      project_notes: {
        Row: ProjectNote;
        Insert: Omit<ProjectNote, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ProjectNote, 'id' | 'created_at' | 'updated_at'>>;
      };
      github_repos: {
        Row: GithubRepo;
        Insert: Omit<GithubRepo, 'id' | 'created_at'>;
        Update: Partial<Omit<GithubRepo, 'id' | 'created_at'>>;
      };
      crm_contacts: {
        Row: CrmContact;
        Insert: Omit<CrmContact, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CrmContact, 'id' | 'created_at' | 'updated_at'>>;
      };
      crm_deals: {
        Row: CrmDeal;
        Insert: Omit<CrmDeal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CrmDeal, 'id' | 'created_at' | 'updated_at'>>;
      };
      crm_tasks: {
        Row: CrmTask;
        Insert: Omit<CrmTask, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CrmTask, 'id' | 'created_at' | 'updated_at'>>;
      };
      crm_events: {
        Row: CrmEvent;
        Insert: Omit<CrmEvent, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CrmEvent, 'id' | 'created_at' | 'updated_at'>>;
      };
      resource_prompts: {
        Row: ResourcePrompt;
        Insert: Omit<ResourcePrompt, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ResourcePrompt, 'id' | 'created_at' | 'updated_at'>>;
      };
      resource_components: {
        Row: ResourceComponent;
        Insert: Omit<ResourceComponent, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ResourceComponent, 'id' | 'created_at' | 'updated_at'>>;
      };
      resource_ai_tools: {
        Row: ResourceAiTool;
        Insert: Omit<ResourceAiTool, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ResourceAiTool, 'id' | 'created_at' | 'updated_at'>>;
      };
      resource_tutorials: {
        Row: ResourceTutorial;
        Insert: Omit<ResourceTutorial, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ResourceTutorial, 'id' | 'created_at' | 'updated_at'>>;
      };
      notification_preferences: {
        Row: NotificationPreference;
        Insert: Omit<NotificationPreference, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<NotificationPreference, 'id' | 'created_at' | 'updated_at'>>;
      };
      notification_queue: {
        Row: NotificationQueue;
        Insert: Omit<NotificationQueue, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<NotificationQueue, 'id' | 'created_at' | 'updated_at'>>;
      };
      notification_history: {
        Row: NotificationHistory;
        Insert: Omit<NotificationHistory, 'id' | 'sent_at'>;
        Update: Partial<Omit<NotificationHistory, 'id' | 'sent_at'>>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface Company {
  id: string;
  name: string;
  website: string;
  industry?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface Keyword {
  id: string;
  company_id: string;
  keyword: string;
  location?: string;
  search_volume?: number;
  difficulty?: number;
  current_rank?: number;
  target_rank?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  last_checked?: string;
}

export interface Ranking {
  id: string;
  keyword_id: string;
  company_id: string;
  position: number;
  url?: string;
  checked_at: string;
  created_at: string;
}

export interface SEOAudit {
  id: string;
  company_id: string;
  url: string;
  audit_date: string;

  // Lighthouse Scores
  performance_score?: number;
  accessibility_score?: number;
  best_practices_score?: number;
  seo_score?: number;
  pwa_score?: number;

  // E-E-A-T Scores
  experience_score?: number;
  expertise_score?: number;
  authoritativeness_score?: number;
  trustworthiness_score?: number;

  // Technical SEO
  page_speed_mobile?: number;
  page_speed_desktop?: number;
  mobile_friendly?: boolean;
  https_enabled?: boolean;

  // Content Analysis
  title_tag?: string;
  meta_description?: string;
  h1_tags?: string[];
  word_count?: number;

  // Issues and Recommendations
  critical_issues?: AuditIssue[];
  warnings?: AuditIssue[];
  recommendations?: AuditIssue[];

  // Raw Data
  lighthouse_data?: Record<string, any>;
  crawl_data?: Record<string, any>;

  created_at: string;
  updated_at: string;
}

export interface AuditIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
}

export interface Project {
  id: string;
  company_id?: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on-hold';
  priority: 'low' | 'medium' | 'high';
  start_date?: string;
  end_date?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectNote {
  id: string;
  project_id: string;
  title: string;
  content?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface GithubRepo {
  id: string;
  project_id?: string;
  name: string;
  url: string;
  description?: string;
  language?: string;
  stars: number;
  forks: number;
  issues: number;
  last_updated?: string;
  created_at: string;
}

export interface CrmContact {
  id: string;
  company_id?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  location: string;
  status: 'active' | 'inactive' | 'lead';
  role?: string;
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface CrmDeal {
  id: string;
  company_id?: string;
  contact_id?: string;
  title: string;
  amount?: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability?: number;
  expected_close_date?: string;
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface CrmTask {
  id: string;
  company_id?: string;
  contact_id?: string;
  deal_id?: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  completed_at?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface CrmEvent {
  id: string;
  company_id?: string;
  contact_id?: string;
  deal_id?: string;
  title: string;
  description?: string;
  event_type: 'meeting' | 'call' | 'email' | 'deadline';
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface ResourcePrompt {
  id: string;
  title: string;
  description?: string;
  category?: string;
  prompt_text: string;
  tags?: string[];
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface ResourceComponent {
  id: string;
  title: string;
  description?: string;
  category?: string;
  code: string;
  language: string;
  framework?: string;
  tags?: string[];
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface ResourceAiTool {
  id: string;
  name: string;
  description?: string;
  category?: string;
  url?: string;
  api_endpoint?: string;
  documentation_url?: string;
  pricing?: string;
  tags?: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResourceTutorial {
  id: string;
  title: string;
  description?: string;
  category?: string;
  content?: string;
  url?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes?: number;
  tags?: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreference {
  id: string;
  email: string;
  enabled: boolean;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  types?: Record<string, any>;
  frequency?: Record<string, any>;
  quiet_hours?: Record<string, any>;
  unsubscribe_token?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationQueue {
  id: string;
  notification_type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'queued' | 'sent' | 'failed';
  recipient_email: string;
  subject?: string;
  payload: Record<string, any>;
  attempts: number;
  max_attempts: number;
  error_message?: string;
  scheduled_for?: string;
  sent_at?: string;
  last_attempt_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationHistory {
  id: string;
  notification_type: string;
  priority?: string;
  recipient_email: string;
  subject?: string;
  status: 'sent' | 'failed';
  message_id?: string;
  provider?: string;
  error_message?: string;
  sent_at: string;
}

// ============================================================================
// LEGACY/COMPATIBILITY TYPES
// ============================================================================

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
