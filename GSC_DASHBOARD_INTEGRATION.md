# Google Search Console Dashboard Integration

## Overview
SEO Dashboard has been forked and integrated for automated Google Search Console data extraction and visualization.

**Fork URL**: https://github.com/CleanExpo/SEO-Dashboard
**Local Path**: `D:\GEO_SEO_Domination-Tool\integrations\seo-dashboard`
**Access URL**: http://localhost:3003 (separate port)

---

## What It Does

### ETL Pipeline
1. **Extract** - Pulls organic search data from Google Search Console API
2. **Transform** - Cleans and organizes data by device (mobile, desktop, tablet)
3. **Load** - Stores in Supabase PostgreSQL database
4. **Visualize** - React dashboard with charts and tables

### Data Collected
- **Daily Traffic**: Clicks, impressions, CTR, average position by device
- **Top Keywords**: Best performing search queries with metrics
- **Top URLs**: Best performing pages with traffic data

---

## Integration Status

### ✅ Completed
- [x] Forked to CleanExpo/SEO-Dashboard
- [x] Cloned to `integrations/seo-dashboard/`
- [x] Created Supabase schema (`database/google-search-console-schema.sql`)
- [x] Created `.env.example` template

### 🔄 Next Steps
- [ ] Get Google OAuth credentials
- [ ] Configure `.env.local`
- [ ] Modernize from MySQL to Supabase
- [ ] Install dependencies and test
- [ ] Integrate with our CRM

---

## Database Schema

### Tables Created

#### 1. `gsc_daily_traffic`
Daily aggregated metrics by device
```sql
- company_id (FK to companies)
- clicks, impressions, ctr, position
- date, device (all/mobile/desktop/tablet)
```

#### 2. `gsc_keywords`
Top performing keywords
```sql
- company_id (FK to companies)
- keyword, clicks, impressions, ctr, position
- device, date_range
- geo_seo_keyword_id (FK to our keywords table)
```

#### 3. `gsc_urls`
Top performing pages
```sql
- company_id (FK to companies)
- url, clicks, impressions, ctr, position
- device, date_range
```

#### 4. `gsc_integrations`
OAuth tokens and sync settings per company
```sql
- company_id (FK to companies)
- site_url, access_token, refresh_token
- auto_sync, sync_frequency
- api_quota_limit, api_calls_today
```

#### 5. `gsc_sync_history`
ETL job tracking and debugging
```sql
- company_id, sync_type, status
- records_processed, error_message
- duration_seconds
```

---

## Google OAuth Setup

### Step 1: Create Google Cloud Project
1. Go to https://console.cloud.google.com
2. Create new project: "GEO-SEO Domination Tool"
3. Enable **Google Search Console API**

### Step 2: Create OAuth Credentials
1. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
2. Application type: **Web application**
3. Name: "SEO Dashboard"
4. Authorized redirect URIs:
   ```
   http://localhost:3003/api/auth/google/callback
   https://yourdomain.com/api/auth/google/callback
   ```
5. Copy **Client ID** and **Client Secret**

### Step 3: Configure Environment
Create `integrations/seo-dashboard/.env.local`:
```env
GOOGLE_OAUTH_CLIENT_ID=1234567890-abc123.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-abc123def456
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3003/api/auth/google/callback
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
OPENROUTER_API_KEY=sk-or-v1-your_key_here
PORT=3003
NODE_ENV=development
```

---

## Migration from MySQL to Supabase

### Original Architecture (MySQL)
```
Google API → Python ETL → MySQL → Node.js REST API → React Dashboard
```

### New Architecture (Supabase)
```
Google API → Node.js ETL → Supabase PostgreSQL → Next.js API → React Dashboard
```

### Migration Tasks

