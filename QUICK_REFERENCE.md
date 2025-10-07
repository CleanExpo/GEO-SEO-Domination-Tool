# GEO-SEO Domination Tool - Quick Reference Guide

**Version:** 1.0.0 | **Last Updated:** 2025-10-08

---

## 🚀 Quick Start Commands

### Development
```bash
npm run dev              # Start Next.js dev server (localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run linting
```

### Database
```bash
npm run db:init          # Initialize all database schemas
npm run db:init:verify   # Initialize and verify tables
npm run db:test          # Test database connection
npm run db:test:verbose  # Detailed database analysis
npm run db:migrate       # Run pending migrations
```

### Testing
```bash
npm test                 # Run unit tests
npm run test:integration # Run integration tests
npm run test:e2e         # Run E2E tests
npm run test:coverage    # Generate coverage report
npm run test:watch       # Watch mode
```

### Verification
```bash
npm run check:env        # Check environment variables
npm run check:apis       # Verify API integrations
npm run check:all        # Run all checks
```

---

## 📁 Project Structure

```
GEO_SEO_Domination-Tool/
├── app/                    # Next.js pages (23 pages)
│   ├── api/               # API routes (87 routes)
│   ├── dashboard/         # Main dashboard
│   ├── companies/         # Company management
│   └── [other pages]/
├── lib/                    # Utilities and helpers
│   ├── db.ts              # Database client
│   ├── seo-audit.ts       # SEO analysis utilities
│   └── [other libs]/
├── services/               # Business logic
│   ├── api/               # External API clients
│   ├── notifications/     # Email service
│   └── [other services]/
├── database/               # Database schemas (19 files)
├── mcp-servers/           # MCP servers
│   └── seo-toolkit/       # SEO Toolkit MCP Server
├── tests/                 # Test suites
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # E2E tests
├── scripts/               # Build and utility scripts
└── docs/                  # Documentation
```

---

## 🔑 Environment Variables

### Required APIs
```bash
# AI Services
ANTHROPIC_API_KEY=sk-ant-...     # Claude AI (✅ configured)
OPENAI_API_KEY=sk-...            # OpenAI (✅ configured)
PERPLEXITY_API_KEY=pplx-...      # Perplexity (✅ configured)

# SEO Tools
GOOGLE_API_KEY=AIza...           # PageSpeed (✅ configured)
SEMRUSH_API_KEY=...              # SEMrush (⚠️ needs valid key)
FIRECRAWL_API_KEY=fc-...         # Firecrawl (✅ configured)
DATAFORSEO_API_KEY=...           # DataForSEO (✅ configured)

# Database
POSTGRES_URL=postgresql://...    # Supabase (✅ configured)
SQLITE_PATH=./data/geo-seo.db    # Local dev (auto)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...     # Supabase URL (✅ configured)
NEXT_PUBLIC_SUPABASE_ANON_KEY=...# Supabase key (✅ configured)
```

---

## 🗄️ Database Quick Reference

### Auto-Detection
- **Development:** SQLite at `./data/geo-seo.db`
- **Production:** PostgreSQL via `POSTGRES_URL`

### Key Tables
| Category | Tables |
|----------|--------|
| Core SEO | companies, audits, keywords, rankings |
| AI Search | ai_search_campaigns, campaign_strategies |
| Tracking | local_pack_tracking, backlinks, content_gaps |
| Integrations | integration_registry, webhooks |
| Projects | hub_projects, hub_sandbox_sessions |
| Scheduler | scheduled_jobs, job_runs |
| Support | support_tickets |

### Common Queries
```sql
-- Get all companies
SELECT * FROM companies;

-- Get latest audit for company
SELECT * FROM audits WHERE company_id = ? ORDER BY created_at DESC LIMIT 1;

-- Get keyword rankings
SELECT * FROM rankings WHERE company_id = ? ORDER BY check_date DESC;

-- Get scheduled jobs
SELECT * FROM scheduled_jobs WHERE status = 'active';
```

---

## 🛠️ MCP Server Quick Reference

### Location
`mcp-servers/seo-toolkit/`

### Setup
```bash
# Windows
cd mcp-servers\seo-toolkit
.\setup.bat

# macOS/Linux
cd mcp-servers/seo-toolkit
chmod +x setup.sh
./setup.sh
```

### 12 Available Tools

| Tool | Description |
|------|-------------|
| `run_lighthouse_audit` | Google PageSpeed audit + Core Web Vitals |
| `analyze_technical_seo` | On-page SEO analysis with Firecrawl |
| `get_keyword_data` | SEMrush keyword metrics |
| `find_keyword_opportunities` | Discover new keywords |
| `get_keyword_rankings` | Track keyword positions |
| `analyze_competitors` | Top 10 organic competitors |
| `get_backlink_profile` | Backlink analysis |
| `analyze_local_seo` | Local SEO scoring |
| `find_citation_sources` | Industry-specific citations |
| `analyze_content_for_ai` | AI search optimization |
| `generate_content_outline` | E-E-A-T optimized outlines |
| `get_company_overview` | Complete company SEO profile |

### Natural Language Examples
```
"Run a Lighthouse audit for https://example.com"
"What's the search volume for 'local seo services'?"
"Find competitors for example.com"
"Analyze local SEO for ABC Plumbing in San Francisco"
"Create a content outline for 'emergency plumber'"
```

---

## 📊 23 Pages Overview

