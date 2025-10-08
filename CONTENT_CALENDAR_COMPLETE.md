# Content Calendar System - Complete Implementation

## Overview

The **Content Calendar Agent** is the autonomous scheduling system that orchestrates when and where content gets published across all platforms. It works in concert with the Content Generation Agent and Auto-Deploy Agent to create a fully automated content marketing machine.

**Key Capabilities:**
- Generate weekly/monthly content schedules
- Optimize posting times for maximum engagement per platform
- Balance content types (70% educational, 20% promotional, 10% news)
- Process due posts automatically
- Track scheduled, in-progress, and published content

## Architecture

### System Flow

```
Content Calendar Agent
        ↓
    Schedules posts at optimal times
        ↓
    Cron job detects due posts
        ↓
    Content Generation Agent (generates content)
        ↓
    Auto-Deploy Agent (publishes to platforms)
        ↓
    Update post status to "published"
```

### Files Created

1. **`services/agents/content-calendar-agent.ts`** (800+ lines)
   - Core scheduling logic
   - Optimal posting time calculations
   - Topic generation
   - Database operations

2. **`app/api/crm/calendar/route.ts`** (240+ lines)
   - REST API endpoints (POST, GET, PATCH, DELETE)
   - Process due posts endpoint
   - Autonomous action logging

3. **`app/crm/calendar/page.tsx`** (400+ lines)
   - Visual calendar interface
   - Create calendar modal
   - Scheduled posts table
   - Status tracking

### Database Schema

The `scheduled_posts` table is auto-created by the Content Calendar Agent:

```sql
CREATE TABLE scheduled_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portfolio_id TEXT NOT NULL,
  scheduled_for TEXT NOT NULL,           -- ISO timestamp
  content_type TEXT NOT NULL,             -- educational, promotional, news
  topic TEXT NOT NULL,
  platforms TEXT NOT NULL DEFAULT '[]',   -- JSON array of platforms
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, generating, generated, publishing, published, failed
  content_id TEXT,                        -- Reference to content_empire table
  deployment_id TEXT,                     -- Reference to deployment
  generated_at TEXT,
  published_at TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (portfolio_id) REFERENCES company_portfolios(id)
);
```

## Platform Optimal Posting Times

The system uses research-backed optimal posting times for each platform:

### LinkedIn
- **Best Times:** Weekday mornings (7-9 AM), lunch (12-1 PM)
- **Rationale:** B2B professionals check LinkedIn before work and during breaks
- **Top Day:** Tuesday-Wednesday 7-8 AM (Score: 10/10)

### Facebook
- **Best Times:** Evenings (7-9 PM), weekends
- **Rationale:** Personal browsing happens after work hours
- **Top Day:** Wednesday 7 PM (Score: 10/10)

### Twitter
- **Best Times:** Weekday afternoons (1-3 PM)
- **Rationale:** Lunch break engagement, high retweet activity
- **Top Day:** Tuesday-Wednesday 1 PM (Score: 10/10)

### Google My Business
- **Best Times:** Business hours (9 AM - 5 PM)
- **Rationale:** Local search peaks during work hours
- **Top Day:** Wednesday 10 AM (Score: 10/10)

### WordPress/Node.js
- **Best Times:** Weekday mornings (6-8 AM)
- **Rationale:** SEO crawlers and email subscribers engage early
- **Top Day:** Monday-Wednesday 6 AM (Score: 10/10)

## API Reference

### 1. Generate Content Calendar

**Endpoint:** `POST /api/crm/calendar`

**Request Body:**
```json
{
  "portfolioId": "portfolio-uuid",
  "startDate": "2024-02-01T00:00:00Z",
  "endDate": "2024-02-29T23:59:59Z",
  "platforms": [
    {
      "platform": "linkedin",
      "postsPerWeek": 5,
      "config": {
        "accessToken": "...",
        "personUrn": "..."
      }
    },
    {
      "platform": "wordpress",
      "postsPerWeek": 3,
      "config": {
        "siteUrl": "https://example.com",
        "username": "admin",
        "applicationPassword": "..."
      }
    }
  ],
  "contentMix": {
    "educational": 70,
    "promotional": 20,
    "news": 10
  },
  "autoGenerate": false,
  "frequency": "weekly"
}
```

