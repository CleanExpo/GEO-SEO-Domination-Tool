-- CRM System Database Schema
-- Compatible with both SQLite and PostgreSQL

-- Contacts Table
CREATE TABLE IF NOT EXISTS crm_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company TEXT,
  location TEXT,
  status TEXT DEFAULT 'lead', -- 'active', 'inactive', 'lead'
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Deals Table
CREATE TABLE IF NOT EXISTS crm_deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  contact_id INTEGER NOT NULL,
  company TEXT,
  value REAL NOT NULL,
  stage TEXT DEFAULT 'prospect', -- 'prospect', 'qualification', 'proposal', 'negotiation', 'closed'
  probability INTEGER DEFAULT 0, -- 0-100
  close_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE CASCADE
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS crm_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'completed'
  assigned_to TEXT,
  contact_id INTEGER,
  deal_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (deal_id) REFERENCES crm_deals(id) ON DELETE SET NULL
);

-- Calendar Events Table
CREATE TABLE IF NOT EXISTS crm_calendar_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT NOT NULL,
  duration TEXT,
  type TEXT DEFAULT 'meeting', -- 'meeting', 'call', 'demo', 'follow-up'
  location TEXT,
  notes TEXT,
  contact_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE SET NULL
);

-- Event Attendees Table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS crm_event_attendees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES crm_calendar_events(id) ON DELETE CASCADE
);

-- Projects Table
CREATE TABLE IF NOT EXISTS crm_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning', -- 'planning', 'active', 'completed', 'on-hold'
  progress INTEGER DEFAULT 0, -- 0-100
  due_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Project Team Members (many-to-many relationship)
CREATE TABLE IF NOT EXISTS crm_project_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  member_name TEXT NOT NULL,
  role TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES crm_projects(id) ON DELETE CASCADE
);

-- GitHub Projects Table
CREATE TABLE IF NOT EXISTS crm_github_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT UNIQUE NOT NULL,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  open_prs INTEGER DEFAULT 0,
  language TEXT,
  last_updated DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Prompts Library Table
CREATE TABLE IF NOT EXISTS crm_prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT, -- JSON array stored as text
  favorite BOOLEAN DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS crm_support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  assigned_to TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Project Notes Table
CREATE TABLE IF NOT EXISTS crm_project_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT, -- JSON array stored as text
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES crm_projects(id) ON DELETE SET NULL
);

-- Indexes for better query performance
CREATE INDEX idx_contacts_email ON crm_contacts(email);
CREATE INDEX idx_contacts_status ON crm_contacts(status);
CREATE INDEX idx_deals_contact_id ON crm_deals(contact_id);
CREATE INDEX idx_deals_stage ON crm_deals(stage);
CREATE INDEX idx_tasks_status ON crm_tasks(status);
CREATE INDEX idx_tasks_due_date ON crm_tasks(due_date);
CREATE INDEX idx_calendar_events_date ON crm_calendar_events(event_date);
CREATE INDEX idx_projects_status ON crm_projects(status);
CREATE INDEX idx_prompts_category ON crm_prompts(category);
CREATE INDEX idx_prompts_favorite ON crm_prompts(favorite);
CREATE INDEX idx_project_notes_project_id ON crm_project_notes(project_id);
CREATE INDEX idx_project_notes_category ON crm_project_notes(category);
