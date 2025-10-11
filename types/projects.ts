// Project Management Type Definitions
// PRD #0004: Project Management System

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  contact_id?: string;
  start_date?: string;
  end_date?: string;
  deliverables?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  type: 'audit' | 'ranking' | 'report';
  schedule: string; // Cron expression
  config?: any;
  enabled: boolean;
  last_run?: string;
  next_run?: string;
  created_at: string;
}

export interface JobExecution {
  id: string;
  job_id: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  logs?: string;
  error?: string;
}

export interface Repository {
  id: string;
  name: string;
  full_name: string;
  html_url: string;
  default_branch: string;
  updated_at: string;
}

export interface Deployment {
  id: string;
  repo: string;
  branch: string;
  environment: string;
  status: string;
  created_at: string;
}
