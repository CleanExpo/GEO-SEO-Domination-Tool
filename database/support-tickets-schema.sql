-- Support Tickets Schema
-- For tracking customer support requests and their lifecycle

CREATE TABLE IF NOT EXISTS support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_number VARCHAR(20) UNIQUE NOT NULL, -- Format: TICKET-YYYYMMDD-XXXX
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'waiting_response', 'resolved', 'closed')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
  category VARCHAR(100), -- e.g., 'technical', 'billing', 'general', 'feature_request'
  assigned_to VARCHAR(255), -- Email or name of assigned support agent
  company_id INTEGER, -- Optional: link to company if user is authenticated
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

-- Support ticket responses/comments
CREATE TABLE IF NOT EXISTS support_ticket_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  responder_name VARCHAR(255) NOT NULL,
  responder_email VARCHAR(255) NOT NULL,
  is_staff BOOLEAN DEFAULT 0, -- 1 if response from support team, 0 if from customer
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);

-- Support ticket attachments (optional, for future enhancement)
CREATE TABLE IF NOT EXISTS support_ticket_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER, -- Size in bytes
  file_type VARCHAR(100), -- MIME type
  uploaded_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON support_tickets(email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_number ON support_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_ticket_responses_ticket_id ON support_ticket_responses(ticket_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_support_tickets_timestamp
AFTER UPDATE ON support_tickets
FOR EACH ROW
BEGIN
  UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
