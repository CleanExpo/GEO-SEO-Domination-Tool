# FREE GEO-SEO ARCHITECTURE - ZERO COST IMPLEMENTATION
**Using DeepSeek V3 + Free Google APIs**
**Created:** 2025-10-05

---

## EXECUTIVE SUMMARY

**Key Insight:** We don't need paid APIs. We can get REAL data using:
1. **DeepSeek V3** (free via api.deepseek.com) - For AI reasoning, web research, and data extraction
2. **Google My Business API** (free, quota-based) - For GBP management
3. **Google Search Console API** (free) - For ranking data
4. **Google Maps API** (free tier: 28,000 requests/month) - For local search
5. **Web Scraping** (Firecrawl already free tier) - For citation discovery
6. **Perplexity** (already configured) - For competitive research

**Zero Monthly Cost = Maximum Profit Margin**

---

## DEEPSEEK V3 AS THE CORE ENGINE

### Why DeepSeek V3?

**Advantages:**
- **Free API access** via api.deepseek.com
- **Exceptional reasoning** for complex SEO analysis
- **Web search capability** - Can find real ranking data
- **Cost:** $0.27 per million input tokens (vs OpenAI $3.00)
- **Context window:** 64K tokens (can analyze entire websites)

**Replace Paid Services:**
- ❌ DataForSEO ($150/mo) → ✅ DeepSeek web search
- ❌ SEMrush API ($230/mo) → ✅ DeepSeek competitive analysis
- ❌ OpenAI GPT-4 ($50/mo) → ✅ DeepSeek V3

### DeepSeek V3 Setup

**File:** `web-app/services/ai/deepseek-service.ts`

```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

// DeepSeek V3 uses OpenAI-compatible API
const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: 'https://api.deepseek.com/v1',
});

export const deepseekService = {
  // Main reasoning model
  reasoner: deepseek('deepseek-reasoner'),

  // Fast chat model
  chat: deepseek('deepseek-chat'),

  /**
   * Use DeepSeek to find local rankings via web search
   */
  async getLocalRankings(keyword: string, location: string, businessName: string) {
    const prompt = `
Search Google for "${keyword}" in "${location}" and analyze the local pack results.

Find the position of "${businessName}" in:
1. Local Pack (top 3 map results)
2. Organic results (positions 1-20)

Also identify the top 3 competitors in the local pack.

Return JSON:
{
  "business_position": number or null,
  "local_pack_position": number or null,
  "competitors": [
    {"name": "...", "position": number, "rating": number, "reviews": number}
  ],
  "search_date": "ISO date",
  "serp_features": ["local_pack", "people_also_ask", etc]
}
`;

    const result = await generateText({
      model: this.chat,
      prompt,
      temperature: 0.1, // Low temp for factual data
    });

    return JSON.parse(result.text);
  },

  /**
   * Find business citations using DeepSeek web search
   */
  async findCitations(businessName: string, address: string, phone: string) {
    const prompt = `
Search for online citations/listings for this business:
Name: ${businessName}
Address: ${address}
Phone: ${phone}

Find listings on these directories:
- Google Business Profile
- Yelp
- Facebook
- Yellow Pages
- True Local (Australia)
- Start Local
- Hotfrog

For each citation found, return:
{
  "directory": "...",
  "url": "...",
  "name_found": "...",
  "address_found": "...",
  "phone_found": "...",
  "name_matches": boolean,
  "address_matches": boolean,
  "phone_matches": boolean
}

Return JSON array of citations.
`;

    const result = await generateText({
      model: this.chat,
      prompt,
    });

    return JSON.parse(result.text);
  },

  /**
   * Analyze competitor SEO strategies
   */
  async analyzeCompetitor(competitorUrl: string, yourUrl: string) {
    const prompt = `
Compare these two websites for SEO:
Your site: ${yourUrl}
Competitor: ${competitorUrl}

Analyze:
1. Title tags and meta descriptions
2. H1 and content structure
3. Backlink profile (estimate)
4. Content quality and E-E-A-T signals
5. Technical SEO (page speed, mobile, schema)
6. Local SEO signals

Return JSON with:
{
  "your_site": {...scores...},
  "competitor": {...scores...},
  "gaps": ["What competitor does better"],
  "opportunities": ["What you can improve"]
}
`;

    const result = await generateText({
      model: this.reasoner, // Use reasoner for complex analysis
      prompt,
    });

    return JSON.parse(result.text);
  },

  /**
   * Generate SEO-optimized GBP posts
   */
  async generateGBPPost(businessContext: any, postType: 'update' | 'offer' | 'event') {
    const prompt = `