1. **Replace Python Scripts** with Node.js/TypeScript:
   ```typescript
   // services/gsc-etl.ts
   import { google } from 'googleapis';
   import { supabase } from '@/lib/supabase';

   async function syncGSCData(companyId: number) {
     const searchconsole = google.searchconsole('v1');
     const response = await searchconsole.searchanalytics.query({
       siteUrl: company.site_url,
       requestBody: {
         startDate: '2025-01-01',
         endDate: '2025-01-31',
         dimensions: ['date', 'device'],
       }
     });

     // Transform and load to Supabase
     await supabase.from('gsc_daily_traffic').insert(transformedData);
   }
   ```

2. **Update REST API** (`4RESTapi/`) to use Supabase client instead of MySQL

3. **Modernize React Dashboard** (`dashboard/`) to Next.js 15 app router

---

## CRM Integration Strategy

### Phase 1: Standalone Dashboard (Week 1)
- Run on port 3003
- Manual OAuth per company
- View data in separate dashboard

### Phase 2: OAuth Management in CRM (Week 2)
Add to our settings page:
```typescript
// web-app/app/settings/integrations/page.tsx
<IntegrationCard
  name="Google Search Console"
  icon={Search}
  connected={company.gsc_integration?.is_active}
  onConnect={() => initiateGoogleOAuth(company.id)}
  onDisconnect={() => revokeGSCAccess(company.id)}
/>
```

### Phase 3: Embedded Dashboard (Week 3)
```typescript
// web-app/app/seo/search-console/page.tsx
<iframe
  src={`http://localhost:3003?company=${companyId}&token=${apiToken}`}
  className="w-full h-screen border-0"
/>
```

### Phase 4: Unified API (Week 4)
Proxy GSC data through our main app:
```typescript
// web-app/app/api/gsc/[...path]/route.ts
export async function GET(request: NextRequest) {
  const companyId = await getCompanyFromSession();
  const gscData = await fetchGSCData(companyId);
  return NextResponse.json(gscData);
}
```

---

## Automation Features

### Daily Sync Job
```typescript
// web-app/services/scheduler/gsc-sync.ts
import cron from 'node-cron';

// Run every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  const companies = await getCompaniesWithGSCEnabled();

  for (const company of companies) {
    try {
      await syncGSCData(company.id);
      console.log(`✅ Synced GSC for ${company.name}`);
    } catch (error) {
      await logSyncError(company.id, error);
    }
  }
});
```

### AI-Powered Insights (OpenRouter + DeepSeek V3)
```typescript
async function analyzeKeywordOpportunities(companyId: number) {
  // Get keywords with high impressions but low CTR
  const opportunities = await supabase
    .from('gsc_keywords')
    .select('*')
    .eq('company_id', companyId)
    .gt('impressions', 100)
    .lt('ctr', 0.02)
    .order('impressions', { ascending: false });

  // Use AI to analyze why CTR is low
  const analysis = await openRouterAnalyze({
    model: 'deepseek/deepseek-chat',
    messages: [{
      role: 'user',
      content: `Analyze these low-performing keywords and suggest improvements: ${JSON.stringify(opportunities)}`
    }]
  });

  return analysis;
}
```

---

## Dashboard Features

### Visualizations Available
1. **Traffic Trends Chart** - Daily clicks and impressions over time
2. **Device Comparison** - Mobile vs Desktop vs Tablet performance
3. **Top Keywords Table** - Sortable by clicks, impressions, CTR, position
4. **Top URLs Table** - Best performing pages
5. **CTR vs Position Scatter** - Find optimization opportunities

### Metrics Displayed
- Total Clicks
- Total Impressions
- Average CTR
- Average Position
- Device Breakdown
- Month-over-Month Changes

---

## API Endpoints

### GSC Data API (Port 3003)
```
GET  /api/traffic/daily?company_id=1&start_date=2025-01-01&end_date=2025-01-31
GET  /api/keywords/top?company_id=1&limit=50&device=mobile
GET  /api/urls/top?company_id=1&limit=50
POST /api/sync/trigger?company_id=1
GET  /api/sync/status?company_id=1
```

### Response Format
```json
{
  "success": true,
  "data": {
    "date": "2025-01-15",
    "clicks": 523,
    "impressions": 1463,
    "ctr": 0.3574,
    "position": 9.58,
    "device": "desktop"
  }
}
```

---

## Installation Steps

### 1. Install Dependencies
```bash
cd integrations/seo-dashboard/4RESTapi
npm install

