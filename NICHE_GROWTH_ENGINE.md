# Niche Growth Engine - Content Gap Mining System

## Overview

The **Niche Growth Engine** is an integrated content opportunity discovery system that combines keyword research data with community gap mining to identify high-value, low-competition content opportunities.

### Key Features

✅ **Community Gap Mining**: Analyzes Reddit discussions to find unanswered questions and pain points
✅ **117-Signal Keyword Analysis**: Leverages DataForSEO keyword data with comprehensive ranking factors
✅ **Opportunity Scoring**: Combines search volume, keyword difficulty, and community signals
✅ **AEO (Answer Engine Optimization)**: Generates AI-friendly content structures
✅ **Content Factory**: Auto-generates articles, social media packs, and newsletter items
✅ **Production Ready**: Full API endpoints and UI for workflow management

---

## Architecture

### Data Flow

```
Seed Keyword
    ↓
DataForSEO API (Keyword Ideas + Search Volume + Difficulty)
    ↓
Reddit Gap Mining (Discussion Analysis)
    ↓
Opportunity Scoring (Volume × Difficulty × Gap Signals)
    ↓
Content Factory (Article + Social + Newsletter)
    ↓
Published Content
```

### Scoring Algorithm

**Opportunity Score** = `log10(volume) × (0.6 × inverseDifficulty + 0.4 × gapWeight)`

**Gap Weight Components**:
- **35%** Reddit mention volume (discussion frequency)
- **30%** Repeated questions (signal of unmet need)
- **20%** Confusion markers ("confused", "not sure", "anyone know")
- **15%** Dissatisfaction markers ("didn't work", "no answer", "frustrated")

**Example**:
- Keyword: "water damage insurance claim"
- Search Volume: 2,400/month
- Difficulty: 45/100
- Reddit Mentions: 28 threads
- Repeated Questions: 12 questions asked 3+ times
- **Opportunity Score: 3.87** ⭐ (High value opportunity)

---

## Setup

### 1. Install Dependencies

```bash
npm install snoowrap
```

### 2. Create Reddit API Application

