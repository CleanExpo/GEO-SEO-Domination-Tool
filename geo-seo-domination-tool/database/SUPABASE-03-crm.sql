-- ========================================
-- FILE 3 OF 8: CRM Tables
-- Purpose: Create CRM system tables
-- Dependencies: auth.users (Supabase built-in)
-- Tables Created: crm_contacts, crm_deals, crm_tasks, crm_calendar_events, crm_event_attendees, crm_support_tickets
-- Run this AFTER SUPABASE-02-core-seo.sql completes
-- ========================================

-- 1. CRM_CONTACTS TABLE
-- Used by: /api/crm/contacts, /app/crm/contacts
-- Purpose: Store contact/lead information
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company TEXT,
  location TEXT,
  status TEXT DEFAULT 'lead' CHECK (status IN ('active', 'inactive', 'lead')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_user ON crm_contacts(user_id);

COMMENT ON TABLE crm_contacts IS 'CRM contacts and leads';

-- 2. CRM_DEALS TABLE (References crm_contacts)
-- Used by: /api/crm/deals, /app/crm/deals
-- Purpose: Track sales deals and opportunities
CREATE TABLE IF NOT EXISTS crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  company TEXT,
  value DECIMAL(10,2) NOT NULL,
  stage TEXT DEFAULT 'prospect' CHECK (stage IN ('prospect', 'qualification', 'proposal', 'negotiation', 'closed')),
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  close_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crm_deals_contact_id ON crm_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(stage);
CREATE INDEX IF NOT EXISTS idx_crm_deals_user ON crm_deals(user_id);

COMMENT ON TABLE crm_deals IS 'Sales deals and opportunities';

-- 3. CRM_TASKS TABLE (References crm_contacts and crm_deals)
-- Used by: /api/crm/tasks, /app/crm/tasks
-- Purpose: Task management for CRM activities
CREATE TABLE IF NOT EXISTS crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
  assigned_to TEXT,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_status ON crm_tasks(status);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due_date ON crm_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_user ON crm_tasks(user_id);

COMMENT ON TABLE crm_tasks IS 'CRM tasks and activities';

-- 4. CRM_CALENDAR_EVENTS TABLE (References crm_contacts)
-- Used by: /api/crm/calendar, /app/crm/calendar
-- Purpose: Store calendar events and meetings
-- Note: Also aliased as 'crm_events' in some API routes
CREATE TABLE IF NOT EXISTS crm_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT NOT NULL,
  duration TEXT,
  type TEXT DEFAULT 'meeting' CHECK (type IN ('meeting', 'call', 'demo', 'follow-up')),
  location TEXT,
  notes TEXT,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crm_calendar_events_date ON crm_calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_crm_calendar_events_user ON crm_calendar_events(user_id);

COMMENT ON TABLE crm_calendar_events IS 'Calendar events and meetings (aliased as crm_events)';

-- Create view alias for backward compatibility with API routes
CREATE OR REPLACE VIEW crm_events AS SELECT * FROM crm_calendar_events;

COMMENT ON VIEW crm_events IS 'View alias for crm_calendar_events - used by API routes';

-- 5. CRM_EVENT_ATTENDEES TABLE (References crm_calendar_events)
-- Used by: /api/crm/calendar
-- Purpose: Track event attendees (many-to-many)
CREATE TABLE IF NOT EXISTS crm_event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES crm_calendar_events(id) ON DELETE CASCADE,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crm_event_attendees_event ON crm_event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_crm_event_attendees_user ON crm_event_attendees(user_id);

COMMENT ON TABLE crm_event_attendees IS 'Event attendees (many-to-many relationship)';

-- 6. CRM_SUPPORT_TICKETS TABLE
-- Used by: /app/support
-- Purpose: Support ticket management
CREATE TABLE IF NOT EXISTS crm_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crm_support_tickets_status ON crm_support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_crm_support_tickets_user ON crm_support_tickets(user_id);

COMMENT ON TABLE crm_support_tickets IS 'Support tickets and help requests';

-- Verification: Check tables were created
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('crm_contacts', 'crm_deals', 'crm_tasks', 'crm_calendar_events', 'crm_event_attendees', 'crm_support_tickets')
ORDER BY table_name;

-- Expected output: 6 rows showing all CRM tables

-- Verify view created
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'crm_events';

-- Expected output: 1 row showing crm_events as VIEW
