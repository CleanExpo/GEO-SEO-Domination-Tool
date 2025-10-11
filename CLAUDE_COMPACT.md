# CLAUDE.md (Compact Memory Version)

**GEO-SEO Domination Tool** - Next.js 15 SEO platform with 13 autonomous AI agents

## 🚨 CRITICAL

- **Next.js at ROOT** (app/, components/, lib/) - NOT web-app/
- **Middleware MUST exclude `/api/*`** or 404s everywhere
- **Always run** `node scripts/pre-debug-check.js [type]` before debugging
- **Read** TROUBLESHOOTING_CHECKLIST.md when stuck

## Commands

### Core
```bash
npm run dev         # Next.js dev (port 3000)
npm run build       # Production build
npm run lint        # ESLint check
```

### Database
```bash
npm run db:init           # Init all schemas
npm run db:test           # Test connection
npm run db:migrate        # Run migrations
npm run db:migrate:status # Check status
```

### AI Testing
```bash
npm run gemini:test         # Gemini Computer Use
npm run gemini:competitor   # SEO competitor analysis
npm run tom                 # Tom AI assistant
```

### Vercel
```bash
npm run vercel:monitor      # Monitor deployments
npm run vercel:errors       # Capture errors
npm run vercel:deploy       # Deploy preview
npm run vercel:deploy:prod  # Deploy production
```

### PRD Workflow
```bash
/create-prd         # Create Product Requirement Doc
/generate-tasks     # Generate task list from PRD
/process-task-list  # Execute tasks step-by-step
```

## Architecture

### Database (Auto-detecting)
- **Dev**: SQLite (./data/geo-seo.db)
- **Prod**: PostgreSQL/Supabase (DATABASE_URL)

### Schemas (database/)
- schema.sql - Core SEO
- ai-search-schema.sql - AI strategies
- crm_schema.sql - CRM
- integrations-schema.sql - OAuth/webhooks
- resources-schema.sql - Prompts/components

### App Structure (ROOT)
```
app/api/        # API routes
services/       # Business logic
  api/          # External APIs (Claude, Firecrawl, Lighthouse)
  scheduler/    # Cron jobs (node-cron)
  notifications/# Email (Resend/SendGrid)
lib/            # Utils (supabase, encryption)
types/          # TypeScript defs
```

## AI Integration (Cost-Optimized Cascading)

**Order**: Qwen (cheapest) → Claude Opus → Claude Sonnet 4.5
**Savings**: 85-95% vs Claude-only

1. **Qwen** (Primary) - `services/api/cascading-ai.ts`
   - $0.40/$1.20 per 1M tokens
   - Use for ALL SEO analysis
   - API: `QWEN_API_KEY` or `DASHSCOPE_API_KEY`

2. **Claude Opus** (Fallback)
   - $15/$75 per 1M tokens
   - Complex analysis only

3. **Claude Sonnet 4.5** (Final)
   - $3/$15 per 1M tokens
   - `ANTHROPIC_API_KEY`

4. **DeepSeek V3** - DEPRECATED (replaced by Qwen)

## Critical TypeScript Fixes

```typescript
// ❌ Wrong
const results = await db.all<MyType>('SELECT...')
const task = cron.schedule(schedule, handler, { scheduled: false })

// ✅ Correct
const results = (await db.all('SELECT...')) as MyType[]
const task = cron.schedule(schedule, handler, { timezone: 'UTC' })
task.stop() // Control explicitly
```

## Environment Variables

```env
# Security (REQUIRED)
ENCRYPTION_KEY=...  # Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Database
DATABASE_URL=postgresql://...  # Prod: Supabase | Dev: file:./data/geo-seo.db

# AI (Cascading)
QWEN_API_KEY=...                # Primary
ANTHROPIC_API_KEY=...           # Fallback
GOOGLE_API_KEY=...              # Gemini testing

# Integrations
FIRECRAWL_API_KEY=...
EMAIL_API_KEY=...
VERCEL_TOKEN=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Service Layer Pattern

**API Services** (services/api/):
- cascading-ai.ts - Qwen → Claude fallback
- firecrawl.ts - Web scraping (5 endpoints)
- lighthouse.ts - PageSpeed (2 endpoints)
- claude.ts - AI analysis (8 endpoints)

**Job Scheduler** (services/scheduler/):
- node-cron v4+ (NO `scheduled` property)
- Jobs: audit-runner, ranking-tracker, report-generator

**Notifications** (services/notifications/):
- Templates: audit-complete, ranking-alert, weekly-report
- Queue-based with retry

## Security

- **AES-256-GCM encryption** for credentials
- Zero-knowledge (admin sees ••••••••ab12)
- Complete audit trail
- Client self-service updates

## Routes (23 Pages)

1. **SEO**: /dashboard, /companies, /audits, /keywords, /rankings, /reports
2. **CRM**: /crm/contacts, /crm/deals, /crm/tasks, /crm/calendar
3. **Projects**: /projects, /projects/github, /projects/notes
4. **Resources**: /resources/prompts, /resources/components, /resources/ai-tools
5. **Settings**: /settings, /support

**Dynamic**: /companies/[id]/seo-audit, /companies/[id]/keywords

## Common Workflows

### Add Feature
1. Database: Add schema or migration
2. Types: Define interfaces
3. API: Create service if external
4. Page: Add Next.js page
5. Nav: Update sidebar

### Debug Issue
```bash
node scripts/pre-debug-check.js [save|database|api|frontend]
```

### Before Push
```bash
npm run build           # Catch TypeScript errors
npm run db:init:verify  # Verify schemas
npm run lint            # Lint check
```

## Deployment

- **Web**: Vercel (Next.js standalone)
- **DB**: Supabase PostgreSQL
- **URL**: https://geo-seo-domination-tool-c9zk94zwn-unite-group.vercel.app
- **Project**: prj_JxdLiaHoWpnXWEjEhXXpmo0eFBgQ

## Documentation

**Critical Fixes**:
- MOUNTAIN_CONQUERED.md - All bugs fixed
- CRITICAL_DEPLOYMENT_FIXES.md - Deployment guide
- TROUBLESHOOTING_CHECKLIST.md - Debug workflow

**Architecture**:
- DATABASE_ARCHITECTURE.md - DB design
- NAVIGATION_COMPLETE.md - All 23 pages
- SUPABASE_SETUP.md - DB setup

## Build Assistant Tools

1. **MCP Servers** - Custom Claude tools (Python/TypeScript)
2. **Claude Code CLI** - Code reviews, test gen, docs
3. **OpenAI Codex** - Cloud coding, sandboxed execution
4. **Parallel-R1** - Multi-path SEO analysis
5. **Spec-Kit** - DocFX documentation

## Quick Reference

```bash
# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test database
npm run db:test

# Check all systems
npm run check:all

# Monitor Vercel
npm run vercel:monitor:watch

# Run Gemini SEO analysis
npm run gemini:competitor

# Create PRD
/create-prd
```

---

**Platform**: win32 | **Branch**: main | **Model**: claude-sonnet-4-5-20250929
