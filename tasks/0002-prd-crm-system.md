# PRD #0002: CRM System (Contacts, Deals, Tasks, Portfolio)

**Date:** 2025-01-11
**Status:** Draft
**Priority:** Critical
**Identified By:** Tom All Autonomous Engine

## Problem Statement

Tom All identified **9 critical missing API endpoints** for CRM functionality:
- `/api/crm/contacts` (2 instances)
- `/api/crm/deals`
- `/api/crm/tasks`
- `/api/crm/portfolio` (2 instances)

UI components are calling these endpoints but they don't exist, causing **broken CRM features**.

## Background

The GEO-SEO Domination Tool needs a complete CRM system to manage:
- Client contacts and organizations
- Sales pipeline and deals
- Task management for client work
- Portfolio showcase for client results

**Database Schema:** Already exists in `database/crm_schema.sql`

**UI Components:** Already built in `app/crm/*` pages

**Missing:** API routes to connect UI to database

## Goals

### Primary Goals
1. Create fully functional CRM API endpoints
2. Enable contact management (CRUD operations)
3. Enable deal tracking through sales pipeline
4. Enable task management for client deliverables
5. Enable portfolio showcase of client results

### Success Metrics
- All CRM API endpoints return 200/201 (not 404)
- UI components successfully fetch/create/update data
- No RLS errors (use admin client)
- All user journeys working end-to-end

## User Stories

### Contact Management
- **As a user**, I want to view all contacts so I can see my client list
- **As a user**, I want to create a new contact so I can add clients
- **As a user**, I want to update contact details so I can keep info current
- **As a user**, I want to delete contacts so I can remove inactive clients
- **As a user**, I want to search contacts by name/email/company

### Deal Management
- **As a user**, I want to view all deals so I can see my sales pipeline
- **As a user**, I want to create new deals so I can track opportunities
- **As a user**, I want to move deals between stages (Lead → Qualified → Proposal → Won/Lost)
- **As a user**, I want to associate deals with contacts
- **As a user**, I want to see deal value and expected close date

### Task Management
- **As a user**, I want to view all tasks so I can see what needs to be done
- **As a user**, I want to create tasks linked to contacts/deals
- **As a user**, I want to mark tasks as complete
- **As a user**, I want to see task due dates and priorities
- **As a user**, I want to filter tasks by status/priority/assignee

### Portfolio Management
- **As a user**, I want to showcase successful client projects
- **As a user**, I want to link portfolio items to contacts
- **As a user**, I want to include metrics (traffic increase, ranking improvements)
- **As a user**, I want to display before/after screenshots

## Technical Specification

### API Endpoints Required

#### 1. Contacts API (`/api/crm/contacts`)

**GET /api/crm/contacts**
- Returns: List of all contacts
- Query params: `?search=`, `?limit=`, `?offset=`
- Response: `{ contacts: Contact[], total: number }`

**POST /api/crm/contacts**
- Creates: New contact
- Body: `{ name, email, phone, company, notes }`
- Response: `{ contact: Contact }`

**GET /api/crm/contacts/[id]**
- Returns: Single contact by ID
- Response: `{ contact: Contact }`

**PUT /api/crm/contacts/[id]**
- Updates: Contact details
- Body: Partial contact object
- Response: `{ contact: Contact }`

**DELETE /api/crm/contacts/[id]**
- Deletes: Contact
- Response: `{ success: boolean }`

#### 2. Deals API (`/api/crm/deals`)

**GET /api/crm/deals**
- Returns: List of all deals
- Query params: `?stage=`, `?contact_id=`
- Response: `{ deals: Deal[], total: number }`

**POST /api/crm/deals**
- Creates: New deal
- Body: `{ title, value, stage, contact_id, expected_close_date }`
- Response: `{ deal: Deal }`

**GET /api/crm/deals/[id]**
- Returns: Single deal by ID
- Response: `{ deal: Deal }`

**PUT /api/crm/deals/[id]**
- Updates: Deal (move stages, update value, etc.)
- Body: Partial deal object
- Response: `{ deal: Deal }`

**DELETE /api/crm/deals/[id]**
- Deletes: Deal
- Response: `{ success: boolean }`

#### 3. Tasks API (`/api/crm/tasks`)

**GET /api/crm/tasks**
- Returns: List of all tasks
- Query params: `?status=`, `?contact_id=`, `?deal_id=`
- Response: `{ tasks: Task[], total: number }`

**POST /api/crm/tasks**
- Creates: New task
- Body: `{ title, description, due_date, priority, status, contact_id, deal_id }`
- Response: `{ task: Task }`

**GET /api/crm/tasks/[id]**
- Returns: Single task by ID
- Response: `{ task: Task }`

**PUT /api/crm/tasks/[id]**
- Updates: Task (mark complete, change due date, etc.)
- Body: Partial task object
- Response: `{ task: Task }`

**DELETE /api/crm/tasks/[id]**
- Deletes: Task
- Response: `{ success: boolean }`

#### 4. Portfolio API (`/api/crm/portfolio`)

**GET /api/crm/portfolio**
- Returns: List of portfolio items
- Query params: `?contact_id=`, `?featured=`
- Response: `{ items: PortfolioItem[], total: number }`

