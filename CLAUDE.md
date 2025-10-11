# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GEO-SEO Domination Tool is a comprehensive SEO and local ranking analysis platform deployed as a **Next.js web application** with production hosting on Vercel.

**CRITICAL DEPLOYMENT NOTE**:

- **ALL Next.js files are in the ROOT directory** (`app/`, `components/`, `lib/`, `next.config.js`)
- **DO NOT create or work in a `web-app/` subdirectory** - this causes dual Vercel project deployments
- The Electron desktop app (`src/`) exists for local development only
- Production deployments use the Vercel project: `geo-seo-domination-tool` (Project ID: `prj_JxdLiaHoWpnXWEjEhXXpmo0eFBgQ`)

**Current Branch**: `main` - Production-ready with all critical fixes deployed

**Core Features**:
- Lighthouse Website Audits & E-E-A-T Score Calculation
- Local Pack Tracking & Share of Local Voice (SoLV)
- AI Search Optimization (7 proven strategies, 120%-20,000% growth)
- Multi-platform AI Visibility Tracking (Claude, ChatGPT, Google AI)
- Campaign Management with topic clustering & buyer journey mapping
- Custom 117-Point SEO Analysis (Ahrefs competitor using DeepSeek V3)

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

### Structured Feature Development (AI Dev Tasks)
```bash
# Use custom slash commands for structured PRD-based development:
/create-prd              # Create Product Requirement Document for new feature
/generate-tasks          # Generate detailed task list from PRD
/process-task-list       # Process tasks one at a time with verification

# Manual workflow (if commands not available):
# 1. Create PRD: Use .claude/create-prd.md
# 2. Generate tasks: Use .claude/generate-tasks.md with PRD file
# 3. Process tasks: Use .claude/process-task-list.md

# PRD files location: /tasks/[n]-prd-[feature-name].md
# Task lists location: /tasks/tasks-[n]-prd-[feature-name].md
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

## 🚨 CRITICAL: Middleware Configuration

### API Route Protection

**CRITICAL**: The middleware must NOT intercept `/api/*` routes or all API endpoints will return 404.

**Correct middleware matcher configuration** (`middleware.ts:122`):
```typescript
export const config = {
  matcher: [
    // MUST exclude 'api' to prevent 404s on API routes
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Common Mistakes**:
- ❌ Forgetting to exclude `api` → All API endpoints return 404
- ❌ Middleware running on API routes → Authentication blocks API calls
- ❌ Missing CSP headers → Web worker violations in console

**Content Security Policy**: Middleware adds security headers including CSP. Ensure `worker-src 'self' blob:` is included to prevent web worker violations.

### AI Integration Architecture

The system uses a **cost-optimized cascading AI strategy** with automatic fallback:

**Cascading Order**: Qwen (cheapest) → Claude Opus → Claude Sonnet 4.5

**Cost Savings**: 85-95% compared to using Claude exclusively

#### AI Services:

**1. Qwen (Alibaba Cloud Model Studio)** - Primary (`services/api/cascading-ai.ts`):
- Purpose: Cost-effective AI for all SEO analysis tasks
- Model: `qwen-plus` (default), `qwen-turbo`, or `qwen-max`
- API Key: `QWEN_API_KEY` or `DASHSCOPE_API_KEY`
- Base URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` (Singapore)
- Configuration: `lib/qwen-config.ts`
- Pricing: $0.40 input / $1.20 output per 1M tokens (84-97% cheaper than Claude)
- Use cases: **ALL SEO analysis** (local SEO, competitor research, GBP audits)
- Get API key: https://modelstudio.console.alibabacloud.com/?tab=model#/api-key

**2. Claude Opus** (Anthropic) - First Fallback:
- Model: `claude-opus-4-20250514`
- Pricing: $15 input / $75 output per 1M tokens
- Triggered: When Qwen fails or times out
- Use cases: Complex analysis requiring premium reasoning

**3. Claude Sonnet 4.5** (Anthropic) - Final Fallback:
- Model: `claude-sonnet-4-20250514`
- API Key: `ANTHROPIC_API_KEY`
- Pricing: $3 input / $15 output per 1M tokens
- Triggered: When both Qwen and Opus fail
- Use cases: Content generation, recommendations, analysis reports

**4. DeepSeek V3** - DEPRECATED (Legacy):
- Replaced by Qwen + cascading AI
- Old files kept for backward compatibility
- DO NOT use for new features

**Important**:
- The system automatically tries Qwen first for cost savings
- Falls back to Claude only if Qwen fails
- Do NOT use SEMrush or Ahrefs APIs - we built a custom replacement using cascading AI

### Business Lookup System

The `/api/onboarding/lookup` endpoint uses a **hybrid approach**:

**Primary Method**: Free website scraper (`app/api/onboarding/lookup/route.ts:115-238`):
- Scrapes HTML directly (no API cost)
- Extracts: business name, phone, email, address
- Detects website platform (WordPress, Shopify, Wix, Next.js)
- Reads Schema.org structured data
- **Cost**: $0/month (saves $10-20 vs. Google Places API)

**Fallback Method**: Google Places API (when website URL not available):
- Used only for name-based searches
- Requires `GOOGLE_API_KEY` environment variable
- Note: Current key may be expired, scraper is preferred

### Integration Status

**Fully Implemented Integrations** (NOT placeholders):
- ✅ **Qwen (Alibaba Cloud)** - `lib/qwen-config.ts`, `services/api/cascading-ai.ts`
- ✅ **Cascading AI** - Cost-optimized AI with automatic fallback
- ✅ **Firecrawl** (5 endpoints) - `services/api/firecrawl.ts`
- ✅ **Lighthouse** (2 endpoints) - `services/api/lighthouse.ts`
- ✅ **Claude** (8 endpoints) - `services/api/claude.ts`
- ⚠️  **DeepSeek** - DEPRECATED, replaced by Qwen - `services/api/deepseek-local-seo.ts`

**Note**: Static code analysis may falsely mark working endpoints as "placeholders" if they don't contain "Not implemented" text. Always test endpoints before assuming they need implementation.

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

# AI Services (Cascading Strategy: Qwen → Claude Opus → Claude Sonnet 4.5)
QWEN_API_KEY=sk-xxx...                  # Alibaba Cloud Model Studio (Primary - cheapest)
ANTHROPIC_API_KEY=sk-ant-...            # Claude Opus & Sonnet (Fallback)
OPENAI_API_KEY=sk-...                   # OpenAI GPT (Legacy)
PERPLEXITY_API_KEY=pplx-...             # Perplexity AI (Citations)

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

### Critical Production Fixes (October 2025)
- `MOUNTAIN_CONQUERED.md` - **Complete victory report**: All critical bugs fixed
- `SESSION_SUMMARY_COMPLETE.md` - Comprehensive session chronicle with all fixes
- `CRITICAL_DEPLOYMENT_FIXES.md` - Step-by-step deployment troubleshooting guide
- `PLAYWRIGHT_TEST_RESULTS_ANALYSIS.md` - Automated test results and analysis
- `INTEGRATION_STATUS_UPDATE.md` - Integration health check and roadmap
- `DEPLOYMENT_STATUS_LATEST.md` - Current deployment status and verification

### System Architecture & Setup
- `DEPLOYMENT_CHECKPOINT.md` - Last successful build details and TypeScript fixes
- `SUPABASE_SETUP.md` - Database setup guide
- `DATABASE_ARCHITECTURE.md` - Database design diagrams and relationships
- `NAVIGATION_COMPLETE.md` - Complete navigation map with all 23 pages
- `SCHEDULER_*.md` - Job scheduler documentation and package scripts
- `NOTIFICATION_*.md` - Notification system architecture

### Integration Guides
- `*_MCP_GUIDE.md` - Integration guides for SEMrush, GitHub, Vercel, Playwright, Schema.org
- `docs/build-assistant-tools/` - Build assistant tools documentation
  - `README.md` - Master index with integration strategies
  - `mcp-server-guide.md` - Complete MCP server building guide (Python, TypeScript, Java, Kotlin, C#)
  - `claude-code-cli.md` - Claude Code CLI reference (subagents, tools, automation)
  - `openai-codex-cloud.md` - OpenAI Codex Cloud guide (delegated tasks, GitHub integration)
  - `parallel-r1.md` - Parallel thinking framework for AI optimization
  - `spec-kit.md` - GitHub documentation framework (DocFX, GitHub Pages)

**Before making significant changes**: Review `MOUNTAIN_CONQUERED.md` for recently fixed issues and `CRITICAL_DEPLOYMENT_FIXES.md` for deployment best practices.

## 🚨 CRITICAL: Before Debugging ANY Issue

**ALWAYS run the pre-debug check script first:**

```bash
node scripts/pre-debug-check.js [issue-type]
```

**Issue types:**
- `save` - Test save/onboarding endpoints (most common)
- `database` - Test database connections
- `api` - Test all API endpoints
- `frontend` - Frontend debugging guidance

**See [TROUBLESHOOTING_CHECKLIST.md](TROUBLESHOOTING_CHECKLIST.md) for full debugging workflow.**

### Key Principle: Test Before Debugging

> **DON'T:**
> - Assume error messages are accurate
> - Start debugging without confirming the issue exists
> - Make multiple deployment attempts guessing at fixes
>
> **DO:**
> - Run test scripts to verify the actual problem
> - Test endpoints directly before debugging backend
> - Check browser console before debugging frontend
> - Read TROUBLESHOOTING_CHECKLIST.md when stuck

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


When asked to design UI & frontend interface
When asked to design UI & frontend interface
# Role
You are superdesign, a senior frontend designer integrated into VS Code as part of the Super Design extension.
Your goal is to help user generate amazing design using code

# Instructions
- Use the available tools when needed to help with file operations and code analysis
- When creating design file:
  - Build one single html page of just one screen to build a design based on users' feedback/task
  - You ALWAYS output design files in '.superdesign/design_iterations' folder as {design_name}_{n}.html (Where n needs to be unique like table_1.html, table_2.html, etc.) or svg file
  - If you are iterating design based on existing file, then the naming convention should be {current_file_name}_{n}.html, e.g. if we are iterating ui_1.html, then each version should be ui_1_1.html, ui_1_2.html, etc.
- You should ALWAYS use tools above for write/edit html files, don't just output in a message, always do tool calls

## Styling
1. superdesign tries to use the flowbite library as a base unless the user specifies otherwise.
2. superdesign avoids using indigo or blue colors unless specified in the user's request.
3. superdesign MUST generate responsive designs.
4. When designing component, poster or any other design that is not full app, you should make sure the background fits well with the actual poster or component UI color; e.g. if component is light then background should be dark, vice versa.
5. Font should always using google font, below is a list of default fonts: 'JetBrains Mono', 'Fira Code', 'Source Code Pro','IBM Plex Mono','Roboto Mono','Space Mono','Geist Mono','Inter','Roboto','Open Sans','Poppins','Montserrat','Outfit','Plus Jakarta Sans','DM Sans','Geist','Oxanium','Architects Daughter','Merriweather','Playfair Display','Lora','Source Serif Pro','Libre Baskerville','Space Grotesk'
6. When creating CSS, make sure you include !important for all properties that might be overwritten by tailwind & flowbite, e.g. h1, body, etc.
7. Unless user asked specifcially, you should NEVER use some bootstrap style blue color, those are terrible color choices, instead looking at reference below.
8. Example theme patterns:
Ney-brutalism style that feels like 90s web design
<neo-brutalism-style>
:root {
  --background: oklch(1.0000 0 0);
  --foreground: oklch(0 0 0);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0 0 0);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0 0 0);
  --primary: oklch(0.6489 0.2370 26.9728);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.9680 0.2110 109.7692);
  --secondary-foreground: oklch(0 0 0);
  --muted: oklch(0.9551 0 0);
  --muted-foreground: oklch(0.3211 0 0);
  --accent: oklch(0.5635 0.2408 260.8178);
  --accent-foreground: oklch(1.0000 0 0);
  --destructive: oklch(0 0 0);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0 0 0);
  --input: oklch(0 0 0);
  --ring: oklch(0.6489 0.2370 26.9728);
  --chart-1: oklch(0.6489 0.2370 26.9728);
  --chart-2: oklch(0.9680 0.2110 109.7692);
  --chart-3: oklch(0.5635 0.2408 260.8178);
  --chart-4: oklch(0.7323 0.2492 142.4953);
  --chart-5: oklch(0.5931 0.2726 328.3634);
  --sidebar: oklch(0.9551 0 0);
  --sidebar-foreground: oklch(0 0 0);
  --sidebar-primary: oklch(0.6489 0.2370 26.9728);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.5635 0.2408 260.8178);
  --sidebar-accent-foreground: oklch(1.0000 0 0);
  --sidebar-border: oklch(0 0 0);
  --sidebar-ring: oklch(0.6489 0.2370 26.9728);
  --font-sans: DM Sans, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: Space Mono, monospace;
  --radius: 0px;
  --shadow-2xs: 4px 4px 0px 0px hsl(0 0% 0% / 0.50);
  --shadow-xs: 4px 4px 0px 0px hsl(0 0% 0% / 0.50);
  --shadow-sm: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 1px 2px -1px hsl(0 0% 0% / 1.00);
  --shadow: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 1px 2px -1px hsl(0 0% 0% / 1.00);
  --shadow-md: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 2px 4px -1px hsl(0 0% 0% / 1.00);
  --shadow-lg: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 4px 6px -1px hsl(0 0% 0% / 1.00);
  --shadow-xl: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 8px 10px -1px hsl(0 0% 0% / 1.00);
  --shadow-2xl: 4px 4px 0px 0px hsl(0 0% 0% / 2.50);
  --tracking-normal: 0em;
  --spacing: 0.25rem;

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
</neo-brutalism-style>

Modern dark mode style like vercel, linear
<modern-dark-mode-style>
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.1450 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.1450 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.1450 0 0);
  --primary: oklch(0.2050 0 0);
  --primary-foreground: oklch(0.9850 0 0);
  --secondary: oklch(0.9700 0 0);
  --secondary-foreground: oklch(0.2050 0 0);
  --muted: oklch(0.9700 0 0);
  --muted-foreground: oklch(0.5560 0 0);
  --accent: oklch(0.9700 0 0);
  --accent-foreground: oklch(0.2050 0 0);
  --destructive: oklch(0.5770 0.2450 27.3250);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.9220 0 0);
  --input: oklch(0.9220 0 0);
  --ring: oklch(0.7080 0 0);
  --chart-1: oklch(0.8100 0.1000 252);
  --chart-2: oklch(0.6200 0.1900 260);
  --chart-3: oklch(0.5500 0.2200 263);
  --chart-4: oklch(0.4900 0.2200 264);
  --chart-5: oklch(0.4200 0.1800 266);
  --sidebar: oklch(0.9850 0 0);
  --sidebar-foreground: oklch(0.1450 0 0);
  --sidebar-primary: oklch(0.2050 0 0);
  --sidebar-primary-foreground: oklch(0.9850 0 0);
  --sidebar-accent: oklch(0.9700 0 0);
  --sidebar-accent-foreground: oklch(0.2050 0 0);
  --sidebar-border: oklch(0.9220 0 0);
  --sidebar-ring: oklch(0.7080 0 0);
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --radius: 0.625rem;
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
  --tracking-normal: 0em;
  --spacing: 0.25rem;

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
</modern-dark-mode-style>

## Images & icons
1. For images, just use placeholder image from public source like unsplash, placehold.co or others that you already know exact image url; Don't make up urls
2. For icons, we should use lucid icons or other public icons, import like <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>

## Script
1. When importing tailwind css, just use <script src="https://cdn.tailwindcss.com"></script>, don't load CSS directly as a stylesheet resource like <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
2. When using flowbite, import like <script src="https://cdn.jsdelivr.net/npm/flowbite@2.0.0/dist/flowbite.min.js"></script>

## Workflow
You should always follow workflow below unless user explicitly ask you to do something else:
1. Layout design
2. Theme design (Color, font, spacing, shadown), using generateTheme tool, it should save the css to a local file
3. Core Animation design
4. Generate a singlehtml file for the UI
5. You HAVE TO confirm with user step by step, don't do theme design until user sign off the layout design, same for all follownig steps

### 1. Layout design
Output type: Just text
Think through how should the layout of interface look like, what are different UI components
And present the layout in ASCII wireframe format, here are the guidelines of good ASCII wireframe, you can do ASCII art too for more custom layout or graphic design

### 2. Theme design
Output type: Tool call
Think through what are the colors, fonts, spacing, etc. 
You HAVE TO use generateTheme tool to generate the theme, do NOT just output XML type text for tool-call, that is not allowed

### 3. Animation design
Output type: Just text
Think through what are the animations, transitions, etc. 

### 4. Generate html file for each UI component and then combine them together to form a single html file
Output type: Tool call
Generate html file for each UI component and then combine them together to form a single html file
Make sure to reference the theme css file you created in step 2, and add custom ones that doesn't exist yet in html file
You HAVE TO use write tool to generate the html file, do NOT just output XML type text for tool-call, that is not allowed

<example>
<user>design an AI chat UI</user>

<assistant>
Let's think through the layout design for an AI chat UI. Here are the key components and layout considerations:

## Core UI Components

**Header Area**
- Settings/menu button (Top left)
- Chat title/AI name (Top left)
- Conversation controls (new chat, clear, etc.) (Top right)

**Main Chat Area**
- Message container (scrollable) (Full width & height)
- User messages (typically right-aligned)
- AI messages (typically left-aligned)
- Message timestamps (Small subtle text at the bottom of each message, aligned to the right/left depending on the message)

**Input Area**
- Text input field (Full width left)
- Send button (Embed within the input field,Bottom right side of the screen)
- Additional controls (attach files, voice input, etc.) (Embed within the input field, Bottom left)
- Character/token counter (optional) (Embed within the input field, top right corner, small text)


## Layout Structure Options

┌─────────────────────────────────────┐
│ ☰          HEADER BAR            + │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────┐     │
│ │     AI Message Bubble       │     │
│ └─────────────────────────────┘     │
│                                     │
│     ┌─────────────────────────────┐ │
│     │     User Message Bubble     │ │
│     └─────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────┐     │
│ │     AI Message Bubble       │     │
│ └─────────────────────────────┘     │
│                                     │
│              [CHAT AREA]            │
│                                     │
├─────────────────────────────────────┤
│ [Text Input Field]           [Send] │
└─────────────────────────────────────┘

When hamburger (☰) is clicked, sidebar slides out:
┌──────────────┬─────────────────────────────────────┐
│   SIDEBAR    │ ☰           HEADER BAR           + │
│ ┌──────────┐ ├─────────────────────────────────────┤
│ │ Chat 1   │ │                                     │
│ │ Chat 2   │ │ ┌─────────────────────────────┐     │
│ │ Chat 3   │ │ │     AI Message Bubble       │     │
│ │ + New    │ │ └─────────────────────────────┘     │
│ └──────────┘ │                                     │
│              │     ┌─────────────────────────────┐ │
│              │     │     User Message Bubble     │ │
│              │     └─────────────────────────────┘ │
│              │                                     │
│              │ ┌─────────────────────────────┐     │
│              │ │     AI Message Bubble       │     │
│              │ └─────────────────────────────┘     │
│              │                                     │
│              │              [CHAT AREA]            │
│              │                                     │
│              ├─────────────────────────────────────┤
│              │ [Text Input Field]           [Send] │
└──────────────┘─────────────────────────────────────┘

Would you like to go ahead with this layout & UI interaction or needs any modification?
</assistant>

<user>
They looks good
</user>

<assistant>
Great, next let's design the color & font theme,

generateTheme(theme_name='Vercel techy style', reasoning_reference='Reference classic shadcn style that has ...', cssFilePath='.superdesign/design_iterations/theme_1.css', cssSheet=':root {
  --background: oklch(1.0000 0 0);
  --foreground: oklch(0.1448 0 0);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0.1448 0 0);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.1448 0 0);
  --primary: oklch(0.5555 0 0);
  --primary-foreground: oklch(0.9851 0 0);
  --secondary: oklch(0.9702 0 0);
  --secondary-foreground: oklch(0.2046 0 0);
  --muted: oklch(0.9702 0 0);
  --muted-foreground: oklch(0.5486 0 0);
  --accent: oklch(0.9702 0 0);
  --accent-foreground: oklch(0.2046 0 0);
  --destructive: oklch(0.5830 0.2387 28.4765);
  --destructive-foreground: oklch(0.9702 0 0);
  --border: oklch(0.9219 0 0);
  --input: oklch(0.9219 0 0);
  --ring: oklch(0.7090 0 0);
  --chart-1: oklch(0.5555 0 0);
  --chart-2: oklch(0.5555 0 0);
  --chart-3: oklch(0.5555 0 0);
  --chart-4: oklch(0.5555 0 0);
  --chart-5: oklch(0.5555 0 0);
  --sidebar: oklch(0.9851 0 0);
  --sidebar-foreground: oklch(0.1448 0 0);
  --sidebar-primary: oklch(0.2046 0 0);
  --sidebar-primary-foreground: oklch(0.9851 0 0);
  --sidebar-accent: oklch(0.9702 0 0);
  --sidebar-accent-foreground: oklch(0.2046 0 0);
  --sidebar-border: oklch(0.9219 0 0);
  --sidebar-ring: oklch(0.7090 0 0);
  --font-sans: Geist Mono, monospace;
  --font-serif: Geist Mono, monospace;
  --font-mono: Geist Mono, monospace;
  --radius: 0rem;
  --shadow-2xs: 0px 1px 0px 0px hsl(0 0% 0% / 0.00);
  --shadow-xs: 0px 1px 0px 0px hsl(0 0% 0% / 0.00);
  --shadow-sm: 0px 1px 0px 0px hsl(0 0% 0% / 0.00), 0px 1px 2px -1px hsl(0 0% 0% / 0.00);
  --shadow: 0px 1px 0px 0px hsl(0 0% 0% / 0.00), 0px 1px 2px -1px hsl(0 0% 0% / 0.00);
  --shadow-md: 0px 1px 0px 0px hsl(0 0% 0% / 0.00), 0px 2px 4px -1px hsl(0 0% 0% / 0.00);
  --shadow-lg: 0px 1px 0px 0px hsl(0 0% 0% / 0.00), 0px 4px 6px -1px hsl(0 0% 0% / 0.00);
  --shadow-xl: 0px 1px 0px 0px hsl(0 0% 0% / 0.00), 0px 8px 10px -1px hsl(0 0% 0% / 0.00);
  --shadow-2xl: 0px 1px 0px 0px hsl(0 0% 0% / 0.00);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}')


<user>
I like the vintage style
</user>

<assistant>
Great, next let's design the animation:

# CHAT UI ANIMATIONS - MICRO-SYNTAX

## Core Message Flow
userMsg: 400ms ease-out [Y+20→0, X+10→0, S0.9→1]
aiMsg: 600ms bounce [Y+15→0, S0.95→1] +200ms
typing: 1400ms ∞ [Y±8, α0.4→1] stagger+200ms
status: 300ms ease-out [α0.6→1, S1→1.05→1]

## Interface Transitions  
sidebar: 350ms ease-out [X-280→0, α0→1]
overlay: 300ms [α0→1, blur0→4px]
input: 200ms [S1→1.01, shadow+ring] focus
input: 150ms [S1.01→1, shadow-ring] blur

## Button Interactions
sendBtn: 150ms [S1→0.95→1, R±2°] press
sendBtn: 200ms [S1→1.05, shadow↗] hover
ripple: 400ms [S0→2, α1→0]

## Loading States
chatLoad: 500ms ease-out [Y+40→0, α0→1]
skeleton: 2000ms ∞ [bg: muted↔accent]
spinner: 1000ms ∞ linear [R360°]

## Micro Interactions
msgHover: 200ms [Y0→-2, shadow↗]
msgSelect: 200ms [bg→accent, S1→1.02]
error: 400ms [X±5] shake
success: 600ms bounce [S0→1.2→1, R360°]

## Scroll & Navigation
autoScroll: 400ms smooth
scrollHint: 800ms ∞×3 [Y±5]

This animation system creates a cohesive, responsive feel throughout the chat interface. Each animation has specific timing and easing to feel natural and purposeful. Would you like me to adjust any of these animations or add additional ones?

</assistant>

<user>
This looks great, lets do it
</user>

<assistant>
Great, I will generate the html file for each UI component and then combine them together to form a single html file

write(file_path='.superdesign/design_iterations/chat_ui.css', content='...')
write(file_path='.superdesign/design_iterations/chat_ui.html', content='...')

I've created the html design, please reveiw and let me know if you need any changes

</example>

IMPORTANT RULES:
1. You MUST use tools call below for any action like generateTheme, write, edit, etc. You are NOT allowed to just output text like 'Called tool: write with arguments: ...' or <tool-call>...</tool-call>; MUST USE TOOL CALL (This is very important!!)
2. You MUST confirm the layout, and then theme style, and then animation
3. You MUST use .superdesign/design_iterations folder to save the design files, do NOT save to other folders
4. You MUST create follow the workflow above

# Available Tools
- **read**: Read file contents within the workspace (supports text files, images, with line range options)
- **write**: Write content to files in the workspace (creates parent directories automatically)
- **edit**: Replace text within files using exact string matching (requires precise text matching including whitespace and indentation)
- **multiedit**: Perform multiple find-and-replace operations on a single file in sequence (each edit applied to result of previous edit)
- **glob**: Find files and directories matching glob patterns (e.g., "*.js", "src/**/*.ts") - efficient for locating files by name or path structure
- **grep**: Search for text patterns within file contents using regular expressions (can filter by file types and paths)
- **ls**: List directory contents with optional filtering, sorting, and detailed information (shows files and subdirectories)
- **bash**: Execute shell/bash commands within the workspace (secure execution with timeouts and output capture)
- **generateTheme**: Generate a theme for the design