### Main Navigation
1. **Dashboard** - Overview with metrics and charts
2. **Companies** - Manage client companies
3. **Keywords** - Keyword tracking and research
4. **Rankings** - Rank tracking and history
5. **Audits** - SEO audit history
6. **Backlinks** - Backlink profile analysis
7. **Content Gaps** - Competitor content analysis
8. **AI Strategy** - AI search optimization campaigns
9. **AI Visibility** - AI platform visibility tracking
10. **Reports** - Generate and export reports
11. **Projects** - Project management hub
12. **Resources** - Prompt library and tools
13. **Settings** - User and system settings
14. **Support** - Help and support tickets

### Company-Specific
15. `/companies/[id]/seo-audit` - Individual company audit
16. `/companies/[id]/keywords` - Company keywords
17. `/companies/[id]/rankings` - Company rankings

### Admin/Tools
18. **Schedule** - Scheduled job management
19. **Sandbox** - Testing environment
20. **Terminal Pro** - Terminal interface
21. **Onboarding** - User onboarding flow
22. **Login/Signup** - Authentication
23. **Analytics** - Usage analytics

---

## 🔌 API Routes (87 Total)

### Core SEO
- `POST /api/audit` - Run SEO audit
- `GET /api/companies` - List companies
- `GET /api/keywords` - List keywords
- `GET /api/rankings` - Get rankings
- `POST /api/rankings/check` - Check rankings now

### Integrations
- `POST /api/integrations/lighthouse/audit` - Lighthouse audit
- `POST /api/integrations/semrush/keywords` - SEMrush keywords
- `POST /api/integrations/claude/query` - Claude AI query
- `POST /api/integrations/firecrawl/scrape` - Firecrawl scrape
- `POST /api/integrations/perplexity/query` - Perplexity query

### Scheduler
- `GET /api/scheduled-jobs` - List scheduled jobs
- `POST /api/scheduled-jobs` - Create scheduled job
- `DELETE /api/scheduled-jobs/[id]` - Delete job

### System
- `GET /api/settings` - Get settings
- `POST /api/support/contact` - Submit support ticket
- `GET /api/usage` - Get usage stats

---

## 🧪 Testing Quick Reference

### Unit Tests
```typescript
// tests/unit/lib/seo-audit.test.ts
import { describe, it, expect } from 'vitest';

describe('SEO Audit', () => {
  it('should calculate E-E-A-T score', () => {
    const score = calculateEEATScore(metrics);
    expect(score).toBeGreaterThan(0);
  });
});
```

### Integration Tests
```typescript
// tests/integration/database/connection.test.ts
import { beforeAll, afterAll } from 'vitest';
import { DatabaseClient } from '@/lib/db';

let db: DatabaseClient;
beforeAll(async () => {
  db = new DatabaseClient();
  await db.initialize();
});
```

### E2E Tests
```typescript
// tests/e2e/playwright/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test('dashboard loads', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

---

## 🐛 Debugging Tips

### Database Issues
```bash
# Check connection
npm run db:test:verbose

# Reinitialize database
npm run db:init:verify

# Check for missing tables
npm run db:test:verbose | grep "Missing"
```

### API Issues
```bash
# Verify API keys
npm run check:apis

# Check environment variables
npm run check:env

# Test specific API
curl -X POST http://localhost:3000/api/integrations/lighthouse/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Build Issues
```bash
# Clean build
rm -rf .next
npm run build

# Check TypeScript errors
npx tsc --noEmit

# Check for dependency issues
npm audit
npm audit fix
```

---

## 📈 Performance Targets

### Lighthouse Scores
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90

### Core Web Vitals
- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1

### API Response Times
- 50th percentile: <200ms
- 95th percentile: <500ms
- 99th percentile: <1s

---

## 🔒 Security Checklist

### Before Production
- [ ] Enable Row Level Security (RLS) in Supabase
- [ ] Implement CSRF protection
- [ ] Set up rate limiting
- [ ] Configure security headers
- [ ] Test authentication flows
- [ ] Audit dependencies (`npm audit`)
- [ ] Review environment variables
- [ ] Enable HTTPS only

---

## 📚 Documentation Links

- [PRE_LAUNCH_CHECKLIST.md](./PRE_LAUNCH_CHECKLIST.md) - Complete launch checklist
- [WORK_COMPLETED_SUMMARY.md](./WORK_COMPLETED_SUMMARY.md) - What's been done
- [CLAUDE.md](./CLAUDE.md) - Project architecture
- [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md) - Database design
- [mcp-servers/seo-toolkit/README.md](./mcp-servers/seo-toolkit/README.md) - MCP docs
- [tests/setup.md](./tests/setup.md) - Testing guide

---

## 🆘 Common Issues & Solutions

### "Database connection failed"
```bash
# Check POSTGRES_URL is set
echo $POSTGRES_URL

# Test connection
npm run db:test

# Reinitialize
npm run db:init:verify
```

### "API key error"
```bash
# Verify all keys are set
npm run check:env

# Check specific key
echo $ANTHROPIC_API_KEY
```

### "Build failing"
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### "Tests not running"
```bash
# Reinstall test dependencies
npm install --save-dev vitest @testing-library/react

# Run with verbose output
npm test -- --reporter=verbose
```

---

## 🎯 Next Steps

### Immediate
1. Run `npm run check:all` to verify setup
2. Review `PRE_LAUNCH_CHECKLIST.md`
3. Obtain valid SEMrush API key
4. Set up error tracking (Sentry)

### Before Launch
1. Complete security hardening
2. Set up monitoring and backups
3. Write legal documents (Privacy Policy, ToS)
4. Expand test coverage to 80%+
5. Conduct load testing

---

**Quick Help:** For detailed information on any topic, refer to the comprehensive documentation in the root directory.

**Support:** Create an issue in the GitHub repository or contact the development team.

**Version:** 1.0.0 | **Status:** Ready for Alpha Testing