1. Go to [https://www.reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. Click "Create App" or "Create Another App"
3. Fill in the details:
   - **Name**: GEO-SEO Content Mining Tool
   - **Type**: Select "script"
   - **Description**: Content gap mining for SEO opportunities
   - **About URL**: (leave blank)
   - **Redirect URI**: http://localhost:3000
4. Click "Create app"
5. Copy the **client ID** (under the app name) and **client secret**

### 3. Configure Environment Variables

Add to your `.env.local` file:

```env
# Reddit API (Content Gap Mining)
REDDIT_CLIENT_ID=your_14_char_client_id
REDDIT_CLIENT_SECRET=your_27_char_client_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
REDDIT_USER_AGENT=geo-seo-tool/1.0 by your-reddit-username
```

**Security Notes**:
- Use a dedicated Reddit account (not your personal account)
- Never commit `.env.local` to version control
- Reddit API rate limits: 60 requests/minute

### 4. Initialize Database Schema

The content opportunities schema is automatically loaded when you run:

```bash
npm run db:init
```

This creates the following tables:
- `content_opportunities` - Discovered content opportunities
- `content_plans` - Generated content (articles, social, newsletter)
- `reddit_threads` - Tracked Reddit discussions
- `reddit_comments` - Comment analysis data
- `opportunity_searches` - Search history and stats

---

## Usage

### Web UI

Navigate to **Content Opportunities** in the sidebar (marked with "NEW" badge).

#### Discover Opportunities

1. Enter a seed keyword (e.g., "mould removal after flood")
2. Click "Discover"
3. The system will:
   - Fetch 50+ related keywords from DataForSEO
   - Mine 25+ Reddit threads per keyword
   - Analyze 100+ comments per thread
   - Calculate opportunity scores
   - Rank by best opportunities

#### Generate Content

1. Browse discovered opportunities
2. Click "Generate Content" on any opportunity
3. Receives:
   - **Article Plan**: Full outline with H2/H3 structure, FAQ, compliance notes
   - **Social Pack**: LinkedIn, Facebook, Instagram, Twitter, Video script
   - **Newsletter Item**: Headline, hook, 3 takeaways, CTA

### API Endpoints

#### Discover Opportunities

```http
POST /api/content-opportunities/discover
Content-Type: application/json

{
  "seedKeyword": "water damage restoration",
  "companyId": 123,
  "subreddits": ["all"],
  "topN": 10,
  "minScore": 0,
  "includeAEO": true
}
```

**Response**:

```json
{
  "success": true,
  "searchId": 45,
  "opportunities": [
    {
      "keyword": "water damage insurance claim process",
      "volume": 2400,
      "difficulty": 0.45,
      "opportunityScore": 3.87,
      "gap": {
        "redditMentions": 28,
        "repeatedQuestions": 12,
        "confusionMarkers": 15,
        "dissatisfactionMarkers": 8
      },
      "topQuestions": [
        "How long does a water damage claim take?",
        "What does insurance cover for water damage?",
        "Can I claim water damage without proof?"
      ],
      "aeo": {
        "canonicalAnswer": "Water damage insurance claims typically take 7-30 days...",
        "keyBullets": [...],
        "citations": [...]
      }
    }
  ],
  "stats": {
    "keywordsAnalyzed": 47,
    "opportunitiesFound": 10,
    "avgOpportunityScore": 3.12,
    "executionTimeMs": 45230
  }
}
```

#### List Opportunities

```http
GET /api/content-opportunities?companyId=123&status=discovered&minScore=2.0&limit=20
```

#### Generate Content

```http
POST /api/content-opportunities/45/generate
Content-Type: application/json

{
  "contentTypes": ["article", "social", "newsletter"]
}
```

---

## Content Factory Templates

### Article Template

Generated articles include:

- **SEO-Optimized Title** (60-70 chars)
- **Meta Description** (150-160 chars)
- **Canonical Answer** (1-3 sentences for AI engines)
- **Introduction** (100-150 words with hook)
- **Step-by-Step Guide** (answers top Reddit questions)
- **Safety & Compliance** (AU/US standards)
- **Tools Checklist** (equipment needed)
- **Visual Assets List** (diagrams/photos needed)
- **FAQ Section** (top 5 community questions)
- **Citations** (industry sources, standards)

### Social Media Pack

Generated for each platform:

1. **LinkedIn Post** (120-200 words, professional tone)
2. **Facebook Post** (80-120 words, conversational)
3. **Instagram Caption** (≤150 words + 5-8 hashtags)
4. **X/Twitter Thread** (5-7 tweets, hook → value → CTA)
5. **Short Video Script** (30 seconds, 4-beat structure)

### Newsletter Item

Generated newsletter block:

- **Headline** (7-10 words, benefit-driven)
- **Hook** (2 sentences, why-now urgency)
- **3 Key Takeaways** (actionable insights)
- **CTA with UTM** (trackable link)

---

## AEO (Answer Engine Optimization)

Content is structured for AI search engines (ChatGPT, Claude, Perplexity, Gemini):

### Canonical Answer

A **1-3 sentence** direct answer that can be extracted and cited by AI engines.

**Example**:
> "Water damage insurance claims typically take 7-30 days to process, depending on claim complexity and documentation completeness. Most policies cover sudden and accidental water damage (burst pipes, appliance leaks) but exclude gradual damage from poor maintenance."

### Key Bullets

**3-5 actionable bullet points** that AI can cite:

- Document damage immediately with photos and videos
- Contact your insurance company within 24-48 hours
- Get 2-3 restoration quotes for comparison
- Keep all receipts for temporary repairs and hotel stays

### Citations

Links to authoritative sources:

- Industry standards (AS/NZS 3733:2018, IICRC S500)
- Government regulations
- Peer-reviewed research
- Professional association guidelines

---

## Best Practices

### Keyword Selection

✅ **DO**:
- Use specific, problem-focused keywords ("mould smell after rain")
- Target buyer-intent keywords ("water damage restoration cost")
- Analyze local variations ("Brisbane flood damage repair")

❌ **DON'T**:
- Use overly broad keywords ("water damage")
- Target purely informational terms with no commercial intent
- Ignore regional spelling differences (AU vs US)

### Subreddit Targeting

**General Discovery** (use `["all"]`):
- Casts widest net
- Good for initial discovery
- May include irrelevant discussions

**Targeted Discovery** (specify subreddits):
```json
{
  "subreddits": ["HomeImprovement", "Insurance", "DIY", "Plumbing"]
}
```

### Opportunity Scoring Thresholds

| Score | Opportunity Level | Recommended Action |
|-------|------------------|-------------------|
| < 1.5 | Low | Skip or deprioritize |
| 1.5 - 2.5 | Medium | Consider if niche-relevant |
| 2.5 - 3.5 | High | Prioritize for content |
| > 3.5 | Exceptional | Create immediately |

### Rate Limiting

**Reddit API Limits**:
- 60 requests/minute (OAuth)
- Recommend: 15-25 threads per keyword for batch analysis
- Use delays between requests if analyzing 50+ keywords

**DataForSEO Limits**:
- Depends on your plan
- Typical: 5,000 credits/day
- 1 keyword ideas request ≈ 10-20 credits

---

## Troubleshooting

### "Reddit API authentication failed"

**Solution**:
1. Verify `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` are correct
2. Ensure app type is "script" (not "web app")
3. Check username/password are correct
4. Verify user agent format: `"app-name/version by reddit-username"`

### "No opportunities found"

**Possible Causes**:
1. **Keyword too broad**: Try more specific terms
2. **Low search volume**: Keyword has <10 searches/month
3. **No Reddit discussions**: Topic not discussed on Reddit (try other platforms)
4. **Min score too high**: Lower `minScore` parameter

### "DataForSEO timeout"

**Solution**:
1. Check `DATAFORSEO_API_KEY` is valid
2. Verify account has available credits
3. Try simpler seed keyword (fewer results)
4. Contact DataForSEO support if persistent

### "Content generation failed"

**Solution**:
1. Verify `ANTHROPIC_API_KEY` is set
2. Check Claude API quota/limits
3. Ensure opportunity has `top_questions` data
4. Review API error message for specific issue

---

## Roadmap

### Phase 2 (Q2 2025)

- [ ] Discord community mining adapter
- [ ] Facebook Groups analysis
- [ ] Quora question mining
- [ ] YouTube comments analysis

### Phase 3 (Q3 2025)

- [ ] Competitor content gap analysis
- [ ] Automated content publishing to CMS
- [ ] Performance tracking (rankings, traffic, conversions)
- [ ] AI-powered content refresh suggestions

### Phase 4 (Q4 2025)

- [ ] Video pack generator (YouTube, TikTok, Reels)
- [ ] Podcast episode planner
- [ ] Multi-language content generation
- [ ] White-label partner portal

---

## Support

**Documentation**: [GEO-SEO Docs](./README.md)
**API Reference**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
**Community**: [Discord Server](#) _(coming soon)_
**Issues**: [GitHub Issues](https://github.com/your-org/geo-seo/issues)

---

## License

Proprietary - All Rights Reserved

---

**Built with** ❤️ **by the GEO-SEO Team**

*Leveraging the power of community insights to dominate local search.*