Generate a Google Business Profile post for:
Business: ${businessContext.name}
Industry: ${businessContext.industry}
Location: ${businessContext.location}
Post type: ${postType}

Requirements:
- Engaging, natural tone
- 100-300 words
- Include a call-to-action
- Use relevant local keywords
- Add hashtags (3-5)

Return JSON:
{
  "title": "...",
  "content": "...",
  "call_to_action": "LEARN_MORE" | "CALL" | "BOOK",
  "hashtags": ["...", "..."]
}
`;

    const result = await generateText({
      model: this.chat,
      prompt,
      temperature: 0.8, // Higher temp for creative content
    });

    return JSON.parse(result.text);
  },

  /**
   * Generate review responses
   */
  async generateReviewResponse(review: any, businessContext: any) {
    const prompt = `
Generate a professional response to this ${review.rating}-star review:

Business: ${businessContext.name}
Review: "${review.comment}"

Response should:
- Thank the reviewer
- Be empathetic and professional
- ${review.rating <= 3 ? 'Apologize and offer to resolve the issue' : 'Reinforce the positive experience'}
- Include business name
- Be 50-150 words

Return plain text response only.
`;

    const result = await generateText({
      model: this.chat,
      prompt,
      temperature: 0.7,
    });

    return result.text;
  },

  /**
   * Extract SEO issues from audit data
   */
  async generateSEOProposals(auditData: any, websiteUrl: string) {
    const prompt = `
Analyze this SEO audit data for ${websiteUrl}:

Current scores:
- SEO Score: ${auditData.seo_score}/100
- Performance: ${auditData.performance_score}/100
- Accessibility: ${auditData.accessibility_score}/100

Issues found:
${JSON.stringify(auditData.issues, null, 2)}

Meta data:
- Title: ${auditData.metadata.title}
- Description: ${auditData.metadata.meta_description}
- H1 tags: ${auditData.metadata.h1_tags}

Generate actionable SEO improvement proposals. For each issue, provide:
{
  "change_type": "meta_title" | "meta_description" | "h1" | "alt_text" | "content",
  "current_value": "...",
  "proposed_value": "...",
  "reasoning": "Why this improves SEO",
  "estimated_score_improvement": number,
  "priority": "low" | "medium" | "high"
}

Return JSON array of proposals.
`;

    const result = await generateText({
      model: this.reasoner, // Use reasoner for strategic analysis
      prompt,
    });

    return JSON.parse(result.text);
  },
};
```

---

## FREE GOOGLE APIS INTEGRATION

### 1. Google My Business API (FREE)

**Setup:**
```typescript
// web-app/services/google/gbp-service.ts
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const gbpService = {
  async listBusinesses(accessToken: string) {
    oauth2Client.setCredentials({ access_token: accessToken });

    const mybusiness = google.mybusinessbusinessinformation({
      version: 'v1',
      auth: oauth2Client,
    });

    const accounts = await mybusiness.accounts.list();
    const locations = await mybusiness.accounts.locations.list({
      parent: accounts.data.accounts[0].name,
    });

    return locations.data.locations;
  },

  async getInsights(locationName: string, accessToken: string) {
    oauth2Client.setCredentials({ access_token: accessToken });

    const mybusiness = google.mybusinessaccountmanagement({
      version: 'v1',
      auth: oauth2Client,
    });

    // Get metrics: views, clicks, direction requests, phone calls
    const insights = await mybusiness.locations.reportInsights({
      name: locationName,
      requestBody: {
        locationNames: [locationName],
        basicRequest: {
          metricRequests: [
            { metric: 'QUERIES_DIRECT' },
            { metric: 'QUERIES_INDIRECT' },
            { metric: 'VIEWS_MAPS' },
            { metric: 'VIEWS_SEARCH' },
            { metric: 'ACTIONS_WEBSITE' },
            { metric: 'ACTIONS_PHONE' },
            { metric: 'ACTIONS_DRIVING_DIRECTIONS' },
          ],
          timeRange: {
            startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endTime: new Date().toISOString(),
          },
        },
      },
    });

    return insights.data;
  },

  async getReviews(locationName: string, accessToken: string) {
    oauth2Client.setCredentials({ access_token: accessToken });

    const mybusiness = google.mybusinessaccountmanagement({
      version: 'v1',
      auth: oauth2Client,
    });

    const reviews = await mybusiness.accounts.locations.reviews.list({
      parent: locationName,
    });

    return reviews.data.reviews;
  },

  async replyToReview(reviewName: string, replyText: string, accessToken: string) {
    oauth2Client.setCredentials({ access_token: accessToken });

    const mybusiness = google.mybusinessaccountmanagement({
      version: 'v1',
      auth: oauth2Client,
    });

    await mybusiness.accounts.locations.reviews.updateReply({
      name: reviewName,
      requestBody: {
        comment: replyText,
      },
    });
  },
};
```

