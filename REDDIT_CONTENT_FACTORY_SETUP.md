# Reddit Content Factory - Quick Start Guide

## 🎯 Overview

Your **Niche Growth Engine** with Reddit API integration is production-ready! This guide will walk you through the 10-minute setup to start discovering content opportunities.

---

## ✅ Step 1: Create Reddit API Application (5 minutes)

### 1.1 Create or Use Dedicated Reddit Account

**IMPORTANT**: Use a dedicated account, NOT your personal Reddit account.

- If you don't have one, create a new Reddit account at https://www.reddit.com/register
- Choose a username like `geoseo-tool` or `content-miner-bot`
- Verify the email address

### 1.2 Create Reddit App

1. **Log in** to your dedicated Reddit account
2. Go to: **https://www.reddit.com/prefs/apps**
3. Scroll down and click **"Create App"** or **"Create Another App"**
4. Fill in the form:

   ```
   Name: GEO-SEO Content Mining Tool
   
   App type: ● script  [CRITICAL: Must select "script"]
   
   Description: Content gap mining for SEO opportunities
   
   About URL: [leave blank]
   
   Redirect URI: http://localhost:3000
   ```

5. Click **"Create app"**

### 1.3 Copy Your Credentials

After creating the app, you'll see:

```
GEO-SEO Content Mining Tool
script app
[14-character client ID appears here]

secret         [27-character secret]       [edit] [delete]
```

**Copy these values:**
- **Client ID**: The 14-character string under your app name (e.g., `AbCdEfGhIjKlMn`)
- **Client Secret**: The 27-character string next to "secret" (e.g., `AbCdEfGhIjKlMnOpQrStUvWxYz1`)

---

## ✅ Step 2: Configure Environment Variables (2 minutes)

Open your `.env.local` file and replace the placeholder values:

```env
# ===================================
# Reddit API (Content Gap Mining)
# ===================================
REDDIT_CLIENT_ID=AbCdEfGhIjKlMn
REDDIT_CLIENT_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz1
REDDIT_USERNAME=geoseo-tool
REDDIT_PASSWORD=your_account_password
REDDIT_USER_AGENT=geo-seo-tool/1.0 by geoseo-tool
```

**Important Notes:**
- Replace `geoseo-tool` with YOUR Reddit username in both `REDDIT_USERNAME` and `REDDIT_USER_AGENT`
- The user agent format is: `app-name/version by reddit-username`
- Never commit this file to version control

---

## ✅ Step 3: Install Dependencies

If you haven't already, install the Reddit API client:

```bash
npm install snoowrap
```

---

## ✅ Step 4: Test Your First Keyword (3 minutes)

### Method 1: Using the Web UI (Recommended)

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to Content Opportunities:**
   - Open http://localhost:3000
   - Click on **"Content Opportunities"** in the sidebar (marked "NEW")

3. **Discover opportunities:**
   - Enter seed keyword: `mould removal Brisbane`
   - Click **"Discover Opportunities"**
   - Wait 30-60 seconds for analysis

4. **Review results:**
   - Opportunities ranked by score (higher = better)
   - Click any opportunity to see details
   - Top questions from Reddit discussions
   - Gap signals (mentions, confusion, dissatisfaction)

### Method 2: Using API Directly

```bash
curl -X POST http://localhost:3000/api/content-opportunities/discover \
  -H "Content-Type: application/json" \
  -d '{
    "seedKeyword": "mould removal Brisbane",
    "companyId": 1,
    "subreddits": ["all"],
    "topN": 10,
    "minScore": 0,
    "includeAEO": true
  }'
```

---

## ✅ Step 5: Generate Sample Content (2 minutes)

Once you have discovered opportunities:

1. **Click "Generate Content"** on any high-scoring opportunity (score > 2.5)

2. **System generates:**
   - **Article Plan** with:
     - SEO-optimized title and meta
     - Canonical answer for AI engines
     - Full outline with H2/H3 structure
     - FAQ section
     - Compliance notes
     - Visual assets list
     - Citations

   - **Social Media Pack** with:
     - LinkedIn post (professional tone)
     - Facebook post (conversational)
     - Instagram caption with hashtags
     - X/Twitter thread (5-7 tweets)
     - 30-second video script

   - **Newsletter Item** with:
     - Compelling headline
     - Urgency hook
     - 3 actionable takeaways
     - CTA with UTM tracking

3. **Review and customize** the generated content for your brand

---

## 📊 What Success Looks Like

### Expected Results for "mould removal Brisbane"

```json
{
  "opportunities": [
    {
      "keyword": "mould removal insurance claim process",
      "volume": 2400,
      "difficulty": 0.45,
      "opportunityScore": 3.87,  ⭐ HIGH VALUE
      "gap": {
        "redditMentions": 28,
        "repeatedQuestions": 12,
        "confusionMarkers": 15,
        "dissatisfactionMarkers": 8
      },
      "topQuestions": [
        "How long does a mould removal claim take?",
        "What does insurance cover for mould damage?",
        "Can I claim mould damage without proof?"
      ]
    }
  ]
}
```

### Opportunity Score Guide

