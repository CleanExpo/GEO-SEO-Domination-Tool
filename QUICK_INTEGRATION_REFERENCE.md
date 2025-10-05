# Quick Integration Reference Card

**Last Updated:** 2025-10-05

A quick reference for developers working with the API integrations.

---

## Environment Variables Quick Reference

```bash
# ========== REQUIRED ==========
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# ========== RECOMMENDED ==========
# Lighthouse Performance Audits (25K requests/day free)
GOOGLE_PAGESPEED_API_KEY=xxx

# Keyword Data Enrichment (limited free tier)
SEMRUSH_API_KEY=xxx

# Reliable Ranking Checks (100 searches/day free)
GOOGLE_SEARCH_ENGINE_ID=xxx
GOOGLE_API_KEY=xxx

# ========== OPTIONAL ==========
FIRECRAWL_API_KEY=xxx
PERPLEXITY_API_KEY=xxx
ANTHROPIC_API_KEY=xxx
```

---

## API Routes & Error Handling

### Keywords API - `/api/keywords`

```typescript
// ✅ Works without SEMRUSH_API_KEY (creates keyword without enrichment)
POST /api/keywords
{
  "company_id": "uuid",
  "keyword": "seo tools"
}

// Response includes enrichment status
{
  "keyword": {...},
  "enrichment": {
    "status": "success" | "no_api_key" | "failed" | "no_data",
    "hasData": true/false
  }
}
```

**Errors:**
- Missing API key → Warning, keyword created without enrichment
- API failure → Error logged, keyword created without enrichment
- Invalid data → Validation error (400)

---

### SEO Audits API - `/api/seo-audits`

```typescript
// ✅ Works without API keys (falls back to basic audit)
POST /api/seo-audits
{
  "company_id": "uuid",
  "url": "https://example.com"
}

// Response includes integration status
{
  "audit": {...},
  "integrations": {
    "lighthouse": true/false,
    "firecrawl": true/false
  }
}
```

**Errors:**
- Missing API keys → Falls back to basic audit
- Rate limit (429) → Falls back to basic audit
- Invalid URL → Validation error (400)
- Audit failure → Detailed error with API status

---

### Rankings API - `/api/rankings/check`

```typescript
// ✅ Works without Google API (falls back to web scraping)
POST /api/rankings/check
{
  "keyword_id": "uuid",
  "company_id": "uuid"
}

// Response includes API status
{
  "message": "Ranking check completed successfully",
  "api_status": {
    "google_api": "configured" | "not_configured",
    "method": "api" | "web_scraping"
  }
}
```

**Errors:**
- Missing Google API → Uses web scraping (may be blocked)
- Keyword not found → 404 error
- Company not found → 404 error
- Both methods fail → Error with details

---

### Job Schedules API - `/api/jobs/schedule`

```typescript
// List schedules
GET /api/jobs/schedule
Headers: x-api-key: xxx

// Create/update schedule
POST /api/jobs/schedule
Headers: x-api-key: xxx
{
  "jobName": "ranking-tracker",
  "schedule": "0 3 * * *",
  "enabled": true
}

// Update schedule
PUT /api/jobs/schedule
Headers: x-api-key: xxx
{
  "jobName": "ranking-tracker",
  "schedule": "0 4 * * *"
}

// Delete schedule
DELETE /api/jobs/schedule?job=ranking-tracker
Headers: x-api-key: xxx
```

**Uses:** `job_schedules` table (system-level cron schedules)

---

### Scheduled Jobs API - `/api/scheduled-jobs`

```typescript
// List scheduled jobs
GET /api/scheduled-jobs?company_id=uuid

// Create scheduled job
POST /api/scheduled-jobs
{
  "job_type": "ranking_check",
  "name": "Daily Rankings",
  "schedule": "0 9 * * *",
  "config": {
    "keywords": ["seo"],
    "search_engine": "google"
  }
}
```

**Uses:** `scheduled_jobs` table (user-created tasks)

---

## Common Cron Patterns

```bash
"0 * * * *"      # Every hour
"0 9 * * *"      # Daily at 9 AM
"0 2 * * *"      # Daily at 2 AM
"0 8 * * 1"      # Every Monday at 8 AM
"*/15 * * * *"   # Every 15 minutes
"0 0 * * 0"      # Every Sunday at midnight
```

---

## Error Response Format

All APIs return consistent error responses:

```typescript
{
  "error": "Human-readable error message",
  "details": "Technical details (optional)",
  "code": "ERROR_CODE (optional)"
}
```

---

## HTTP Status Codes

