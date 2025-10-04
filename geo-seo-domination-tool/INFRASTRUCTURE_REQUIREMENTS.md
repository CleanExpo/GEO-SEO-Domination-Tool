# Infrastructure Requirements & Missing Components

## Executive Summary

This document outlines the missing backend infrastructure, API connections, and services required for the GEO-SEO Domination Tool to operate fully. While the frontend pages are complete, there are critical backend components and integrations that need to be implemented.

---

## 1. Missing API Route Endpoints

### CRM System APIs (Not Implemented)
All CRM frontend pages exist but lack backend API routes:

- **`/api/crm/contacts`** - CRUD operations for contacts
- **`/api/crm/deals`** - CRUD operations for deals
- **`/api/crm/tasks`** - CRUD operations for tasks
- **`/api/crm/calendar`** - CRUD operations for calendar events

### Projects APIs (Not Implemented)
- **`/api/projects`** - CRUD operations for projects
- **`/api/projects/github`** - GitHub integration (fetch repos, sync data)
- **`/api/projects/notes`** - Notes and documentation CRUD

### Resources APIs (Not Implemented)
- **`/api/resources/prompts`** - AI prompts library CRUD
- **`/api/resources/components`** - Code components library CRUD
- **`/api/resources/ai-tools`** - AI tools directory CRUD
- **`/api/resources/tutorials`** - Tutorials CRUD and progress tracking

### SEO Tools APIs (Partially Implemented)
#### Existing:
- ✅ `/api/companies` - Companies CRUD
- ✅ `/api/keywords` - Keywords CRUD
- ✅ `/api/rankings` - Rankings CRUD
- ✅ `/api/seo-audits` - SEO audits CRUD

#### Missing:
- **`/api/audits/run`** - Trigger new audit for a company
- **`/api/audits/schedule`** - Schedule recurring audits
- **`/api/keywords/track`** - Track keyword positions via SEMrush
- **`/api/rankings/update`** - Update rankings from external sources
- **`/api/competitors/analyze`** - Competitor analysis endpoint

### Support & Settings APIs (Not Implemented)
- **`/api/support/tickets`** - Support ticket CRUD
- **`/api/settings/profile`** - User profile settings
- **`/api/settings/notifications`** - Notification preferences

---

## 2. Database Configuration Issues

### Current State
- **Database Type**: Uses both Supabase (PostgreSQL) and SQLite
- **Problem**: The API routes reference Supabase, but schemas are defined for SQLite

### Issues to Resolve:
1. **Schema Mismatch**:
   - `crm_schema.sql` uses PostgreSQL syntax (UUID, gen_random_uuid())
   - Main `schema.sql` uses SQLite syntax (INTEGER PRIMARY KEY AUTOINCREMENT)

2. **Database Not Initialized**:
   - No initialization script to create tables
   - No seed data for development
   - Database path not configured

3. **Missing Database Client**:
   - `web-app/lib/supabase.ts` referenced but needs proper configuration
   - Need to decide: Supabase vs SQLite vs Postgres

### Required Actions:
- Create database initialization script
- Standardize on one database system
- Set up database migrations
- Create seed data for development

---

## 3. External API Integrations

### API Services Implemented (Code Exists)
Located in `src/services/api/`:

1. **SEMrush** (`semrush.ts`)
   - Domain overview
   - Organic keywords
   - Backlinks
   - Competitors analysis
   - Keyword difficulty

2. **Perplexity AI** (`perplexity.ts`)
   - AI search and research

3. **Claude AI** (`claude.ts`)
   - AI content generation

4. **Firecrawl** (`firecrawl.ts`)
   - Web scraping and content extraction

5. **Lighthouse** (`lighthouse.ts`)
   - Website performance audits

6. **Google Search** (`ai-search.ts`)
   - Custom search integration