**Response:**
```json
{
  "success": true,
  "scheduledPosts": [...],
  "totalPosts": 24,
  "breakdown": {
    "educational": 17,
    "promotional": 5,
    "news": 2
  },
  "platformDistribution": {
    "linkedin": 16,
    "wordpress": 8
  },
  "estimatedCost": 1.032,
  "message": "Successfully scheduled 24 posts across 2 platforms"
}
```

### 2. Get Scheduled Posts

**Endpoint:** `GET /api/crm/calendar?portfolioId={id}&status={status}`

**Query Parameters:**
- `portfolioId` (required): Portfolio UUID
- `status` (optional): Filter by status (scheduled, generating, published, failed)

**Response:**
```json
{
  "success": true,
  "posts": [
    {
      "id": 1,
      "portfolioId": "portfolio-uuid",
      "scheduledFor": "2024-02-05T07:00:00Z",
      "contentType": "educational",
      "topic": "How to choose the right fire safety solution",
      "platforms": ["linkedin", "wordpress"],
      "status": "scheduled",
      "createdAt": "2024-02-01T10:00:00Z"
    }
  ],
  "count": 1
}
```

### 3. Update Scheduled Post

**Endpoint:** `PATCH /api/crm/calendar`

**Request Body:**
```json
{
  "id": 1,
  "scheduledFor": "2024-02-05T08:00:00Z",
  "topic": "Updated topic",
  "platforms": ["linkedin"],
  "status": "scheduled"
}
```

### 4. Delete Scheduled Post

**Endpoint:** `DELETE /api/crm/calendar?id={postId}`

**Response:**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

### 5. Process Due Posts (Cron Job)

**Endpoint:** `POST /api/crm/calendar`

**Request Body:**
```json
{
  "action": "process"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Due posts processed successfully"
}
```

## Content Type Strategy

### Educational Content (70%)

**Purpose:** Build authority, trust, and SEO rankings

**Topics Examples:**
- "How to choose the right [industry] solution"
- "Top 10 mistakes in [industry]"
- "Understanding [industry] regulations"
- "[Industry] best practices for 2024"
- "Case study: Successful [industry] implementation"

**Format:** Blog articles (800-1500 words), white papers, guides

**Platforms:** WordPress, Node.js, LinkedIn

### Promotional Content (20%)

**Purpose:** Drive conversions and sales

**Topics Examples:**
- "Why choose [Company] for [industry]"
- "Special offer: [industry] services"
- "Meet our [industry] experts"
- "Customer success story with [Company]"

**Format:** Short posts (200-400 words), social media posts

**Platforms:** LinkedIn, Facebook, Twitter, GMB

### News Content (10%)

**Purpose:** Stay current and relevant

**Topics Examples:**
- "Latest [industry] industry news"
- "New [industry] regulations announced"
- "[Industry] market trends"

**Format:** Brief updates (300-600 words), news posts

**Platforms:** All platforms

## Automation Workflow

### Step 1: Create Content Calendar

1. Select portfolio (company)
2. Choose date range (e.g., next month)
3. Enable platforms and set frequency (posts/week)
4. Set content mix percentages
5. Click "Generate Calendar"

**Result:**
- Posts scheduled at optimal times
- Topics auto-generated based on industry
- Content types balanced per mix ratio

### Step 2: Automatic Processing (Cron Job)

**Recommended Cron Schedule:** Every 15 minutes

```bash
# Cron job (run every 15 minutes)
*/15 * * * * curl -X POST http://localhost:3000/api/crm/calendar \
  -H "Content-Type: application/json" \
  -d '{"action":"process"}'
```

**What Happens:**
1. System checks for posts where `scheduled_for <= now` and `status = 'scheduled'`
2. For each due post:
   - Update status to `generating`
   - Call Content Generation Agent
   - Update status to `generated`
   - Call Auto-Deploy Agent
   - Update status to `publishing`
   - Deploy to all configured platforms
   - Update status to `published`

### Step 3: Monitor Results

Visit `/crm/calendar` to see:
- All scheduled posts
- Current status (scheduled, generating, published, failed)
- Platform distribution
- Content type breakdown

