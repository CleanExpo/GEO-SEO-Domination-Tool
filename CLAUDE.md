# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GEO-SEO Domination Tool is a comprehensive SEO and local ranking analysis platform deployed as a **Next.js web application** with production hosting on Vercel.

**CRITICAL DEPLOYMENT NOTE**:

- **ALL Next.js files are in the ROOT directory** (`app/`, `components/`, `lib/`, `next.config.js`)
- **DO NOT create or work in a `web-app/` subdirectory** - this causes dual Vercel project deployments
- The Electron desktop app (`src/`) exists for local development only
- Production deployments use the Vercel project: `geo-seo-domination-tool` (Project ID: `prj_JxdLiaHoWpnXWEjEhXXpmo0eFBgQ`)

**Current Branch**: `new-life` - Next development phase with build assistant tools integration

**Core Features**:
- Lighthouse Website Audits & E-E-A-T Score Calculation
- Local Pack Tracking & Share of Local Voice (SoLV)
- AI Search Optimization (7 proven strategies, 120%-20,000% growth)
- Multi-platform AI Visibility Tracking (Claude, ChatGPT, Google AI)
- Campaign Management with topic clustering & buyer journey mapping

## Development Commands

### Electron Desktop App
```bash
npm run dev              # Start Vite dev server
npm run build            # Build TypeScript and Vite bundle
npm run build:win        # Build Windows installer with Electron Builder
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
```

### Next.js Web App (Root Directory)
```bash
npm run dev              # Start Next.js dev server (port 3000)
npm run build            # Build for production (runs TypeScript check first)
npm start                # Start production server
npm run lint             # Run Next.js linter
```

### Database Management
```bash
npm run db:init          # Initialize database with all schemas
npm run db:init:verify   # Initialize and verify tables
npm run db:test          # Test database connection
npm run db:migrate       # Run pending migrations
npm run db:migrate:down  # Rollback last migration
npm run db:migrate:status # Check migration status
npm run db:migrate:create # Create new migration file
```

## Architecture

### Dual Database System

The application uses **auto-detecting database architecture**:
- **Development**: SQLite (auto-created at `./data/geo-seo.db`)
- **Production**: PostgreSQL/Supabase (via `DATABASE_URL` or `POSTGRES_URL`)

**Detection Logic** (in `database/init.ts`):
```typescript
// PostgreSQL if DATABASE_URL exists, otherwise SQLite
const isDatabaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
```

**Key Principle**: Same code works in both environments. The database client at `database/init.ts` abstracts SQLite vs PostgreSQL differences.

### Schema Organization

Schemas are modular and loaded sequentially by `scripts/init-database.js`:

```
database/
├── schema.sql                    # Core SEO (companies, keywords, rankings, audits)
├── ai-search-schema.sql          # AI search strategies & campaigns
├── project-hub-schema.sql        # Project management
├── integrations-schema.sql       # Third-party integrations (webhooks, OAuth)
├── project-generation-schema.sql # Project scaffolding templates
├── crm_schema.sql               # CRM (contacts, deals, tasks, calendar)
├── resources-schema.sql         # Resource library (prompts, components)
├── job-scheduler-schema.sql     # Scheduled job tracking
└── notifications-schema.sql     # Email notification system
```

### Next.js App Structure (Root Directory)

The application uses **Next.js 15 App Router** at ROOT level:

```text
<root>/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (companies, keywords, rankings, audits)
│   ├── dashboard/         # Main dashboard
│   ├── companies/[id]/    # Dynamic company pages with sub-routes
│   ├── crm/              # CRM pages (contacts, deals, tasks, calendar)
│   ├── projects/         # Project management
│   └── resources/        # Resource library
├── services/              # Business logic layer
│   ├── api/              # External API clients (Claude, OpenAI, Firecrawl, SEMrush)
│   ├── scheduler/        # Cron job system (node-cron)
│   ├── notifications/    # Email service (Resend/SendGrid)
│   └── data/            # Database services
├── lib/                  # Utilities
│   ├── supabase.ts      # Supabase client initialization
│   ├── api-clients.ts   # API client wrappers
│   └── seo-audit.ts     # SEO analysis utilities
├── types/               # TypeScript definitions
└── src/                 # Electron desktop app (local dev only)
```

### Service Layer Pattern

The web app uses a service-oriented architecture:

**API Services** (`services/api/`):

- `claude.ts` - Anthropic Claude AI for content analysis
- `perplexity.ts` - Perplexity AI for citations
- `firecrawl.ts` - Firecrawl for web scraping
- `lighthouse.ts` - Google PageSpeed Insights
- `semrush.ts` - SEMrush competitor data

**Job Scheduler** (`services/scheduler/`):