| Score | Level | Action |
|-------|-------|--------|
| < 1.5 | Low | Skip or deprioritize |
| 1.5 - 2.5 | Medium | Consider if niche-relevant |
| 2.5 - 3.5 | High | **Prioritize for content** |
| > 3.5 | Exceptional | **Create immediately** |

---

## 🎨 Customizing Content Factory Templates

If you want to adjust the tone or structure of generated content:

**File to edit:** `app/api/content-opportunities/[id]/generate/route.ts`

### Example: Change Article Tone

```typescript
// Find this line (~54):
const articlePrompt = `You are a senior editor writing for trade professionals.

// Change to:
const articlePrompt = `You are a friendly expert writing for homeowners.

Topic: ${opportunity.keyword}
Tone: Warm, approachable, no jargon
Audience: Homeowners (explain everything clearly)
...`;
```

### Example: Add More Social Platforms

```typescript
// Add after the Twitter thread section:

## TikTok Script (15 seconds)
[Hook (2 sec), Problem (5 sec), Solution (6 sec), CTA (2 sec)]

## Pinterest Pin Description
[SEO-optimized description with keywords]
```

---

## 🔧 Troubleshooting

### "Reddit API authentication failed"

**Solutions:**
1. ✅ Verify `REDDIT_CLIENT_ID` is exactly 14 characters
2. ✅ Verify `REDDIT_CLIENT_SECRET` is exactly 27 characters
3. ✅ Ensure app type is **"script"** (not "web app")
4. ✅ Check username and password are correct
5. ✅ Verify user agent format: `app-name/version by your-username`
6. ✅ Make sure you're using a regular Reddit account (not a suspended one)

### "No opportunities found"

**Possible causes:**
1. **Keyword too broad**: Try more specific terms
   - ❌ "water damage" → ✅ "water damage insurance claim Brisbane"
2. **Low search volume**: Keyword has <10 searches/month
3. **No Reddit discussions**: Topic not discussed on Reddit
4. **Min score too high**: Set `minScore: 0` in API request

### "Content generation failed"

**Solutions:**
1. ✅ Verify `ANTHROPIC_API_KEY` is set in `.env.local`
2. ✅ Check Claude API quota/limits at https://console.anthropic.com
3. ✅ Ensure opportunity has `top_questions` data (Reddit search succeeded)
4. ✅ Review error message in API response for specific issue

### Rate Limiting

**Reddit API limits:**
- 60 requests/minute (OAuth)
- If analyzing 50+ keywords, add delays between requests

**Best practice:**
- Start with 10-15 keywords per batch
- Analyze 15-25 threads per keyword
- Monitor rate limit headers in responses

---

## 🚀 Advanced Usage

### Targeted Subreddit Discovery

Instead of searching all of Reddit, target specific communities:

```json
{
  "seedKeyword": "mould removal Brisbane",
  "subreddits": ["HomeImprovement", "Insurance", "DIY", "Plumbing"],
  "topN": 10
}
```

### Batch Processing Multiple Keywords

```bash
# Create a keywords file
cat > keywords.txt << EOF
mould removal Brisbane
water damage restoration
flood cleanup Brisbane
carpet drying services
EOF

# Process each keyword (requires custom script)
while read keyword; do
  curl -X POST http://localhost:3000/api/content-opportunities/discover \
    -H "Content-Type: application/json" \
    -d "{\"seedKeyword\": \"$keyword\", \"companyId\": 1}"
  sleep 5  # Rate limit protection
done < keywords.txt
```

### Filtering by Opportunity Score

```bash
# Only get high-value opportunities (score > 2.5)
curl "http://localhost:3000/api/content-opportunities?minScore=2.5&limit=20"
```

---

## 📈 Next Steps

Once you've generated your first content:

1. **Publish & Track**
   - Copy article outline to your CMS
   - Publish social media posts
   - Send newsletter item
   - Track rankings and traffic

2. **Iterate & Improve**
   - Monitor which content performs best
   - Refine your keyword targeting
   - Adjust content templates based on results

3. **Scale Up**
   - Add more seed keywords
   - Target specific subreddits
   - Create content calendars
   - Automate publishing (future feature)

---

## 📚 Additional Resources

- **System Documentation**: `NICHE_GROWTH_ENGINE.md`
- **API Reference**: Your API routes in `app/api/content-opportunities/`
- **Reddit API Docs**: https://www.reddit.com/dev/api
- **DataForSEO Docs**: https://docs.dataforseo.com

---

## 🎯 Quick Checklist

Before you start:

- [ ] Created dedicated Reddit account
- [ ] Created Reddit app (type: "script")
- [ ] Copied Client ID (14 chars)
- [ ] Copied Client Secret (27 chars)
- [ ] Updated `.env.local` with credentials
- [ ] Installed `snoowrap` package
- [ ] Started dev server (`npm run dev`)
- [ ] Tested with first keyword
- [ ] Generated sample content
- [ ] Reviewed content quality

---

**Need Help?**

If you encounter issues:
1. Check the troubleshooting section above
2. Review error messages in browser console
3. Check server logs in terminal
4. Verify all environment variables are set correctly

---

**Built with ❤️ by the GEO-SEO Team**

*Transform Reddit discussions into content opportunities that dominate local search.*
