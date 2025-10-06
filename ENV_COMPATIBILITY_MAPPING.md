# Environment Variable Compatibility Mapping

## Overview
This document maps environment variables from forked GitHub SEO projects to our unified `.env` configuration, ensuring seamless integration without conflicts.

---

## Our Current Environment Variables

```env
# Database
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

# AI Services
ANTHROPIC_API_KEY
OPENAI_API_KEY
PERPLEXITY_API_KEY

# SEO Tools
SEMRUSH_API_KEY
GOOGLE_API_KEY
FIRECRAWL_API_KEY

# Email Service
EMAIL_PROVIDER
EMAIL_API_KEY
EMAIL_FROM

# Development
NODE_ENV
REDIS_URL

# Integrations
GITHUB_TOKEN
DOCKER_TOKEN
VERCEL_OIDC_TOKEN
```

---

## Project 1: SerpBear (Rank Tracking)

### SerpBear Required Variables
```env
USER=admin                    # Username for SerpBear login
PASSWORD=999999               # Password for SerpBear login
SECRET=<random_string>        # Encryption key for API keys
APIKEY=<random_string>        # API key for SerpBear API access
SESSION_DURATION=24           # Hours for session duration
NEXT_PUBLIC_APP_URL=http://localhost:3000
SCREENSHOT_API=<thum.io_key>  # Optional: Website screenshots
```

### Integration Strategy
**✅ COMPATIBLE** - SerpBear uses its own namespace, no conflicts

**Mapping:**
- Keep all SerpBear variables as-is (no overlap with our vars)
- Add to our `.env.local`:
  ```env
  # SerpBear Rank Tracking
  SERPBEAR_USER=admin
  SERPBEAR_PASSWORD=your_secure_password
  SERPBEAR_SECRET=your_random_secret_key
  SERPBEAR_APIKEY=your_serpbear_api_key
  SERPBEAR_SESSION_DURATION=24
  SERPBEAR_SCREENSHOT_API=your_thum_io_key  # Optional
  ```

**Integration Path:**
- Mount SerpBear as `/seo/rank-tracking` route in our Next.js app
- Use our `NEXT_PUBLIC_SUPABASE_URL` for SerpBear database (replace SQLite)
- Share authentication with our CRM (single sign-on)

---

## Project 2: SEO Dashboard (Google Search Console)

### SEO Dashboard Required Variables
```env
# Google Search Console API
GOOGLE_CLIENT_ID=<oauth_client_id>
GOOGLE_CLIENT_SECRET=<oauth_client_secret>
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# MySQL Database (we'll replace with Supabase)
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=seo_dashboard
```

### Integration Strategy
**✅ COMPATIBLE** - Uses Google OAuth, we'll adapt to Supabase

**Mapping:**
- Google OAuth variables (new additions):
  ```env
  # Google Search Console Integration
  GOOGLE_OAUTH_CLIENT_ID=your_client_id
  GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
  GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
  ```

- Database replacement:
  - ❌ Remove: All `MYSQL_*` variables
  - ✅ Use: Our existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Integration Path:**
- Port MySQL schema to Supabase
- Rewrite database queries to use Supabase client
- Mount as `/seo/search-console` in our app
- Store GSC data in our Supabase tables

---

## Project 3: SiteOne Crawler (Technical SEO)

### SiteOne Crawler Configuration
```bash
# CLI-based tool, no .env file required
# Configuration via command-line flags:
--url=https://example.com
--auth=username:password       # Optional HTTP auth
--proxy=host:port              # Optional proxy
--smtp-host=localhost          # For email reports
--smtp-user=user              # SMTP auth (optional)
--smtp-password=pass          # SMTP auth (optional)
```

### Integration Strategy
**✅ COMPATIBLE** - CLI tool, no environment conflicts

**Mapping:**
- Use our existing email config for reports:
  ```env
  # SiteOne Crawler Email Reports (reuse existing)
  EMAIL_PROVIDER=resend
  EMAIL_API_KEY=your_email_api_key
  EMAIL_FROM=seo-reports@yourdomain.com
  ```

**Integration Path:**
- Wrap SiteOne Crawler as MCP server tool
- Call via Node.js `child_process` with CLI flags
- Store results in Supabase (`technical_audits` table)
- Trigger via CRM button click

---

## Project 4: Google My Business API