- Uses `node-cron` for scheduled tasks
- **Important**: Do NOT use `scheduled` property in `TaskOptions` (doesn't exist in node-cron v3+)
- **Correct pattern**: Create task, then call `.start()` or `.stop()` explicitly
- Jobs: audit-runner, ranking-tracker, report-generator

**Notification System** (`services/notifications/`):

- Email service with template support (Resend or SendGrid)
- Templates: audit-complete, ranking-alert, weekly-report, system-notification
- Queue-based delivery with retry logic

### Electron App Structure

The desktop app (`src/`) uses React with client-side routing:

```
src/
├── pages/              # React pages (Dashboard, Companies, AIStrategy, etc.)
├── services/           # Business logic
│   ├── api/           # API clients (matches web-app structure)
│   ├── scheduler/     # Job scheduler
│   └── notifications/ # Email service
├── components/         # Reusable React components
├── utils/             # Utilities (E-E-A-T calculator, SoLV calculator)
└── store/            # Zustand state management
```

## Critical Build Notes

### TypeScript Strict Mode

Both apps use **strict TypeScript**. Common issues from deployment history:

1. **Database Type Assertions**:
   ```typescript
   // ❌ Wrong (untyped db clients don't support generics)
   const results = await db.all<MyType>('SELECT...')

   // ✅ Correct
   const results = (await db.all('SELECT...')) as MyType[]
   ```

2. **node-cron TaskOptions** (CRITICAL):
   ```typescript
   // ❌ Wrong ('scheduled' property doesn't exist)
   const task = cron.schedule(schedule, handler, {
     scheduled: false,
     timezone: 'America/New_York'
   })

   // ✅ Correct
   const task = cron.schedule(schedule, handler, {
     timezone: 'America/New_York'
   })
   task.stop() // Control explicitly
   ```

3. **Interface Property Access**:
   Always verify properties exist in interfaces. Retrieve from source if needed.

### Next.js Configuration

- **Output**: `standalone` (for Docker/Vercel)
- **Webpack**: Externalizes `pg` and `pg-native` on server (avoid bundling)
- **Images**: AVIF and WebP optimization enabled

## Key API Integrations

### Environment Variables Required

```env
# Supabase (Production DB)
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# AI Services
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...

# SEO Tools
SEMRUSH_API_KEY=...
GOOGLE_API_KEY=...
FIRECRAWL_API_KEY=fc-...

# Email Service
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_...
EMAIL_FROM=noreply@example.com
```

### Supabase Setup

The web app uses Supabase for production. Setup documented in `SUPABASE_SETUP.md`:
1. Create project at supabase.com
2. Run `web-app/supabase-schema.sql` in SQL Editor
3. Set environment variables in Vercel
4. Redeploy

**Client Initialization** (`web-app/lib/supabase.ts`):
```typescript
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Navigation & Routing

### Web App Routes (Next.js App Router)

**23 total pages** organized into 5 sections:

1. **SEO Tools**: `/dashboard`, `/companies`, `/audits`, `/keywords`, `/rankings`, `/reports`
2. **CRM**: `/crm/contacts`, `/crm/deals`, `/crm/tasks`, `/crm/calendar`
3. **Projects**: `/projects`, `/projects/github`, `/projects/notes`
4. **Resources**: `/resources/prompts`, `/resources/components`, `/resources/ai-tools`, `/resources/tutorials`
5. **Settings**: `/settings`, `/support`

**Dynamic Routes**: `/companies/[id]/seo-audit`, `/companies/[id]/keywords`, `/companies/[id]/rankings`

### Desktop App Routes (React Router)

Uses `react-router-dom` with client-side routing. Routes defined in `src/App.tsx`.

## Testing & Verification

### Database Connection Test
```bash
npm run db:test  # Verifies connection and lists tables
```

### Build Verification
```bash
# Web app
cd web-app && npm run build  # Must complete without TypeScript errors

# Desktop app
npm run build:win  # Creates Windows installer in release/
```

### Deployment Verification

**Vercel Deployment**:
- Check `DEPLOYMENT_CHECKPOINT.md` for last successful build
- Current production: Deployment ID `5rH6g9FjW` (Commit `2cf7e14`)
- Build time: ~1m 13s

## Migration System

Migrations use SQL files with `-- UP` and `-- ROLLBACK:` markers:

```sql
-- UP Migration
CREATE TABLE example (...);

-- ROLLBACK:
DROP TABLE example;
```

**Flow**: `scripts/migrate.js` parses files, executes SQL, records in `_migrations` table.

## Code Style

- **Linting**: ESLint with React and TypeScript plugins
- **Formatting**: Prettier for all `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.css` files
- **Icons**: Lucide React throughout
- **Styling**: Tailwind CSS with custom color scheme (Emerald primary)

## Documentation Files

The repository includes extensive documentation:

- `DEPLOYMENT_CHECKPOINT.md` - Last successful build details and TypeScript fixes
- `SUPABASE_SETUP.md` - Database setup guide
- `DATABASE_ARCHITECTURE.md` - Database design diagrams and relationships
- `NAVIGATION_COMPLETE.md` - Complete navigation map with all 23 pages
- `SCHEDULER_*.md` - Job scheduler documentation and package scripts
- `NOTIFICATION_*.md` - Notification system architecture
- `*_MCP_GUIDE.md` - Integration guides for SEMrush, GitHub, Vercel, Playwright, Schema.org
- `docs/build-assistant-tools/` - Build assistant tools documentation
  - `README.md` - Master index with integration strategies
  - `mcp-server-guide.md` - Complete MCP server building guide (Python, TypeScript, Java, Kotlin, C#)
  - `claude-code-cli.md` - Claude Code CLI reference (subagents, tools, automation)
  - `openai-codex-cloud.md` - OpenAI Codex Cloud guide (delegated tasks, GitHub integration)
  - `parallel-r1.md` - Parallel thinking framework for AI optimization
  - `spec-kit.md` - GitHub documentation framework (DocFX, GitHub Pages)

**Before making significant changes**: Review `DEPLOYMENT_CHECKPOINT.md` for known issues and fixes.

## Common Development Workflows

### Adding a New Feature

1. **Database**: Add schema to appropriate file in `database/` or create migration
2. **Types**: Define TypeScript interfaces in `types/` or `web-app/types/`
3. **API**: Create service in `services/api/` if external integration needed
4. **Page**: Add Next.js page in `web-app/app/` or React page in `src/pages/`
5. **Navigation**: Update sidebar in `web-app/app/layout.tsx` or `src/components/common/Sidebar.tsx`

### Running Tests Locally Before Push

```bash
# Web app build (catches TypeScript errors)
cd web-app && npm run build

# Database verification
npm run db:init:verify

# Linting
npm run lint
cd web-app && npm run lint
```

### Troubleshooting Build Errors

1. Check `DEPLOYMENT_CHECKPOINT.md` for similar errors and solutions
2. Verify environment variables are set correctly
3. Ensure database schemas are up to date (`npm run db:migrate`)
4. Check TypeScript strict mode compliance
5. Review Vercel deployment logs at vercel.com

## Deployment Targets

- **Desktop**: Windows NSIS installer via Electron Builder
- **Web**: Vercel (Next.js App Router)
- **Database**: Supabase PostgreSQL (production) or SQLite (development)

Current production URL: `https://geo-seo-domination-tool-c9zk94zwn-unite-group.vercel.app`

## Build Assistant Tools

The `new-life` branch integrates five build assistant tools for accelerated development:

### MCP (Model Context Protocol) Servers
Build custom tools that extend Claude's capabilities. See `docs/build-assistant-tools/mcp-server-guide.md`.

**Potential SEO MCP Servers**:
- **SEO Audit Server**: Technical audits, mobile performance, page speed
- **Keyword Research Server**: Opportunities, SERP analysis, search volume
- **Competitor Analysis Server**: Keyword tracking, backlinks, rankings
- **Local SEO Server**: GBP status, citations, local rankings
- **Content Optimization Server**: Quality analysis, meta tags, suggestions

**Languages**: Python (FastMCP), TypeScript (MCP SDK), Java (Spring AI), Kotlin, C#

### Claude Code CLI
Automate code reviews, test generation, and documentation. See `docs/build-assistant-tools/claude-code-cli.md`.

**Key Commands**:
```bash
claude                 # Interactive mode
claude -c             # Continue conversation
claude -p "query"     # Print and exit
claude --agents {...} # Define subagents for specialized tasks
```

**Use Cases**:
- Automated code reviews with `--agents code-reviewer.json`
- Test generation with custom subagents
- CI/CD integration with `--allowedTools` restrictions
- Multi-agent workflows for complex tasks

### OpenAI Codex Cloud
Cloud-based AI coding with sandboxed execution. See `docs/build-assistant-tools/openai-codex-cloud.md`.

**Access**: chatgpt.com/codex or `@codex` in GitHub issues/PRs

**Capabilities**:
- Bug fixing with isolated container execution
- Security audits and vulnerability scanning
- Architecture documentation (mermaid diagrams)
- Parallel task processing across multiple containers

### Parallel-R1 Framework
Apply parallel thinking concepts to SEO analysis. See `docs/build-assistant-tools/parallel-r1.md`.

**Applications**:
- Multi-strategy SEO analysis (explore different optimization approaches)
- Parallel ranking checks (test multiple keyword strategies)
- Cross-verification of AI recommendations
- Enhanced reasoning for content suggestions

### GitHub Spec-Kit
Documentation as code with DocFX. See `docs/build-assistant-tools/spec-kit.md`.

**Setup**:
```bash
dotnet tool install -g docfx
cd docs && docfx init
docfx docfx.json --serve  # Local preview
```

**Use Cases**:
- API documentation with automated GitHub Pages deployment
- Technical specifications version-controlled with code
- Team collaboration on documentation

### Tool Synergy

**Development Workflow**:
1. MCP Servers: Build custom SEO tools
2. Codex: Generate and debug code in cloud
3. Claude Code: Review and refactor locally
4. Spec-Kit: Document features and APIs
5. Parallel-R1: Optimize complex algorithms

**Quality Assurance**:
1. MCP Servers: Automated SEO audits
2. Codex: Security vulnerability scanning
3. Claude Code: Test generation with subagents
4. Parallel-R1: Multi-path verification
5. Spec-Kit: Test documentation
