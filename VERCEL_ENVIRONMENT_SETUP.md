# Vercel Environment Variables Setup

**Project**: GEO-SEO Domination Tool
**Production URL**: https://geo-seo-domination-tool.vercel.app
**Team**: Unite Group
**Project ID**: `prj_FLWtsxapWoPmu8E3sNelMtJkwvsE`

## Required Environment Variables

### Application Configuration
```bash
NEXT_PUBLIC_APP_URL=https://geo-seo-domination-tool.vercel.app
NODE_ENV=production
LOG_LEVEL=info
```

### Database (Supabase - Production)
```bash
# Get these from your Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres
```

### AI Services
```bash
# OpenAI (Primary AI provider - replaces Anthropic)
OPENAI_API_KEY=sk-...

# Anthropic Claude (Optional - if you get more credits)
ANTHROPIC_API_KEY=sk-ant-...

# Perplexity AI (Citations and search)
PERPLEXITY_API_KEY=pplx-...
```

### SEO & Marketing Tools
```bash
# SEMrush for competitor analysis
SEMRUSH_API_KEY=your_semrush_key

# Google APIs
GOOGLE_API_KEY=your_google_api_key

# Firecrawl for web scraping
FIRECRAWL_API_KEY=fc-...
```

### Security
```bash
# Generate strong random strings (use: openssl rand -base64 32)
JWT_SECRET=your_production_jwt_secret
SESSION_SECRET=your_production_session_secret
```

### Email Notifications (Optional)
```bash
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
```

## Setup Commands

### Add Environment Variable via Vercel CLI
```bash
cd geo-seo-domination-tool/web-app

# Add a variable for all environments
vercel env add OPENAI_API_KEY

# Add for specific environment (production, preview, development)
vercel env add OPENAI_API_KEY production
```

### Add Environment Variable via Vercel Dashboard
1. Go to: https://vercel.com/unite-group/web-app/settings/environment-variables
2. Click "Add New"
3. Enter variable name and value
4. Select environments (Production, Preview, Development)
5. Click "Save"

### Pull Environment Variables Locally
```bash
cd geo-seo-domination-tool/web-app
vercel env pull .env.local
```

## Current Status

### ✅ Configured
- Production URL set
- Project deployed and accessible
- Database containers running locally (PostgreSQL, Redis)

### ⚠️ Needs Configuration
- **OPENAI_API_KEY** - You mentioned adding this (TOP PRIORITY)
- SUPABASE credentials for production database
- SEMRUSH_API_KEY for SEO features
- Other API keys as needed

### ❌ Rate Limited
- ANTHROPIC_API_KEY - Reached rate limit, replaced with OpenAI

## Local Development Environment

The local `.env.docker` file has been created with development defaults:
- PostgreSQL: `postgresql://geoseo:dev_password_change_me@localhost:5432/geo_seo_db`
- Redis: `redis://:dev_redis_password@localhost:6379`
- App URL: `http://localhost:3000`

## Testing the Setup

After adding environment variables:

```bash
# Redeploy to apply new environment variables
cd geo-seo-domination-tool/web-app
vercel --prod

# Or trigger redeployment via git push
git push origin main
```

## Priority Environment Variables

**Must Have for Basic Functionality:**
1. ✅ `NEXT_PUBLIC_APP_URL` - Set to production URL
2. 🔄 `OPENAI_API_KEY` - You're adding this now
3. ⚠️ `DATABASE_URL` or Supabase credentials - For data persistence
4. ⚠️ `SEMRUSH_API_KEY` - For SEO features

**Nice to Have:**
- `PERPLEXITY_API_KEY` - Enhanced search capabilities
- `FIRECRAWL_API_KEY` - Web scraping features
- `GOOGLE_API_KEY` - Google integrations
- Email service variables - For notifications

## Verification

Check environment variables are loaded:
```bash
# Via CLI
vercel env ls

# Or visit dashboard
https://vercel.com/unite-group/web-app/settings/environment-variables
```

## Notes

- Environment variables added via dashboard require redeployment to take effect
- Use `NEXT_PUBLIC_` prefix for variables that need to be available in the browser
- Never commit actual API keys to git (use .env files that are in .gitignore)
- Vercel automatically encrypts environment variables

---

**Last Updated**: October 3, 2025
**Status**: Awaiting OPENAI_API_KEY configuration
