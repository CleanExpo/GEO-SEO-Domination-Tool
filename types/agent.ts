// Autonomous SEO Agent Type Definitions
// PRD #0005: Autonomous SEO Agent Dashboard

export interface AgentStatus {
  status: 'running' | 'paused' | 'error';
  current_task?: string;
  last_run?: string;
  next_run?: string;
  stats: {
    audits_today: number;
    content_generated: number;
    issues_fixed: number;
    alerts_sent: number;
  };
}

export interface AgentSchedule {
  id: string;
  type: 'audit' | 'content' | 'technical' | 'rankings';
  frequency: 'daily' | 'weekly' | 'custom';
  time?: string;
  cron_expression?: string;
  enabled: boolean;
  companies?: string[];
  config?: any;
  created_at: string;
  updated_at: string;
}

export interface AgentAlert {
  id: string;
  type: 'ranking_drop' | 'performance_drop' | 'error' | 'opportunity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  company_id?: string;
  message: string;
  data?: any;
  acknowledged: boolean;
  acknowledged_at?: string;
  created_at: string;
}

export interface CompanyAutopilot {
  company_id: string;
  enabled: boolean;
  schedule: string;
  features: string[];
  last_run?: string;
  next_run?: string;
  stats?: any;
}

export interface AlertConfig {
  ranking_drop_threshold: number;
  performance_drop_threshold: number;
  channels: string[];
  frequency: 'immediate' | 'hourly' | 'daily_digest';
}
