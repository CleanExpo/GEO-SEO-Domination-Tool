# PRD #0003: Resources Library (AI Tools, Components, Prompts)

**Date:** 2025-01-11
**Status:** Draft
**Priority:** High
**Identified By:** Tom All Autonomous Engine

## Problem Statement

Tom All identified **5 critical missing API endpoints** for Resources functionality:
- `/api/resources/ai-tools`
- `/api/resources/components`
- `/api/resources/prompts` (2 instances)
- `/api/resources/prompts/[id]`

UI components are calling these endpoints but they don't exist, causing **broken Resources features**.

## Background

The GEO-SEO Domination Tool includes a Resources Library to help users:
- Discover and use AI tools for SEO
- Access reusable UI components
- Browse and save proven SEO prompts
- Share resources with team members

**Database Schema:** Already exists in `database/resources-schema.sql`

**UI Components:** Already built in `app/resources/*` pages

**Missing:** API routes to connect UI to database

## Goals

### Primary Goals
1. Create fully functional Resources API endpoints
2. Enable browsing/searching AI tools catalog
3. Enable accessing reusable components
4. Enable prompt library management (CRUD)
5. Enable categorization and filtering

### Success Metrics
- All Resources API endpoints return 200/201 (not 404)
- UI components successfully fetch/create/update resources
- Users can search and filter resources
- No RLS errors (use admin client)

## User Stories

### AI Tools Discovery
- **As a user**, I want to browse AI tools for SEO so I can discover new tools
- **As a user**, I want to filter tools by category (content, technical, local, etc.)
- **As a user**, I want to see tool descriptions, pricing, and use cases
- **As a user**, I want to save favorite tools to my list

### Component Library
- **As a user**, I want to browse reusable UI components
- **As a user**, I want to see component previews and code
- **As a user**, I want to copy component code to use in my projects
- **As a user**, I want to filter components by type (forms, cards, charts, etc.)

### Prompt Library
- **As a user**, I want to browse proven SEO prompts
- **As a user**, I want to create and save my own prompts
- **As a user**, I want to categorize prompts (content, technical, local, etc.)
- **As a user**, I want to edit and update prompts
- **As a user**, I want to delete outdated prompts
- **As a user**, I want to search prompts by keyword

## Technical Specification

### API Endpoints Required

#### 1. AI Tools API (`/api/resources/ai-tools`)

**GET /api/resources/ai-tools**
- Returns: List of AI tools
- Query params: `?category=`, `?search=`, `?limit=`
- Response: `{ tools: AITool[], total: number }`

**POST /api/resources/ai-tools** (Admin only)
- Creates: New AI tool entry
- Body: `{ name, description, category, url, pricing, use_cases }`
- Response: `{ tool: AITool }`

**GET /api/resources/ai-tools/[id]**
- Returns: Single AI tool details
- Response: `{ tool: AITool }`

#### 2. Components API (`/api/resources/components`)

**GET /api/resources/components**
- Returns: List of reusable components
- Query params: `?type=`, `?search=`, `?limit=`
- Response: `{ components: Component[], total: number }`

**POST /api/resources/components** (Admin only)
- Creates: New component
- Body: `{ name, description, type, code, preview_url, dependencies }`
- Response: `{ component: Component }`

**GET /api/resources/components/[id]**
- Returns: Single component with code
- Response: `{ component: Component }`

#### 3. Prompts API (`/api/resources/prompts`)

**GET /api/resources/prompts**
- Returns: List of prompts
- Query params: `?category=`, `?search=`, `?user_id=`, `?limit=`
- Response: `{ prompts: Prompt[], total: number }`

**POST /api/resources/prompts**
- Creates: New prompt
- Body: `{ title, content, category, tags, is_public }`
- Response: `{ prompt: Prompt }`

**GET /api/resources/prompts/[id]**
- Returns: Single prompt by ID
- Response: `{ prompt: Prompt }`

**PUT /api/resources/prompts/[id]**
- Updates: Prompt (user can only edit their own)
- Body: Partial prompt object
- Response: `{ prompt: Prompt }`

**DELETE /api/resources/prompts/[id]**
- Deletes: Prompt (user can only delete their own)
- Response: `{ success: boolean }`

### Database Schema

**From `database/resources-schema.sql`:**