### Required Environment Variables
From `.env.example`:
```bash
# Database
DATABASE_PATH=./database/geo-seo.db

# API Keys
SEMRUSH_API_KEY=your_semrush_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_google_custom_search_engine_id
FIRECRAWL_API_KEY=your_firecrawl_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key

# Supabase (if using)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Missing Integrations
1. **Google Business Profile API**
   - For GBP rankings and management
   - Required for local pack tracking

2. **GitHub API**
   - For GitHub projects integration
   - Fetching repos, stars, PRs

3. **Email Service**
   - For notifications and reports
   - Consider: SendGrid, Resend, or AWS SES

4. **OAuth Provider**
   - User authentication (if needed)
   - Consider: NextAuth.js

---

## 4. Missing Backend Services

### Service Layer Structure
Currently frontend calls API routes directly. Need service layer:

```
src/services/
├── api/              # External API clients (EXISTS)
├── database/         # Database operations (MISSING)
├── audit/           # Audit orchestration (MISSING)
├── tracking/        # Ranking tracking (MISSING)
└── notifications/   # Email/alerts (MISSING)
```

### Required Services:

#### 4.1 Database Service Layer
**File**: `src/services/database/db.ts`
- Connection management
- Query builders
- Transaction handling

#### 4.2 Audit Orchestration Service
**File**: `src/services/audit/audit-runner.ts`
- Coordinate Lighthouse audits
- E-E-A-T scoring
- Competitor analysis
- Report generation

#### 4.3 Ranking Tracker Service
**File**: `src/services/tracking/ranking-tracker.ts`
- Schedule keyword position checks
- Call SEMrush/Google APIs
- Store historical data
- Trend analysis

#### 4.4 Notification Service
**File**: `src/services/notifications/email-service.ts`
- Weekly reports
- Ranking alerts
- System notifications

#### 4.5 Background Jobs Service
**File**: `src/services/jobs/scheduler.ts`
- Cron jobs for scheduled audits
- Ranking updates
- Report generation
- Consider: node-cron, Bull/BullMQ

---

## 5. Missing Docker Configuration

### Current State
- No Dockerfile
- No docker-compose.yml
- No containerization

### Required Containers:

#### 5.1 Development Environment
**File**: `docker-compose.dev.yml`
```yaml
services:
  web-app:
    build: ./web-app
    ports:
      - "3000:3000"
    volumes:
      - ./web-app:/app
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/geo_seo

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=geo_seo
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    # For background job queues

volumes:
  postgres_data:
```

#### 5.2 Production Environment
**File**: `docker-compose.prod.yml`
- Production-ready configuration
- Health checks
- Resource limits
- Restart policies

---

## 6. API Integration Architecture

### Missing API Middleware Layer

**File**: `web-app/lib/api-middleware.ts`
```typescript
// Rate limiting
// Error handling
// Request logging
// Response caching
```

### Missing API Client Wrapper

**File**: `web-app/lib/api-client.ts`
```typescript
// Centralized API client for frontend
// Handles authentication
// Request/response interceptors
// Error handling
```

---

## 7. Implementation Priority

### Phase 1: Core Infrastructure (Critical)
1. **Database Setup**
   - Choose database system (recommend PostgreSQL via Supabase)
   - Initialize schema
   - Create migration system
   - Add seed data

2. **API Routes - CRM**
   - Contacts CRUD
   - Deals CRUD
   - Tasks CRUD
   - Calendar CRUD

3. **Environment Configuration**
   - Set up .env file
   - Configure database connection
   - Test basic API connectivity

### Phase 2: SEO Tools Integration (High Priority)
1. **SEMrush Integration**
   - Connect API service to routes
   - Implement keyword tracking
   - Set up competitor analysis

2. **Audit System**
   - Lighthouse integration
   - Audit runner service
   - Report generation

3. **Ranking Tracker**
   - Scheduled checks
   - Historical data storage
   - Trend visualization

### Phase 3: Projects & Resources (Medium Priority)
1. **Projects APIs**
   - Projects CRUD
   - GitHub integration
   - Notes system

2. **Resources APIs**
   - Prompts library
   - Components library
   - AI tools directory
   - Tutorials system

### Phase 4: Advanced Features (Low Priority)
1. **Background Jobs**
   - Scheduled audits
   - Automated reports
   - Ranking updates

2. **Notifications**
   - Email service
   - Alert system
   - Weekly reports

3. **Docker Deployment**
   - Containerization
   - Production setup
   - CI/CD pipeline

---

## 8. Quick Start Implementation Guide

### Step 1: Database Setup (30 minutes)
```bash
# Install dependencies
npm install better-sqlite3
# or for PostgreSQL
npm install pg