| Code | Meaning | Common Use Cases |
|------|---------|------------------|
| 200 | Success | Request completed |
| 201 | Created | Resource created |
| 400 | Bad Request | Validation failed |
| 401 | Unauthorized | Invalid API key |
| 404 | Not Found | Resource not found |
| 429 | Rate Limited | External API rate limit |
| 500 | Server Error | Unexpected error |

---

## Logging Format

All routes use consistent logging:

```typescript
console.log('[Route Name] Action', { context });
console.warn('[Route Name] Warning');
console.error('[Route Name] Error:', details);
```

**Examples:**
```
[Keywords API] Successfully enriched keyword "seo tools" with SEMrush data
[SEO Audits API] Lighthouse API rate limit exceeded - falling back to basic audit
[Rankings Check API] Google API not configured - using web scraping fallback
```

---

## Quick Setup: Google Custom Search API

1. **Create Search Engine:**
   - Go to: https://programmablesearchengine.google.com/
   - Create new → Search the entire web
   - Copy Search Engine ID

2. **Get API Key:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Create API key
   - Enable "Custom Search API"

3. **Set Environment Variables:**
   ```bash
   GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
   GOOGLE_API_KEY=your-api-key
   ```

4. **Verify:**
   ```bash
   curl "https://www.googleapis.com/customsearch/v1?key=YOUR_KEY&cx=YOUR_ID&q=test"
   ```

---

## Database Tables

### `job_schedules` (System-level cron schedules)

```sql
- job_name: "ranking-tracker"
- schedule: "0 3 * * *"
- enabled: true
- Used by: /api/jobs/schedule
```

### `scheduled_jobs` (User-created tasks)

```sql
- job_type: "ranking_check"
- name: "Daily SEO Rankings"
- schedule: "0 9 * * *"
- config: {"keywords": ["seo"]}
- Used by: /api/scheduled-jobs
```

**Note:** These are SEPARATE tables with different purposes.

---

## Testing Quick Commands

```bash
# Test Keywords API (no API key needed)
curl -X POST http://localhost:3000/api/keywords \
  -H "Content-Type: application/json" \
  -d '{"company_id": "test", "keyword": "test"}'

# Test SEO Audits API (no API key needed)
curl -X POST http://localhost:3000/api/seo-audits \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Test Rankings API (no API key needed)
curl -X POST http://localhost:3000/api/rankings/check \
  -H "Content-Type: application/json" \
  -d '{"keyword_id": "test", "company_id": "test"}'

# Test Job Schedules (API key required)
curl http://localhost:3000/api/jobs/schedule \
  -H "x-api-key: test"
```

---

## Troubleshooting Checklist

### Lighthouse Audits Not Working
- [ ] Check if `GOOGLE_PAGESPEED_API_KEY` is set
- [ ] Verify API enabled in Google Cloud Console
- [ ] Check logs for rate limit (429) errors
- [ ] Falls back to basic audit automatically

### SEMrush Enrichment Not Working
- [ ] Check if `SEMRUSH_API_KEY` is set
- [ ] Verify API key is valid
- [ ] Keywords still created without enrichment
- [ ] Check console for error details

### Rankings Always "Not Found"
- [ ] Set up Google Custom Search API (recommended)
- [ ] Check if website URL matches exactly
- [ ] Verify search engine covers entire web
- [ ] Falls back to web scraping if API not configured

### Job Scheduler Errors
- [ ] Check Supabase connection
- [ ] Verify `job_schedules` table exists
- [ ] Check API key in request headers
- [ ] Review console logs for details

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `web-app/app/api/keywords/route.ts` | Keywords API with SEMrush |
| `web-app/app/api/seo-audits/route.ts` | SEO Audits API |
| `web-app/lib/seo-audit-enhanced.ts` | Enhanced auditor service |
| `web-app/app/api/rankings/check/route.ts` | Rankings check API |
| `web-app/lib/services/ranking-checker.ts` | Ranking checker service |
| `web-app/app/api/jobs/schedule/route.ts` | Job schedules management |
| `web-app/app/api/jobs/status/route.ts` | Job execution status |
| `web-app/app/api/scheduled-jobs/route.ts` | User scheduled jobs |

---

## Support Resources

- **Full Documentation:** `API_INTEGRATION_GUIDE.md`
- **Fix Summary:** `INTEGRATION_FIXES_SUMMARY.md`
- **Environment Example:** `web-app/.env.example`
- **Database Schema:** `database/SUPABASE-06-job-scheduler.sql`

---

**Remember:** All integrations work without API keys (with reduced functionality). Always check console logs for detailed error messages.