```sql
-- AI Tools table
CREATE TABLE resource_ai_tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'content', 'technical', 'local', 'analytics'
  url VARCHAR(500),
  pricing VARCHAR(100), -- 'free', 'freemium', 'paid'
  use_cases JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Components table
CREATE TABLE resource_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(100), -- 'form', 'card', 'chart', 'table', 'layout'
  code TEXT, -- Component source code
  preview_url VARCHAR(500),
  dependencies JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Prompts table
CREATE TABLE resource_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- Can be NULL for system prompts
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100), -- 'content', 'technical', 'local', 'general'
  tags JSONB,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### TypeScript Types

```typescript
// types/resources.ts
export interface AITool {
  id: string;
  name: string;
  description?: string;
  category?: 'content' | 'technical' | 'local' | 'analytics';
  url?: string;
  pricing?: 'free' | 'freemium' | 'paid';
  use_cases?: string[];
  created_at: string;
}

export interface Component {
  id: string;
  name: string;
  description?: string;
  type?: 'form' | 'card' | 'chart' | 'table' | 'layout';
  code?: string;
  preview_url?: string;
  dependencies?: string[];
  created_at: string;
}

export interface Prompt {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  category?: 'content' | 'technical' | 'local' | 'general';
  tags?: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
```

### Error Handling

All endpoints must:
- Use `createAdminClient()` (avoid RLS issues)
- Validate input with Zod schemas
- Return proper HTTP status codes
- Handle permission checks (user can only edit/delete their own prompts)
- Log errors properly

### Permissions

**AI Tools & Components:**
- GET: All users can read
- POST/PUT/DELETE: Admin only

**Prompts:**
- GET: Users see public prompts + their own private prompts
- POST: Any authenticated user
- PUT/DELETE: Only prompt owner

## User Journeys

### Journey 1: Discover AI Tools
1. User navigates to `/resources/ai-tools`
2. Page loads → `GET /api/resources/ai-tools`
3. User filters by category "content"
4. Results update → `GET /api/resources/ai-tools?category=content`
5. User clicks tool to see details
6. Tool details display with description, pricing, use cases

### Journey 2: Browse Components
1. User navigates to `/resources/components`
2. Page loads → `GET /api/resources/components`
3. User searches for "form"
4. Results filter → `GET /api/resources/components?search=form`
5. User clicks component to view code
6. Code displays with syntax highlighting
7. User copies code to clipboard

### Journey 3: Manage Prompts
1. User navigates to `/resources/prompts`
2. Page loads → `GET /api/resources/prompts?user_id=[current_user]`
3. User clicks "Create Prompt"
4. Fills form (title, content, category, tags, public/private)
5. Submits → `POST /api/resources/prompts`
6. Prompt appears in list
7. User edits prompt → `PUT /api/resources/prompts/[id]`
8. Changes saved
9. User deletes old prompt → `DELETE /api/resources/prompts/[id]`

### Journey 4: Search Public Prompts
1. User navigates to `/resources/prompts`
2. Switches to "Public Prompts" tab
3. Searches for "local SEO"
4. Results display → `GET /api/resources/prompts?search=local%20SEO&is_public=true`
5. User views prompt details
6. User copies prompt to use

## Acceptance Criteria

- [ ] All 3 Resources API route files created (ai-tools, components, prompts)
- [ ] All endpoints return proper status codes (not 404)
- [ ] All endpoints use `createAdminClient()` (no RLS errors)
- [ ] Input validation with Zod schemas
- [ ] TypeScript types defined in `types/resources.ts`
- [ ] Permission checks implemented (prompts ownership)
- [ ] Search/filter functionality working
- [ ] All user journeys working end-to-end
- [ ] Tom Genie validation passes (zero critical issues)

## Seed Data

Include seed data for AI Tools and Components:

**AI Tools:**
- Claude (Anthropic) - Content generation
- DeepSeek - Local SEO analysis
- Perplexity - Research with citations
- Firecrawl - Web scraping
- Lighthouse - Performance audits

**Components:**
- SEO Audit Form
- Keyword Research Table
- Ranking Chart
- Company Card
- Analytics Dashboard

## Out of Scope

- User ratings/reviews for resources (future)
- Resource usage analytics (future)
- Sharing prompts with specific users (future)
- Version control for prompts (future)

## Dependencies

- Database schema exists (`database/resources-schema.sql`)
- UI components exist (`app/resources/*`)
- Supabase admin client available

## Risks & Mitigations

**Risk:** RLS errors
**Mitigation:** Use `createAdminClient()` consistently

**Risk:** Users deleting other users' prompts
**Mitigation:** Check ownership before DELETE/PUT

**Risk:** Large code fields causing performance issues
**Mitigation:** Limit code field size, paginate results

## Timeline

- **Implementation:** 3-4 hours
- **Testing:** 1 hour
- **Seed data creation:** 30 minutes

**Total:** 4-5 hours

## Success Criteria

1. ✅ All Resources endpoints functional
2. ✅ Search and filtering working
3. ✅ Permission checks enforced
4. ✅ All user journeys complete
5. ✅ Tom Genie validation passes
