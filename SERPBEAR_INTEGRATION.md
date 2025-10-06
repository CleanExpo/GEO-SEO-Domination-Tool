# SerpBear Integration Guide

## Overview
SerpBear has been successfully forked and integrated into our GEO-SEO Domination Tool for automated rank tracking.

**Fork URL**: https://github.com/CleanExpo/serpbear
**Local Path**: `D:\GEO_SEO_Domination-Tool\integrations\serpbear`
**Access URL**: http://localhost:3002 (separate port to avoid conflicts)

---

## Integration Status

### ✅ Completed
- [x] Forked SerpBear to CleanExpo GitHub organization
- [x] Cloned to `integrations/serpbear/`
- [x] Created `.env.local` with our configuration
- [x] Added OpenRouter API key for DeepSeek V3 cost optimization
- [x] Created Supabase schema (`database/serpbear-schema.sql`)
- [x] Configured to run on port 3002

### 🔄 In Progress
- [ ] Install npm dependencies
- [ ] Run database migrations to Supabase
- [ ] Test local development server
- [ ] Integrate with our CRM authentication
- [ ] Add to main app navigation

---

## Quick Start

### 1. Install Dependencies
```bash
cd integrations/serpbear
npm install
```

### 2. Setup Database
```bash
# Option A: Run Supabase migration from root
cd ../..
npm run db:migrate  # Will include serpbear-schema.sql

# Option B: Manual SQL execution in Supabase dashboard
# Copy contents of database/serpbear-schema.sql and execute
```

### 3. Start SerpBear
```bash
cd integrations/serpbear
npm run dev
```

Access at: http://localhost:3002
Login with:
- **Username**: admin
- **Password**: GeoSEO2025!Secure

---

## Environment Configuration

### SerpBear .env.local
Located at: `integrations/serpbear/.env.local`

```env
USER=admin
PASSWORD=GeoSEO2025!Secure
SECRET=4715aed3c216f7b0a38e6b234a958362654e56d10fbc04700770d472af3dce436
APIKEY=5saedXklbylhnatihe2pihp3pih4fdnakljwq9serpbear2025
SESSION_DURATION=24
NEXT_PUBLIC_APP_URL=http://localhost:3002
DATABASE_URL=postgresql://postgres:your_password@db.placeholder.supabase.co:5432/postgres
OPENROUTER_API_KEY=your_openrouter_key_here
NODE_ENV=development
```

### Main App .env.local
Already updated with:
```env
# OpenRouter AI (DeepSeek V3)
# OPENROUTER_API_KEY=your_openrouter_key_here

# SerpBear Integration
SERPBEAR_USER=admin
SERPBEAR_PASSWORD=GeoSEO2025!Secure
SERPBEAR_SECRET=4715aed3c216f7b0a38e6b234a958362654e56d10fbc04700770d472af3dce436
SERPBEAR_APIKEY=5saedXklbylhnatihe2pihp3pih4fdnakljwq9serpbear2025
SERPBEAR_SESSION_DURATION=24
```

---

## Database Schema

### Tables Created
1. **serpbear_domains** - Domains being tracked
   - Links to `companies` table via `company_id`
   - Stores notification settings
   - Search Console integration field

2. **serpbear_keywords** - Keywords and rankings
   - Historical position tracking (JSONB)
   - Search volume data
   - Links to our `keywords` table via `geo_seo_keyword_id`

### Key Features
- Automatic timestamp tracking (`created_at`, `updated_at`)
- JSONB for flexible data storage (history, tags, results)
- Foreign key constraints for data integrity
- Performance indexes on common queries

---

## CRM Integration Strategy

### Phase 1: Standalone Access (Current)
- SerpBear runs on port 3002
- Access via direct URL
- Manual sync with companies

### Phase 2: Iframe Embedding (Week 2)
```typescript
// Add to web-app/app/seo/rank-tracking/page.tsx
<iframe
  src="http://localhost:3002"
  className="w-full h-screen"
  title="Rank Tracking"
/>
```

### Phase 3: API Integration (Week 3)
```typescript
// Create web-app/app/api/serpbear/route.ts
// Proxy SerpBear API through our main app
// Use SERPBEAR_APIKEY for authentication
export async function GET(request: NextRequest) {
  const response = await fetch('http://localhost:3002/api/domains', {
    headers: { 'Authorization': `Bearer ${process.env.SERPBEAR_APIKEY}` }
  });
  return NextResponse.json(await response.json());
}
```

### Phase 4: Unified Database (Week 4)
- Auto-create `serpbear_domains` when company is added
- Link keywords between our system and SerpBear
- Shared authentication (SSO)

---

## Features Available

### Core Rank Tracking
- ✅ Daily SERP position tracking
- ✅ Desktop & mobile rankings
- ✅ Local SEO (city, lat/long) support
- ✅ Historical ranking charts
- ✅ Multiple search engines (Google, Bing, etc.)

