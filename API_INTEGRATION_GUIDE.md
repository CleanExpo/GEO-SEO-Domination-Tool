# API Integration & Error Handling Guide

**Last Updated:** 2025-10-05

This guide provides comprehensive information about the API integrations, error handling, and setup instructions for the GEO SEO Domination Tool.

---

## Table of Contents

1. [Overview](#overview)
2. [Required API Keys](#required-api-keys)
3. [API Integration Details](#api-integration-details)
4. [Error Handling](#error-handling)
5. [Database Tables](#database-tables)
6. [Testing & Validation](#testing--validation)

---

## Overview

The application uses multiple external APIs to provide comprehensive SEO analysis, keyword research, and ranking tracking capabilities. All integrations include:

- ✅ Graceful fallback when API keys are missing
- ✅ Comprehensive error handling with specific error codes
- ✅ Rate limit detection and fallback mechanisms
- ✅ Detailed logging for debugging
- ✅ API status tracking in responses

---

## Required API Keys

### Core APIs (Recommended)

| API | Environment Variable | Purpose | Free Tier | Get API Key |
|-----|---------------------|---------|-----------|-------------|
| **Google PageSpeed** | `GOOGLE_PAGESPEED_API_KEY` or `GOOGLE_API_KEY` | Lighthouse audits, performance metrics | Yes (25,000 requests/day) | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| **SEMrush** | `SEMRUSH_API_KEY` | Keyword data enrichment (volume, CPC, difficulty) | Limited | [SEMrush API](https://www.semrush.com/api-documentation/) |
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Database & authentication | Yes (500MB, 50K users) | [Supabase Dashboard](https://app.supabase.com) |

### Optional APIs (Enhanced Features)

| API | Environment Variable | Purpose | Free Tier |
|-----|---------------------|---------|-----------|
| **Firecrawl** | `FIRECRAWL_API_KEY` | Advanced web scraping for SEO data | Limited |
| **Google Custom Search** | `GOOGLE_SEARCH_ENGINE_ID`, `GOOGLE_API_KEY` | Ranking checks via API (more reliable than scraping) | 100 searches/day |
| **Perplexity** | `PERPLEXITY_API_KEY` | AI-powered content analysis | Limited |
| **Anthropic Claude** | `ANTHROPIC_API_KEY` | Advanced AI features | Pay-as-you-go |

---

## API Integration Details

### 1. SEMrush Integration (`/api/keywords`)

**Status:** ✅ Fixed with comprehensive error handling

**Features:**
- Keyword data enrichment (search volume, CPC, difficulty)
- Graceful fallback when API key is missing
- Detailed error logging

**Request:**
```bash
POST /api/keywords
Content-Type: application/json

{
  "company_id": "uuid",
  "keyword": "seo tools"
}
```

**Response:**
```json
{
  "keyword": {
    "id": "uuid",
    "keyword": "seo tools",
    "search_volume": 12000,
    "cpc": 2.45,
    "difficulty": 58
  },
  "enrichment": {
    "status": "success",
    "hasData": true
  }
}
```

**Enrichment Status Values:**
- `success` - SEMrush data retrieved successfully
- `no_api_key` - API key not configured (keyword created without enrichment)
- `no_data` - SEMrush returned empty response
- `failed` - API request failed (network/rate limit)

**Error Handling:**
- ✅ Missing API key: Warning logged, keyword created without enrichment
- ✅ API failure: Error logged, keyword created without enrichment
- ✅ Rate limiting: Graceful fallback to basic keyword creation
- ✅ Invalid keyword: Validation error returned (400)

---

### 2. Lighthouse Integration (`/api/seo-audits`)

**Status:** ✅ Fixed with multiple API key support and rate limit handling

**Features:**
- Performance, accessibility, SEO, and best practices scores
- Supports both `GOOGLE_PAGESPEED_API_KEY` and `GOOGLE_API_KEY`
- Automatic fallback to basic audit when API unavailable
- Rate limit detection and handling

**Request:**
```bash
POST /api/seo-audits
Content-Type: application/json

{
  "company_id": "uuid",
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "audit": {
    "id": "uuid",
    "url": "https://example.com",
    "overall_score": 85,
    "performance_score": 90,
    "seo_score": 95,
    "accessibility_score": 88,
    "issues": [...],
    "recommendations": [...]
  },
  "integrations": {
    "lighthouse": true,
    "firecrawl": false
  }
}
```

**Error Handling:**
- ✅ Missing API key: Falls back to basic audit (cheerio-based)
- ✅ Rate limit (429): Logged, falls back to basic audit
- ✅ Authentication failure (403): Error logged with instructions
- ✅ Invalid URL: Validation error returned (400)
- ✅ Audit execution failure: Detailed error with API status

**API Status Tracking:**
```json
{
  "metadata": {
    "api_status": {
      "lighthouse": "success" | "failed" | "not_configured",
      "firecrawl": "success" | "failed" | "not_configured"
    }
  }
}
```

---

### 3. Rankings API (`/api/rankings/check`)

**Status:** ✅ Fixed with Google Custom Search API support

**Features:**
- Dual method support: Google Custom Search API + web scraping fallback
- Checks rankings on both Google and Bing
- Automatic method selection based on API availability
- Detailed logging and error tracking

**Request:**
```bash
POST /api/rankings/check
Content-Type: application/json

{
  "keyword_id": "uuid",
  "company_id": "uuid"
}
```

**Response:**
```json
{
  "message": "Ranking check completed successfully",
  "api_status": {
    "google_api": "configured" | "not_configured",
    "method": "api" | "web_scraping"
  }
}
```

**Google Custom Search API Setup:**

1. **Create a Custom Search Engine:**
   - Visit: https://programmablesearchengine.google.com/
   - Click "Add" to create new search engine
   - Set "Sites to search" to "Search the entire web"
   - Copy the "Search Engine ID" (starts with partner-pub- or similar)
   - Set as `GOOGLE_SEARCH_ENGINE_ID` environment variable

2. **Get API Key:**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Create new API key or use existing
   - Enable "Custom Search API"
   - Set as `GOOGLE_API_KEY` or `GOOGLE_SEARCH_API_KEY`

**Fallback Behavior:**
- If Google API configured: Uses Custom Search API (more reliable)
- If not configured: Falls back to web scraping (may be blocked by Google)
- Detailed warnings logged when using fallback method

**Error Handling:**
- ✅ Keyword not found: 404 response with keyword ID
- ✅ Company not found: 404 response with company ID
- ✅ Google API failure: Falls back to web scraping
- ✅ Both methods fail: Detailed error logged

---

### 4. Job Scheduler APIs

**Status:** ✅ Migrated to Supabase (from direct PostgreSQL)

Two separate systems with different purposes:

#### A. Job Schedules (`/api/jobs/schedule`)

**Purpose:** Manage cron schedules for background jobs
**Table:** `job_schedules`

**Endpoints:**
- `GET /api/jobs/schedule` - List all job schedules
- `POST /api/jobs/schedule` - Create/update job schedule
- `PUT /api/jobs/schedule` - Update specific fields
- `DELETE /api/jobs/schedule?job=<name>` - Delete job schedule

**Example:**
```bash
POST /api/jobs/schedule
Content-Type: application/json
x-api-key: your-api-key

{
  "jobName": "ranking-tracker",
  "schedule": "0 3 * * *",
  "enabled": true,
  "description": "Track keyword rankings daily"
}
```

#### B. Scheduled Jobs (`/api/scheduled-jobs`)

**Purpose:** Manage individual scheduled tasks (ranking checks, audits, reports)
**Table:** `scheduled_jobs`

**Endpoints:**
- `GET /api/scheduled-jobs` - List scheduled jobs
- `POST /api/scheduled-jobs` - Create scheduled job
- `PATCH /api/scheduled-jobs` - Bulk enable/disable jobs

**Example:**
```bash
POST /api/scheduled-jobs
Content-Type: application/json

{
  "job_type": "ranking_check",
  "name": "Daily Rankings",
  "schedule": "0 9 * * *",
  "config": {
    "keywords": ["seo", "keyword research"],
    "search_engine": "google"
  }
}
```

---

## Error Handling

### Standard Error Response Format

All API routes return consistent error responses:

```json
{
  "error": "Human-readable error message",
  "details": "Technical details (optional)",
  "code": "ERROR_CODE (optional)"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation failed, missing required fields |
| 401 | Unauthorized | Invalid or missing API key |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded (external API) |
| 500 | Server Error | Unexpected error occurred |

### Logging Standards

All routes use consistent logging format:

```typescript
console.log('[Route Name] Action description', { context });
console.warn('[Route Name] Warning about issue');
console.error('[Route Name] Error occurred:', errorDetails);
```

**Example:**
```
[Keywords API] Starting keyword creation for "seo tools"
[Keywords API] Successfully enriched keyword with SEMrush data
[SEO Audits API] Lighthouse API rate limit exceeded - falling back to basic audit
```

---

## Database Tables

### Relationship: `scheduled_jobs` vs `job_schedules`

**IMPORTANT:** These are TWO SEPARATE TABLES with different purposes.

#### `job_schedules` Table

**Purpose:** System-level cron schedules for background workers
**Used By:** `/api/jobs/schedule`, background scheduler service

```sql
CREATE TABLE job_schedules (
  id UUID PRIMARY KEY,
  job_name TEXT UNIQUE NOT NULL,
  schedule TEXT NOT NULL,  -- Cron expression
  enabled BOOLEAN DEFAULT TRUE,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Example Records:**
```
job_name: "ranking-tracker"
schedule: "0 3 * * *"  -- Daily at 3 AM
enabled: true
```

#### `scheduled_jobs` Table

**Purpose:** User-created scheduled tasks
**Used By:** `/api/scheduled-jobs`, task scheduler

```sql
CREATE TABLE scheduled_jobs (
  id UUID PRIMARY KEY,
  job_type TEXT NOT NULL,  -- 'ranking_check', 'audit', 'report'
  name TEXT NOT NULL,
  schedule TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  config JSONB NOT NULL,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Example Records:**
```
job_type: "ranking_check"
name: "Daily SEO Rankings"
schedule: "0 9 * * *"
config: {"keywords": ["seo"], "search_engine": "google"}
```

---

## Testing & Validation

### 1. Test SEMrush Integration

```bash
# Without API key (should work with fallback)
curl -X POST http://localhost:3000/api/keywords \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "YOUR_COMPANY_ID",
    "keyword": "test keyword"
  }'

# Expected: Keyword created, enrichment.status = "no_api_key"
```

### 2. Test Lighthouse Integration

```bash
# Test with URL
curl -X POST http://localhost:3000/api/seo-audits \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com"
  }'

# Expected: Audit completed (basic or with Lighthouse data)
# Check integrations.lighthouse in response
```

### 3. Test Rankings Check

```bash
curl -X POST http://localhost:3000/api/rankings/check \
  -H "Content-Type: application/json" \
  -d '{
    "keyword_id": "YOUR_KEYWORD_ID",
    "company_id": "YOUR_COMPANY_ID"
  }'

# Expected: Ranking check completed
# Check api_status.method in response
```

### 4. Test Job Schedules

```bash
# List schedules
curl http://localhost:3000/api/jobs/schedule \
  -H "x-api-key: YOUR_API_KEY"

# Expected: List of schedules or defaults
```

---

## Environment Setup Checklist

### Minimum Required (Application will work)

- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Recommended for Full Functionality

- [ ] `GOOGLE_PAGESPEED_API_KEY` - For Lighthouse audits
- [ ] `SEMRUSH_API_KEY` - For keyword enrichment
- [ ] `GOOGLE_SEARCH_ENGINE_ID` + `GOOGLE_API_KEY` - For reliable ranking checks

### Optional Enhancements

- [ ] `FIRECRAWL_API_KEY` - For advanced web scraping
- [ ] `PERPLEXITY_API_KEY` - For AI content analysis
- [ ] `ANTHROPIC_API_KEY` - For Claude AI features

---

## Troubleshooting

### Issue: Lighthouse audits not working

**Check:**
1. Is `GOOGLE_PAGESPEED_API_KEY` or `GOOGLE_API_KEY` set?
2. Check logs for rate limit (429) errors
3. Verify API key has PageSpeed Insights API enabled

**Solution:**
- Enable API: https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com
- Check quota: https://console.cloud.google.com/apis/api/pagespeedonline.googleapis.com/quotas

### Issue: SEMrush enrichment not working

**Check:**
1. Is `SEMRUSH_API_KEY` set correctly?
2. Check logs for API errors
3. Verify API key is valid

**Solution:**
- Keywords will still be created without enrichment
- Check console for specific error message
- Verify API key: https://www.semrush.com/api-documentation/

### Issue: Rankings always return "not found"

**Check:**
1. Is Google Custom Search API configured?
2. If using web scraping, check for CAPTCHA/blocking

**Solution:**
- Set up Google Custom Search API (recommended)
- Check logs for specific error messages
- Verify website URL matches search results exactly

---

## Support & Resources

- **API Documentation:** See individual API route files in `web-app/app/api/`
- **Database Schema:** `database/SUPABASE-06-job-scheduler.sql`
- **Service Implementations:** `web-app/lib/services/`

---

**Need Help?** Check the logs for detailed error messages. All routes log extensively for debugging.