## Cost Analysis

### Per-Post Costs (GPT-4o-mini)

- **Blog Article (Educational):** $0.043
- **Social Post (Promotional):** $0.001
- **White Paper (News):** $0.002

### Monthly Calendar Example

**Configuration:**
- 1 portfolio
- 4 weeks
- 5 platforms (LinkedIn, Facebook, Twitter, WordPress, Node.js)
- Total: 60 posts/month

**Breakdown:**
- Educational (70%): 42 posts × $0.043 = $1.806
- Promotional (20%): 12 posts × $0.001 = $0.012
- News (10%): 6 posts × $0.002 = $0.012

**Total Monthly Cost:** $1.83

**Human Equivalent:**
- Content Writer: $50/hour × 2 hours/post × 60 posts = **$6,000/month**
- Social Media Manager: $40/hour × 40 hours = **$1,600/month**
- **Total Human Cost:** $7,600/month

**Savings:** $7,598.17/month (99.98% cost reduction)

## Usage Examples

### Example 1: Launch New Product Campaign

```javascript
// Generate 2-week campaign for product launch
const response = await fetch('/api/crm/calendar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    portfolioId: 'portfolio-uuid',
    startDate: '2024-02-01T00:00:00Z',
    endDate: '2024-02-14T23:59:59Z',
    platforms: [
      { platform: 'linkedin', postsPerWeek: 7, config: {...} },
      { platform: 'facebook', postsPerWeek: 7, config: {...} },
      { platform: 'twitter', postsPerWeek: 10, config: {...} }
    ],
    contentMix: {
      educational: 50,  // Product education
      promotional: 40,  // Launch announcements
      news: 10          // Industry context
    }
  })
});
```

**Result:** 28 posts scheduled across 3 platforms over 2 weeks

### Example 2: Evergreen Content Schedule

```javascript
// Generate 3-month evergreen content calendar
const response = await fetch('/api/crm/calendar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    portfolioId: 'portfolio-uuid',
    startDate: '2024-02-01T00:00:00Z',
    endDate: '2024-04-30T23:59:59Z',
    platforms: [
      { platform: 'wordpress', postsPerWeek: 2, config: {...} },
      { platform: 'linkedin', postsPerWeek: 3, config: {...} }
    ],
    contentMix: {
      educational: 80,  // Authority building
      promotional: 10,  // Subtle CTAs
      news: 10          // Industry updates
    }
  })
});
```

**Result:** 60 posts scheduled for SEO and thought leadership

### Example 3: Manual Post Scheduling

```javascript
// Get current schedule
const current = await fetch('/api/crm/calendar?portfolioId=portfolio-uuid');
const posts = await current.json();

// Update specific post
await fetch('/api/crm/calendar', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: posts.posts[0].id,
    scheduledFor: '2024-02-10T15:00:00Z',  // Reschedule
    topic: 'Custom topic override'
  })
});
```

## Topic Generation Strategy

The system auto-generates topics based on:

1. **Portfolio Industry:** Extracted from `company_portfolios.industry`
2. **Content Type:** Educational, promotional, or news
3. **Variety:** Shuffles topics to avoid repetition

**Example Topics for "Fire Safety" Industry:**

**Educational:**
- "How to choose the right fire safety solution"
- "Top 10 mistakes in fire safety"
- "Understanding fire safety regulations"
- "Fire safety best practices for 2024"
- "Case study: Successful fire safety implementation"

**Promotional:**
- "Why choose [Company] for fire safety"
- "Special offer: fire safety services"
- "Meet our fire safety experts"

**News:**
- "Latest fire safety industry news"
- "New fire safety regulations announced"

## UI Features

### Calendar View

- **Monthly Calendar Grid:** Visual representation of scheduled posts
- **Color Coding:** Educational (blue), Promotional (purple), News (green)
- **Status Icons:** Clock (scheduled), Play (generating), Check (published), X (failed)

### Create Calendar Modal

- **Date Range Picker:** Start and end dates
- **Platform Toggles:** Enable/disable each platform
- **Posts Per Week:** Slider for each platform (1-20)
- **Content Mix Sliders:** Adjust educational/promotional/news percentages

### Scheduled Posts Table