### Google My Business Required Variables
```env
# OAuth 2.0 Credentials
GOOGLE_MY_BUSINESS_CLIENT_ID=<oauth_client_id>
GOOGLE_MY_BUSINESS_CLIENT_SECRET=<oauth_client_secret>
GOOGLE_MY_BUSINESS_REFRESH_TOKEN=<user_specific_token>

# Or Service Account (preferred for automation)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=<private_key>
```

### Integration Strategy
**✅ COMPATIBLE** - New Google service, no conflicts

**Mapping:**
- Add to our `.env.local`:
  ```env
  # Google Business Profile API
  GOOGLE_MY_BUSINESS_CLIENT_ID=your_oauth_client_id
  GOOGLE_MY_BUSINESS_CLIENT_SECRET=your_oauth_client_secret
  GOOGLE_MY_BUSINESS_REFRESH_TOKEN=user_refresh_token

  # Or use Service Account (recommended)
  GOOGLE_SERVICE_ACCOUNT_EMAIL=automation@project.iam.gserviceaccount.com
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
  ```

**Integration Path:**
- Create API route `/api/google/business-profile`
- Store OAuth tokens in Supabase `integrations` table
- Link to company profiles in CRM
- Auto-sync reviews, posts, insights

---

## Project 5: Socioboard (Social Media Management)

### Socioboard Required Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/socioboard
REDIS_HOST=localhost
REDIS_PORT=6379

# Social Platform API Keys
FACEBOOK_APP_ID=<app_id>
FACEBOOK_APP_SECRET=<app_secret>
TWITTER_CONSUMER_KEY=<consumer_key>
TWITTER_CONSUMER_SECRET=<consumer_secret>
LINKEDIN_CLIENT_ID=<client_id>
LINKEDIN_CLIENT_SECRET=<client_secret>
INSTAGRAM_CLIENT_ID=<client_id>
INSTAGRAM_CLIENT_SECRET=<client_secret>
```

### Integration Strategy
**⚠️ PARTIAL COMPATIBILITY** - Uses MongoDB, we'll need adapter

**Mapping:**
- Social API keys (new additions):
  ```env
  # Social Media Integrations
  FACEBOOK_APP_ID=your_fb_app_id
  FACEBOOK_APP_SECRET=your_fb_app_secret
  TWITTER_CONSUMER_KEY=your_twitter_key
  TWITTER_CONSUMER_SECRET=your_twitter_secret
  LINKEDIN_CLIENT_ID=your_linkedin_id
  LINKEDIN_CLIENT_SECRET=your_linkedin_secret
  INSTAGRAM_CLIENT_ID=your_ig_id
  INSTAGRAM_CLIENT_SECRET=your_ig_secret
  ```

- Database replacement:
  - ❌ MongoDB → ✅ Supabase (requires schema migration)
  - ✅ Redis: Use our existing `REDIS_URL` (already configured)

**Integration Path:**
- Fork Socioboard and replace MongoDB with Supabase
- Create adapter layer for data models
- Mount as `/crm/social-media` in our app
- Link social accounts to company profiles

---

## Unified .env.local Template

```env
# ============================================
# GEO-SEO Domination Tool - Unified Config
# ============================================

# --- Core Database ---
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# --- AI Services ---
ANTHROPIC_API_KEY=sk-ant-your_key
OPENAI_API_KEY=sk-your_key
PERPLEXITY_API_KEY=pplx-your_key

# --- SEO Tools ---
SEMRUSH_API_KEY=your_semrush_key
GOOGLE_API_KEY=your_google_key
FIRECRAWL_API_KEY=fc-your_key

# --- Email Service ---
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_your_key
EMAIL_FROM=noreply@yourdomain.com

# --- Redis Cache ---
REDIS_URL=redis://localhost:6379

# --- Integrations ---
GITHUB_TOKEN=ghp_your_token
DOCKER_TOKEN=dckr_pat_your_token
VERCEL_OIDC_TOKEN=your_oidc_token

# ============================================
# SerpBear - Rank Tracking
# ============================================
SERPBEAR_USER=admin
SERPBEAR_PASSWORD=your_secure_password
SERPBEAR_SECRET=your_random_32char_secret
SERPBEAR_APIKEY=your_random_32char_apikey
SERPBEAR_SESSION_DURATION=24
SERPBEAR_SCREENSHOT_API=your_thum_io_key