cd ../dashboard
npm install
```

### 2. Setup Supabase Schema
```bash
# From project root
cd D:/GEO_SEO_Domination-Tool
npm run db:migrate  # Will include google-search-console-schema.sql
```

### 3. Configure Environment
Copy `.env.example` to `.env.local` and fill in your values

### 4. Start Services
```bash
# API Server
cd integrations/seo-dashboard/4RESTapi
npm start  # Port 3003

# Dashboard
cd ../dashboard
npm start  # Port 3004 (or configure)
```

---

## Testing Checklist

- [ ] Google OAuth flow works (authorize → callback → token storage)
- [ ] Can pull data from GSC API
- [ ] Data saves correctly to Supabase tables
- [ ] API endpoints return correct data
- [ ] Dashboard displays traffic charts
- [ ] Device filtering works (mobile/desktop/tablet)
- [ ] Date range filtering works
- [ ] Auto-sync cron job runs successfully
- [ ] API quota tracking prevents rate limits

---

## Environment Variables

### Main App .env.local (Already Updated)
```env
# Google Search Console Integration
GOOGLE_OAUTH_CLIENT_ID=your_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# OpenRouter AI
OPENROUTER_API_KEY=sk-or-v1-your_key
```

### SEO Dashboard .env.local (To Create)
```env
GOOGLE_OAUTH_CLIENT_ID=your_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3003/api/auth/google/callback
DATABASE_URL=postgresql://...
OPENROUTER_API_KEY=sk-or-v1-your_key
PORT=3003
NODE_ENV=development
```

---

## Cost Optimization with OpenRouter

### GSC API Limits
- **Free quota**: 200 queries/day
- **Cost after**: $0.00/query (free!)
- **Max queries per request**: 25,000 rows

### AI Analysis Costs
Using DeepSeek V3 via OpenRouter:
- **Cost**: $0.27/1M input tokens, $1.10/1M output tokens
- **vs GPT-4**: $30/1M tokens (111x cheaper!)
- **Example**: Analyze 100 keywords = ~$0.001

### Total Monthly Cost Estimate
- GSC API: **$0** (within free quota)
- AI insights: **~$0.10/month** (100 analyses)
- **Total**: Virtually free!

---

## Troubleshooting

### Issue 1: OAuth Error
**Problem**: "redirect_uri_mismatch"
**Solution**: Ensure redirect URI in Google Cloud Console exactly matches `.env.local`

### Issue 2: GSC API No Data
**Problem**: API returns empty results
**Solution**:
- Verify site is verified in Search Console
- Check date range (data is delayed 2-3 days)
- Ensure OAuth scope includes `webmasters.readonly`

### Issue 3: Database Connection Failed
**Problem**: Can't connect to Supabase
**Solution**: Update `DATABASE_URL` with correct credentials from Supabase dashboard

---

## Next Steps

1. **Immediate**:
   - Get Google OAuth credentials
   - Create `.env.local` files
   - Run Supabase migrations

2. **This Week**:
   - Modernize Python ETL to Node.js/TypeScript
   - Test OAuth flow end-to-end
   - Sync test data from GSC

3. **Next Week**:
   - Build AI-powered insights dashboard
   - Create automated sync jobs
   - Integrate with CRM

4. **Future Enhancements**:
   - Real-time data streaming
   - Competitor GSC comparison
   - Predictive ranking forecasts
   - Auto-generated SEO reports

---

## Summary

✅ **Ready to Configure**: Schema and env template created
✅ **Database Ready**: Supabase migration file prepared
✅ **Cost Optimized**: OpenRouter + DeepSeek V3 for AI insights
✅ **CRM Integration Planned**: 4-phase roadmap defined

**Next**: Get Google OAuth credentials and configure `.env.local` files! 🚀