- **Columns:** Scheduled For, Topic, Type, Platforms, Status, Actions
- **Filters:** By status (scheduled, published, failed)
- **Actions:** Edit, Delete
- **Bulk Actions:** Process due posts

## Integration with Other Agents

### Content Generation Agent

```typescript
// Content Calendar Agent calls Content Generation Agent
const contentPackage = await contentGenerationAgent.generateContent({
  portfolioId: post.portfolio_id,
  topic: post.topic,
  industry: portfolio.industry,
  contentType: contentFormat,  // blog, social_post, white_paper
  targetAudience: 'Business decision makers',
  depth: 'comprehensive',
  includeCitations: true
});
```

### Auto-Deploy Agent

```typescript
// Content Calendar Agent calls Auto-Deploy Agent
const deploymentReport = await autoDeployAgent.deployContent({
  contentId: contentPackage.id,
  content: contentPackage,
  platforms: platformConfigs,
  publishNow: true,
  portfolioId: post.portfolio_id
});
```

## Error Handling

### Failed Posts

If a post fails during generation or deployment:
- Status set to `failed`
- Error message stored in `error` column
- Autonomous action logged with failure details

**Recovery:**
1. View failed posts in UI
2. Check error message
3. Fix configuration (API keys, credentials)
4. Update post status to `scheduled`
5. Re-run process

### Manual Retry

```javascript
// Update failed post to retry
await fetch('/api/crm/calendar', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: failedPostId,
    status: 'scheduled'
  })
});

// Trigger immediate processing
await fetch('/api/crm/calendar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'process' })
});
```

## Next Steps

The Content Calendar system is **complete and production-ready**. Recommended next enhancements:

### 1. Performance Tracker Agent (Next Priority)
- Monitor views, engagement, conversions per post
- Calculate ROI (leads generated / cost)
- A/B test headlines, images, CTAs
- Provide optimization recommendations

### 2. Empire Dashboard UI
- Real-time agent status visualization
- Content queue management
- Quality metrics dashboard
- Cost tracking (daily/weekly/monthly)
- Performance analytics

### 3. Enhanced Scheduling
- Timezone support per platform
- Holiday/special event awareness
- Competitor posting analysis
- Dynamic optimal time adjustment based on actual performance

### 4. Content Recycling
- Auto-republish evergreen content after 6 months
- Update statistics and dates automatically
- Cross-platform content repurposing (blog → social posts)

## Deployment Checklist

- [x] Content Calendar Agent created
- [x] API endpoints implemented
- [x] Database table auto-created
- [x] UI page created
- [x] Integration with Content Generation Agent
- [x] Integration with Auto-Deploy Agent
- [x] Optimal posting times configured
- [x] Topic generation logic
- [x] Error handling
- [x] Autonomous action logging

## Testing Commands

```bash
# Test calendar generation
curl -X POST http://localhost:3000/api/crm/calendar \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioId": "portfolio-uuid",
    "startDate": "2024-02-01T00:00:00Z",
    "endDate": "2024-02-07T23:59:59Z",
    "platforms": [
      {
        "platform": "linkedin",
        "postsPerWeek": 3,
        "config": {}
      }
    ]
  }'

# Get scheduled posts
curl http://localhost:3000/api/crm/calendar?portfolioId=portfolio-uuid

# Process due posts
curl -X POST http://localhost:3000/api/crm/calendar \
  -H "Content-Type: application/json" \
  -d '{"action":"process"}'
```

## Environment Variables

```env
# Platform credentials (stored per portfolio in production)
LINKEDIN_ACCESS_TOKEN=...
LINKEDIN_PERSON_URN=...
FACEBOOK_ACCESS_TOKEN=...
FACEBOOK_PAGE_ID=...
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_TOKEN_SECRET=...
GMB_ACCESS_TOKEN=...
GMB_ACCOUNT_ID=...
GMB_LOCATION_ID=...
WORDPRESS_SITE_URL=...
WORDPRESS_USERNAME=...
WORDPRESS_APP_PASSWORD=...
NODEJS_PUBLISH_ENDPOINT=...
```

---

**Status:** ✅ Complete and Production-Ready

**Next:** Performance Tracker Agent (2 hours estimated)