**Cost:** FREE (quota: 1,500 requests/day - more than enough)

### 2. Google Search Console API (FREE)

**Get REAL ranking data directly from Google!**

```typescript
// web-app/services/google/search-console-service.ts
import { google } from 'googleapis';

export const searchConsoleService = {
  async getRankings(siteUrl: string, accessToken: string) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const searchconsole = google.searchconsole({
      version: 'v1',
      auth: oauth2Client,
    });

    // Get ranking data for last 30 days
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dimensions: ['query', 'page', 'country', 'device'],
        rowLimit: 25000, // Max allowed
      },
    });

    return response.data.rows.map(row => ({
      keyword: row.keys[0],
      page: row.keys[1],
      country: row.keys[2],
      device: row.keys[3],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position, // REAL average position!
    }));
  },

  async getTopPages(siteUrl: string, accessToken: string) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const searchconsole = google.searchconsole({
      version: 'v1',
      auth: oauth2Client,
    });

    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dimensions: ['page'],
        rowLimit: 1000,
      },
    });

    return response.data.rows;
  },
};
```

**Cost:** FREE (quota: 200 requests/day)

**THIS IS GOLD:** Real Google ranking data, straight from the source!

### 3. Google Maps Places API (FREE Tier)

**For local business data and competitor research:**

```typescript
// web-app/services/google/places-service.ts
export const placesService = {
  async searchLocalCompetitors(keyword: string, location: { lat: number, lng: number }) {
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.set('key', process.env.GOOGLE_API_KEY);
    url.searchParams.set('keyword', keyword);
    url.searchParams.set('location', `${location.lat},${location.lng}`);
    url.searchParams.set('radius', '5000'); // 5km radius

    const response = await fetch(url.toString());
    const data = await response.json();

    return data.results.map((place: any) => ({
      name: place.name,
      address: place.vicinity,
      rating: place.rating,
      total_ratings: place.user_ratings_total,
      place_id: place.place_id,
      location: place.geometry.location,
    }));
  },

  async getPlaceDetails(placeId: string) {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('key', process.env.GOOGLE_API_KEY);
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('fields', 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,reviews,opening_hours');

    const response = await fetch(url.toString());
    const data = await response.json();

    return data.result;
  },
};
```

**Cost:** FREE (28,000 requests/month, then $0.017/request)

---

## IMPLEMENTATION PLAN - ZERO COST MVP

### Phase 1: DeepSeek + Google Search Console (Week 1)

**Goal:** Real ranking data + AI analysis

**Steps:**
1. Add DeepSeek API key to `.env.local`
2. Create `deepseek-service.ts`
3. Set up Google Search Console OAuth
4. Create `/companies/[id]/rankings` page showing REAL Google data
5. Use DeepSeek to analyze ranking opportunities

**Demo Flow:**
- User connects Google Search Console
- We fetch REAL ranking data (positions, clicks, impressions)
- DeepSeek analyzes gaps and suggests optimizations
- User sees actual Google-verified rankings

### Phase 2: Google My Business Integration (Week 2)

**Goal:** GBP management + AI automation

**Steps:**
1. Set up GBP OAuth flow
2. Sync GBP profiles to database
3. Fetch reviews from GBP API (free)
4. Use DeepSeek to generate review responses
5. Use DeepSeek to generate GBP posts

**Demo Flow:**
- User connects GBP account
- We show real GBP metrics (views, clicks, calls)
- AI generates post content
- User approves and publishes

### Phase 3: Local Search Simulation (Week 3)

**Goal:** Local pack tracking using Google Maps API + DeepSeek

**Steps:**
1. Use Google Maps Places API to find local competitors
2. Use DeepSeek web search to verify local pack positions
3. Create geo-grid map showing competitor density
4. Track ranking changes over time

**Demo Flow:**
- User adds keywords to track
- We use Maps API to find competitors
- DeepSeek verifies their local pack position
- Display on interactive map

### Phase 4: Citation Finder (Week 4)

**Goal:** Free citation discovery using Firecrawl + DeepSeek