**POST /api/crm/portfolio**
- Creates: New portfolio item
- Body: `{ title, description, contact_id, metrics, images, featured }`
- Response: `{ item: PortfolioItem }`

**GET /api/crm/portfolio/[id]**
- Returns: Single portfolio item
- Response: `{ item: PortfolioItem }`

**PUT /api/crm/portfolio/[id]**
- Updates: Portfolio item
- Body: Partial portfolio object
- Response: `{ item: PortfolioItem }`

**DELETE /api/crm/portfolio/[id]**
- Deletes: Portfolio item
- Response: `{ success: boolean }`

### Database Schema

**Already exists in `database/crm_schema.sql`:**

```sql
-- Contacts table
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Deals table
CREATE TABLE crm_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  value DECIMAL(10,2),
  stage VARCHAR(50), -- 'lead', 'qualified', 'proposal', 'won', 'lost'
  contact_id UUID REFERENCES crm_contacts(id),
  expected_close_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE crm_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  priority VARCHAR(20), -- 'low', 'medium', 'high'
  status VARCHAR(20), -- 'pending', 'in_progress', 'completed'
  contact_id UUID REFERENCES crm_contacts(id),
  deal_id UUID REFERENCES crm_deals(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Portfolio table
CREATE TABLE crm_portfolio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  contact_id UUID REFERENCES crm_contacts(id),
  metrics JSONB, -- { "traffic_increase": "150%", "ranking_improvement": "+25 positions" }
  images JSONB, -- ["before.jpg", "after.jpg"]
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### TypeScript Types

```typescript
// types/crm.ts
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
```

### Error Handling

All endpoints must:
- Use `createAdminClient()` (not createClient - avoid RLS issues)
- Validate input with Zod schemas
- Return proper HTTP status codes (200, 201, 400, 404, 500)
- Include error messages in response body
- Log errors to console.error (not console.log)

### Authentication

- All endpoints require authenticated user
- Use Supabase auth to get user ID
- Link CRM data to user's organization

## User Journeys

### Journey 1: Create and Manage Contact
1. User navigates to `/crm/contacts`
2. Clicks "Add Contact" button
3. Fills form (name, email, phone, company)
4. Submits → `POST /api/crm/contacts`
5. Contact appears in list → `GET /api/crm/contacts`
6. User clicks contact to edit
7. Updates details → `PUT /api/crm/contacts/[id]`
8. Changes saved and displayed

### Journey 2: Track Deal Through Pipeline
1. User navigates to `/crm/deals`
2. Clicks "New Deal" button
3. Fills form (title, value, stage, contact, close date)
4. Submits → `POST /api/crm/deals`
5. Deal appears in pipeline view
6. User drags deal to "Qualified" stage
7. Updates → `PUT /api/crm/deals/[id]` with `stage: 'qualified'`
8. Deal moves to new column

### Journey 3: Manage Tasks
1. User navigates to `/crm/tasks`
2. Views tasks filtered by "pending"
3. Creates task linked to contact/deal
4. Sets due date and priority
5. Submits → `POST /api/crm/tasks`
6. Task appears in list
7. Marks task complete → `PUT /api/crm/tasks/[id]` with `status: 'completed'`
8. Task moves to completed section

### Journey 4: Showcase Portfolio
1. User navigates to `/crm/portfolio`
2. Clicks "Add Portfolio Item"
3. Fills details (title, description, contact, metrics, images)
4. Marks as featured
5. Submits → `POST /api/crm/portfolio`
6. Portfolio item displays on page
7. Can view public portfolio at `/portfolio` page

## Acceptance Criteria

- [ ] All 4 CRM API route files created
- [ ] All endpoints return proper status codes (not 404)
- [ ] All endpoints use `createAdminClient()` (no RLS errors)
- [ ] Input validation with Zod schemas
- [ ] TypeScript types defined in `types/crm.ts`
- [ ] Error handling for all edge cases
- [ ] All user journeys working end-to-end
- [ ] Tom Genie validation passes (zero critical issues)

## Out of Scope

- Email integration (future feature)
- Calendar integration (future feature)
- Advanced reporting/analytics (future feature)
- Import/export contacts (future feature)

## Dependencies

- Database schema already exists (`database/crm_schema.sql`)
- UI components already exist (`app/crm/*`)
- Supabase admin client (`lib/auth/supabase-admin.ts`)

## Risks & Mitigations

**Risk:** RLS errors like previous Run Audit bug
**Mitigation:** Use `createAdminClient()` in all endpoints

**Risk:** Type mismatches between DB and frontend
**Mitigation:** Define TypeScript types that match schema exactly

**Risk:** Missing validation allows bad data
**Mitigation:** Use Zod schemas for all input validation

## Timeline

- **Implementation:** 4-6 hours (autonomous with Tom All)
- **Testing:** 1 hour
- **Documentation:** 30 minutes

**Total:** 5-7 hours

## Success Criteria

1. ✅ All CRM endpoints functional (200/201 responses)
2. ✅ Zero RLS errors (using admin client)
3. ✅ All user journeys complete successfully
4. ✅ Tom Genie validation passes
5. ✅ Production ready for deployment