# ============================================
# Google Search Console Integration
# ============================================
GOOGLE_OAUTH_CLIENT_ID=your_gsc_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_gsc_client_secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# ============================================
# Google Business Profile API
# ============================================
GOOGLE_MY_BUSINESS_CLIENT_ID=your_gmb_client_id
GOOGLE_MY_BUSINESS_CLIENT_SECRET=your_gmb_client_secret
GOOGLE_SERVICE_ACCOUNT_EMAIL=automation@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ============================================
# Social Media Integrations (Socioboard)
# ============================================
FACEBOOK_APP_ID=your_fb_app_id
FACEBOOK_APP_SECRET=your_fb_app_secret
TWITTER_CONSUMER_KEY=your_twitter_key
TWITTER_CONSUMER_SECRET=your_twitter_secret
LINKEDIN_CLIENT_ID=your_linkedin_id
LINKEDIN_CLIENT_SECRET=your_linkedin_secret
INSTAGRAM_CLIENT_ID=your_ig_id
INSTAGRAM_CLIENT_SECRET=your_ig_secret
YOUTUBE_API_KEY=your_youtube_key

# ============================================
# Development
# ============================================
NODE_ENV=development
```

---

## Database Migration Strategy

### Projects Using Different Databases

| Project | Original DB | Our Solution | Migration Effort |
|---------|-------------|--------------|------------------|
| SerpBear | SQLite | Supabase PostgreSQL | Low - Simple schema |
| SEO Dashboard | MySQL | Supabase PostgreSQL | Medium - Port schema |
| Socioboard | MongoDB | Supabase PostgreSQL | High - Data model redesign |
| SiteOne Crawler | File-based | Supabase PostgreSQL | Low - Store results only |
| GMB API | No DB | Supabase PostgreSQL | Low - New tables |

### Unified Database Schema Additions

```sql
-- Add to existing Supabase schema:

-- SerpBear rank tracking
CREATE TABLE serpbear_keywords (...);
CREATE TABLE serpbear_domains (...);
CREATE TABLE serpbear_rankings (...);

-- Google Search Console
CREATE TABLE gsc_queries (...);
CREATE TABLE gsc_pages (...);
CREATE TABLE gsc_performance (...);

-- Technical SEO audits (SiteOne Crawler)
CREATE TABLE technical_audits (...);
CREATE TABLE audit_issues (...);

-- Google Business Profile
CREATE TABLE gmb_locations (...);
CREATE TABLE gmb_reviews (...);
CREATE TABLE gmb_insights (...);

-- Social Media (Socioboard)
CREATE TABLE social_accounts (...);
CREATE TABLE social_posts (...);
CREATE TABLE social_analytics (...);
```

---

## Security Considerations

### Secret Management
- ✅ Use `.env.local` for development (gitignored)
- ✅ Use Vercel environment variables for production
- ✅ Encrypt sensitive keys with `SERPBEAR_SECRET`
- ✅ Store OAuth tokens in Supabase `integrations` table (encrypted)
- ❌ Never commit `.env.local` to Git

### OAuth Token Storage
```typescript
// Store in Supabase instead of environment
await supabase.from('integrations').insert({
  company_id: companyId,
  platform: 'google_search_console',
  access_token: encryptedToken,
  refresh_token: encryptedRefreshToken,
  expires_at: tokenExpiry
});
```

---

## Integration Priority

### Phase 1: Quick Wins (Week 1-2)
1. ✅ SerpBear - Already uses Next.js, minimal adaptation
2. ✅ Google Search Console API - Official Google samples available
3. ✅ SiteOne Crawler - CLI tool, wrap as MCP server

### Phase 2: Medium Effort (Week 3-4)
4. ✅ Google My Business API - OAuth setup + new tables
5. ⚠️ SEO Dashboard - MySQL to Supabase migration

### Phase 3: Complex (Week 5-6)
6. ⚠️ Socioboard - MongoDB to Supabase redesign

---

## Validation Checklist

Before forking and integrating each project:

- [ ] Verify environment variable namespace doesn't conflict
- [ ] Confirm database can be migrated to Supabase
- [ ] Check authentication method (API key, OAuth, service account)
- [ ] Ensure Next.js 15 compatibility
- [ ] Review license compatibility (MIT, Apache 2.0, etc.)
- [ ] Test in development before production deployment
- [ ] Document any breaking changes or custom modifications

---

## Next Steps

1. ✅ Create this compatibility mapping (DONE)
2. Fork SerpBear and test with our `.env.local`
3. Create Supabase schema for rank tracking tables
4. Build unified authentication layer
5. Test Google OAuth flow with our credentials
6. Document any issues in `INTEGRATION_NOTES.md`