# Create initialization script
node scripts/init-database.js

# Run migrations
node scripts/migrate.js
```

### Step 2: API Routes (2-3 hours per resource)
```typescript
// Example: Create /api/crm/contacts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const contacts = await db.query('SELECT * FROM crm_contacts');
  return NextResponse.json({ contacts });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Validate and insert
  return NextResponse.json({ success: true });
}
```

### Step 3: Connect Frontend to Backend (1 hour)
```typescript
// In pages, replace useState with actual API calls
const [contacts, setContacts] = useState<Contact[]>([]);

useEffect(() => {
  fetch('/api/crm/contacts')
    .then(res => res.json())
    .then(data => setContacts(data.contacts));
}, []);
```

### Step 4: External API Integration (2-3 hours per service)
```typescript
// Create wrapper in /api/integrations/semrush/route.ts
import { SEMrushService } from '@/services/api/semrush';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');

  const semrush = new SEMrushService(process.env.SEMRUSH_API_KEY!);
  const keywords = await semrush.getOrganicKeywords(domain);

  return NextResponse.json({ keywords });
}
```

---

## 9. Estimated Time to Complete

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Database + Core CRM APIs | 8-12 hours |
| Phase 2 | SEO Tools Integration | 12-16 hours |
| Phase 3 | Projects & Resources APIs | 8-10 hours |
| Phase 4 | Advanced Features | 16-20 hours |
| **Total** | **Full Implementation** | **44-58 hours** |

---

## 10. Immediate Next Steps

1. **Create database initialization script**
   - File: `scripts/init-database.js`
   - Initialize all tables from schemas

2. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Fill in API keys (at least for development)

3. **Implement CRM API routes** (highest priority)
   - Start with contacts
   - Then deals, tasks, calendar

4. **Connect one frontend page to backend**
   - Test with Contacts page
   - Verify full CRUD cycle

5. **Document API endpoints**
   - Create API documentation
   - Include request/response examples

---

## 11. Decision Points

### Database Choice
- **Option A**: Supabase (PostgreSQL) - Recommended
  - Pros: Managed, real-time, built-in auth
  - Cons: External dependency, requires internet

- **Option B**: SQLite
  - Pros: Simple, file-based, no setup
  - Cons: Limited concurrency, no built-in auth

**Recommendation**: Use Supabase for production, SQLite for local development

### Background Jobs
- **Option A**: node-cron (simple scheduled tasks)
- **Option B**: Bull/BullMQ (robust queue system with Redis)

**Recommendation**: Start with node-cron, migrate to Bull if needed

### Deployment
- **Option A**: Vercel (easy Next.js deployment)
- **Option B**: Docker + VPS (full control)
- **Option C**: AWS/GCP (scalable cloud)

**Recommendation**: Vercel for MVP, Docker for self-hosting

---

## 12. Summary of Missing Elements

### Critical Missing Components:
1. ❌ CRM API routes (contacts, deals, tasks, calendar)
2. ❌ Projects API routes (projects, github, notes)
3. ❌ Resources API routes (prompts, components, ai-tools, tutorials)
4. ❌ Database initialization and migrations
5. ❌ Service layer for business logic
6. ❌ Background job scheduler
7. ❌ Docker configuration
8. ❌ API integration middleware
9. ❌ Database client configuration
10. ❌ Notification/email service

### Partially Implemented:
- ⚠️ SEO Tools APIs (companies, keywords, rankings, audits exist)
- ⚠️ External API clients (code exists but not integrated)
- ⚠️ Database schemas (defined but not initialized)

### Complete:
- ✅ All frontend pages and UI components
- ✅ Navigation structure
- ✅ TypeScript interfaces and types
- ✅ API client service code (in src/services/api)

---

**Last Updated**: 2025-10-02
**Status**: Ready for implementation