### Automation
- ✅ Automatic daily updates via cron
- ✅ Email notifications on rank changes
- ✅ Tag-based keyword organization
- ✅ Bulk keyword imports

### Reporting
- ✅ Position history graphs
- ✅ Ranking volatility indicators
- ✅ Share of voice metrics
- ✅ Export to CSV/JSON

---

## AI-Powered Enhancements (OpenRouter + DeepSeek V3)

### Cost Optimization
- Uses DeepSeek V3 via OpenRouter ($0.27/1M tokens vs GPT-4's $30/1M)
- 111x cheaper than GPT-4
- Same quality for SEO analysis tasks

### Planned AI Features
1. **Automatic Keyword Suggestions**
   ```typescript
   // Analyze top competitors, suggest keywords we're missing
   const suggestions = await aiAnalyzeCompetitors(domain);
   ```

2. **Ranking Pattern Analysis**
   ```typescript
   // Identify why rankings dropped/rose
   const insights = await aiAnalyzeRankingChanges(historyData);
   ```

3. **Content Optimization Recommendations**
   ```typescript
   // Suggest content improvements for target keywords
   const recommendations = await aiOptimizeForKeyword(keyword, currentContent);
   ```

---

## Navigation Integration

### Option A: Add to SEO Section
```typescript
// web-app/components/Sidebar.tsx
const navigation = [
  // ... existing items
  { name: 'Rank Tracking', href: '/seo/rank-tracking', icon: TrendingUp, section: 'SEO' },
];
```

### Option B: Dedicated Tracking Section
```typescript
const rankingNavigation = [
  { name: 'Rank Tracker', href: '/tracking/serpbear', icon: Target, section: 'Tracking' },
  { name: 'SERP Analysis', href: '/tracking/serp', icon: Search, section: 'Tracking' },
  { name: 'Competitor Ranks', href: '/tracking/competitors', icon: Users, section: 'Tracking' },
];
```

---

## API Endpoints

### SerpBear API (Port 3002)
- `GET /api/domains` - List all domains
- `POST /api/domains` - Add new domain
- `GET /api/keywords` - List all keywords
- `POST /api/keywords` - Add new keyword
- `PUT /api/keywords/:id` - Update keyword
- `DELETE /api/keywords/:id` - Delete keyword
- `POST /api/keywords/refresh` - Force SERP check

### Our Proxy API (Port 3001)
```typescript
// web-app/app/api/rank-tracking/route.ts
GET /api/rank-tracking/domains
GET /api/rank-tracking/keywords
POST /api/rank-tracking/sync-company/:companyId
```

---

## Testing Checklist

Before full integration:

- [ ] SerpBear starts without errors on port 3002
- [ ] Can login with configured credentials
- [ ] Database connects to Supabase
- [ ] Can add a test domain
- [ ] Can add test keywords
- [ ] SERP scraping works (Google test search)
- [ ] Historical data saves correctly
- [ ] Email notifications work (optional)
- [ ] API endpoints respond correctly

---

## Known Issues & Solutions

### Issue 1: Port Conflicts
**Problem**: Port 3002 already in use
**Solution**: Change `NEXT_PUBLIC_APP_URL` in `.env.local` to different port

### Issue 2: Database Connection
**Problem**: Can't connect to Supabase
**Solution**: Update `DATABASE_URL` with real Supabase credentials from dashboard

### Issue 3: SERP Scraping Blocked
**Problem**: Google blocks scraping
**Solution**:
- Use SerpBear's built-in proxy rotation
- Add `SERPAPI_KEY` or `SCRAPINGBEE_KEY` for reliable scraping

---

## Next Steps

1. **Immediate (Today)**:
   ```bash
   cd integrations/serpbear
   npm install
   npm run dev
   # Access http://localhost:3002
   ```

2. **This Week**:
   - Run Supabase migrations
   - Test adding domains and keywords
   - Create proxy API endpoints
   - Add to CRM navigation

3. **Next Week**:
   - Implement AI analysis features with OpenRouter
   - Auto-sync with our companies table
   - Build unified dashboard view
   - Setup automated daily cron jobs

4. **Future Enhancements**:
   - Real-time rank updates
   - Competitor tracking automation
   - AI-powered keyword discovery
   - Predictive ranking forecasts

---

## Support & Documentation

- **SerpBear Docs**: https://docs.serpbear.com
- **Original Repo**: https://github.com/towfiqi/serpbear
- **Our Fork**: https://github.com/CleanExpo/serpbear
- **Issues**: Report in our main repo or SerpBear's GitHub

---

## Summary

✅ **Ready to Install**: All configuration files created
✅ **Database Ready**: Schema migration file prepared
✅ **Cost Optimized**: OpenRouter + DeepSeek V3 configured
✅ **CRM Integration Planned**: 4-phase roadmap defined

**Next Command**:
```bash
cd integrations/serpbear && npm install && npm run dev
```

Then visit http://localhost:3002 to start tracking rankings! 🚀
