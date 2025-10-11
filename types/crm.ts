// CRM System Type Definitions
// PRD #0002: CRM System (Contacts, Deals, Tasks, Portfolio)

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  title: string;
  value?: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'won' | 'lost';
  contact_id?: string;
  expected_close_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  contact_id?: string;
  deal_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  contact_id?: string;
  metrics?: Record<string, string>;
  images?: string[];
  featured: boolean;
  created_at: string;
}