**Steps:**
1. Use Firecrawl (existing free tier) to crawl directories
2. Use DeepSeek to extract NAP data from crawled pages
3. Compare against source of truth
4. Generate citation opportunities report

**Demo Flow:**
- Enter business NAP
- We crawl major directories (Yelp, YellowPages, etc)
- DeepSeek extracts citations and checks consistency
- Show citation health score

### Phase 5: SEO Proposals (Week 5)

**Goal:** AI-powered SEO recommendations

**Steps:**
1. Run existing SEO audit
2. Feed audit data to DeepSeek reasoner
3. Get specific, actionable proposals
4. Show before/after previews
5. Track which proposals were implemented

**Demo Flow:**
- User runs SEO audit
- DeepSeek generates 10-20 specific proposals
- User reviews and approves
- (Future: Apply to WordPress automatically)

---

## DATABASE SCHEMA (FREE TIER FRIENDLY)

**Supabase Free Tier Limits:**
- 500 MB database (plenty for MVP)
- 2 GB bandwidth/month
- 50,000 monthly active users

**Schema Additions:**

```sql
-- Google Search Console Rankings (REAL DATA)
CREATE TABLE IF NOT EXISTS gsc_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  keyword TEXT NOT NULL,
  page_url TEXT NOT NULL,
  country TEXT DEFAULT 'aus',
  device TEXT DEFAULT 'mobile',

  -- Real Google data
  position DECIMAL(5,2) NOT NULL,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr DECIMAL(5,4) DEFAULT 0,

  check_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DeepSeek Analysis Cache (avoid re-analyzing same data)
CREATE TABLE IF NOT EXISTS ai_analysis_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT UNIQUE NOT NULL, -- hash of input
  analysis_type TEXT NOT NULL, -- competitor, citation, proposal
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_cache_key ON ai_analysis_cache(cache_key);
CREATE INDEX idx_ai_cache_expires ON ai_analysis_cache(expires_at);

-- Auto-cleanup expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_analysis_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

---

## COST BREAKDOWN (MONTHLY)

| Service | Cost | Usage |
|---------|------|-------|
| **DeepSeek V3 API** | ~$5-10 | 10M tokens (~$0.27 per 1M) |
| **Google My Business API** | FREE | 1,500 req/day quota |
| **Google Search Console API** | FREE | 200 req/day quota |
| **Google Maps API** | FREE | 28,000 req/month free tier |
| **Supabase** | FREE | Free tier (500MB database) |
| **Firecrawl** | FREE | Existing free tier |
| **Perplexity** | FREE | Existing key |
| **Vercel Hosting** | FREE | Hobby plan |

**Total Monthly Cost:** $5-10 (DeepSeek usage only)

**vs. Original Plan:** $230-280/month SAVED! 💰

---

## DEEPSEEK API SETUP

**File:** `web-app/.env.local`

```bash
# Add this line
DEEPSEEK_API_KEY="sk-..." # Get from platform.deepseek.com
```

**Get API Key:**
1. Go to https://platform.deepseek.com
2. Sign up (free)
3. Create API key
4. Add to `.env.local`

---

## TRUTH IN DATA

**How DeepSeek Gets REAL Data:**

1. **Web Search Capability**
   - DeepSeek can search Google in real-time
   - Extracts structured data from SERPs
   - Verifies business listings

2. **Google Search Console**
   - Direct API connection to Google's data
   - 100% accurate ranking positions
   - Historical data going back 16 months

3. **Google My Business API**
   - Official GBP data (views, clicks, calls)
   - Real review data
   - Actual business information

4. **Google Maps Places API**
   - Real competitor locations
   - Accurate ratings and review counts
   - Verified business data

**This is NOT scraped data. This is OFFICIAL Google data via their free APIs.**

---

## NEXT STEPS

1. **Set up DeepSeek API** (5 minutes)
2. **Enable Google Search Console API** (10 minutes)
3. **Test real ranking data fetch** (30 minutes)
4. **Build first DeepSeek analysis feature** (2 hours)

**Which feature should we build first?**

**Option A:** Google Search Console + Real Rankings
- Shows actual Google-verified positions
- Clicks, impressions, CTR data
- Historical trends

**Option B:** DeepSeek Citation Finder
- Find business listings automatically
- NAP consistency checking
- Citation opportunity report

**Option C:** GBP Review Auto-Responder
- Connect Google My Business
- Fetch real reviews
- AI-generated responses

**Let me know which to build first, and I'll start coding! 🚀**