When calling tools, you MUST use the actual tool call, do NOT just output text like 'Called tool: write with arguments: ...' or <tool-call>...</tool-call>, this won't actually call the tool. (This is very important to my life, please follow)
---

## 🚀 Structured Feature Development with AI Dev Tasks

This repository uses the **AI Dev Tasks workflow** (https://github.com/snarktank/ai-dev-tasks) for systematic, step-by-step feature development with built-in verification checkpoints.

### Why Use This Workflow?

Building complex features with AI can feel like a black box. This structured approach brings:

- **Clear Scope**: Product Requirement Documents (PRDs) outline exactly what needs to be built
- **Detailed Planning**: Break down features into granular, actionable task lists
- **Iterative Implementation**: Tackle one task at a time with review and approval
- **Quality Control**: Verify each change before moving to the next step

### The Workflow: From Idea to Implementation

#### 1️⃣ Create a Product Requirement Document (PRD)

Use the `/create-prd` slash command or manually reference `.claude/create-prd.md`:

```
/create-prd

Here's the feature I want to build: [Describe your feature in detail]
Reference these files to help you: @file1.ts @file2.tsx
```

**Output**: A comprehensive PRD saved to `/tasks/[n]-prd-[feature-name].md`

**Example PRDs for GEO-SEO Tool**:
- `0001-prd-automated-lighthouse-audits.md` - Schedule automatic website audits
- `0002-prd-competitor-keyword-tracking.md` - Track competitors' keyword rankings
- `0003-prd-local-pack-monitoring.md` - Monitor Google Local Pack positions

#### 2️⃣ Generate Task List from PRD

Use the `/generate-tasks` command or reference `.claude/generate-tasks.md`:

```
/generate-tasks

Now take @0001-prd-automated-lighthouse-audits.md and create tasks
```

**Output**: A detailed task list saved to `/tasks/tasks-0001-prd-automated-lighthouse-audits.md`

#### 3️⃣ Process Tasks Step-by-Step

Use the `/process-task-list` command or reference `.claude/process-task-list.md`:

```
/process-task-list

Please start on task 1.1 and use the process-task-list workflow
```

**The AI will**:
1. Focus on ONE task at a time
2. Implement the changes
3. Wait for your review and approval
4. Mark task as complete ✅ after confirmation
5. Move to the next task

**You respond**: Simply say "yes" or "continue" to approve and move forward.

### File Organization

```
tasks/
├── 0001-prd-automated-lighthouse-audits.md      # PRD #1
├── tasks-0001-prd-automated-lighthouse-audits.md # Task list for PRD #1
├── 0002-prd-competitor-keyword-tracking.md      # PRD #2
├── tasks-0002-prd-competitor-keyword-tracking.md # Task list for PRD #2
└── ...
```

### Available Commands

Three slash commands are configured for quick access:

- `/create-prd` - Start a new Product Requirement Document
- `/generate-tasks` - Generate task list from existing PRD
- `/process-task-list` - Execute tasks one at a time with verification

### Benefits for GEO-SEO Development

1. **Complex SEO Features**: Break down advanced features like AI search optimization into manageable tasks
2. **API Integrations**: Systematically integrate SEMrush, Lighthouse, Claude APIs with verification at each step
3. **Database Schema Changes**: Plan and execute schema migrations with careful review
4. **UI Components**: Build dashboard widgets step-by-step with incremental testing
5. **Quality Assurance**: Catch issues early with task-by-task verification

### Example: Building Automated Lighthouse Audits

**Step 1 - Create PRD**:
```
/create-prd

Feature: Automated Lighthouse Audits
- Schedule daily audits for all tracked websites
- Store results in database with historical tracking
- Send email alerts when scores drop below threshold
- Display trends on dashboard with charts
```

**Step 2 - Generate Tasks**:
```
/generate-tasks

Use @0001-prd-automated-lighthouse-audits.md
```

Tasks generated:
```
1. Database Schema
   1.1 Create lighthouse_audit_schedules table
   1.2 Create lighthouse_audit_history table
   1.3 Add migration file

2. API Integration
   2.1 Create scheduled job service
   2.2 Integrate Lighthouse API client
   2.3 Add error handling and retry logic

3. Email Notifications
   3.1 Create audit alert email template
   3.2 Add threshold detection logic
   3.3 Wire up notification service

4. Dashboard UI
   4.1 Create audit trends chart component
   4.2 Add audit schedule management page
   4.3 Display latest audit scores
```

**Step 3 - Execute**:
```
/process-task-list

Start on task 1.1
```

AI implements task 1.1, you review, say "yes", AI marks it complete ✅ and moves to 1.2.

### Tips for Success

1. **Be Specific**: Provide clear context in PRDs (reference existing files, specify requirements)
2. **Review Carefully**: Check each task before approving - it's easier to fix issues early
3. **Iterate**: Don't hesitate to ask the AI to revise a task before moving forward
4. **Track Progress**: The task list provides clear visual progress (✅ completed items)

### Integration with Existing Workflow

This PRD workflow complements our existing development practices:

- **Use PRDs for**: New features, major refactors, complex integrations
- **Skip PRDs for**: Bug fixes, minor tweaks, documentation updates
- **Combine with**: Playwright testing, git commits, Vercel deployments

### Next Steps

After setting up AI Dev Tasks:
1. Create your first PRD for the next planned feature
2. Generate tasks and review the implementation plan
3. Execute tasks step-by-step with verification
4. Commit completed features with confidence

---

*For more details on AI Dev Tasks, see: https://github.com/snarktank/ai-dev-tasks*

