# 🔵 Bing Webmaster API Key Setup Guide

## Overview

The `BING_WEBMASTER_API_KEY` is used to access the **Bing Webmaster Tools API** (formerly Bing Webmaster Center API). This allows you to programmatically access search analytics, crawl data, and other SEO metrics from Bing.

**Important**: Unlike GMB, this is a simple API key (not OAuth), making it easier to set up.

## Prerequisites

- Microsoft account (can use any email)
- Verified website in Bing Webmaster Tools
- Active Bing Webmaster account

## Step 1: Sign Up / Sign In to Bing Webmaster Tools

### 1.1 Go to Bing Webmaster Tools
👉 https://www.bing.com/webmasters

### 1.2 Sign In
- Click **"Sign in"** (top right)
- Use your Microsoft account
  - Can use any email (@gmail.com, @outlook.com, etc.)
  - Will need to link to Microsoft account if not already

### 1.3 Accept Terms of Service
- Review and accept Bing Webmaster Tools Terms
- Click **"Accept"** or **"I Accept"**

## Step 2: Add and Verify Your Website

### 2.1 Add Your Site

1. Once signed in, click **"Add a site"**
2. Enter your website URL:
   ```
   https://geo-seo-domination-tool.vercel.app
   ```
3. Click **"Add"**

### 2.2 Choose Verification Method

Bing offers three verification methods:

#### Option A: XML File Verification (Easiest for Vercel/Next.js)

1. Download the XML file (e.g., `BingSiteAuth.xml`)
2. Add to your Next.js public folder:
   ```
   /public/BingSiteAuth.xml
   ```
3. Deploy to Vercel
4. Click **"Verify"** in Bing Webmaster

#### Option B: Meta Tag Verification

1. Copy the meta tag:
   ```html
   <meta name="msvalidate.01" content="1234567890ABCDEF" />
   ```
2. Add to your `app/layout.tsx` or `pages/_document.tsx`:
   ```tsx
   <head>
     <meta name="msvalidate.01" content="1234567890ABCDEF" />
   </head>
   ```
3. Deploy to Vercel
4. Click **"Verify"** in Bing Webmaster

#### Option C: DNS CNAME Verification

1. Add CNAME record to your DNS:
   ```
   Host: [provided by Bing]
   Points to: [provided by Bing]
   ```
2. Wait for DNS propagation (can take 24-48 hours)
3. Click **"Verify"** in Bing Webmaster

### 2.3 Complete Verification

- Click **"Verify"** button
- Wait for confirmation (usually instant)
- ✅ Site is now verified!

## Step 3: Access API Settings

### 3.1 Navigate to Settings

Once your site is verified:

1. Click **"Settings"** (gear icon) in left sidebar
2. Or click your profile icon → **"Settings"**
3. Or go directly to: https://www.bing.com/webmasters/users/usersettings

### 3.2 Find API Access Section

Look for one of these sections (Bing's UI changes occasionally):
- **"API access"**
- **"API Key"**
- **"Developer"**
- **"API Settings"**

## Step 4: Generate API Key

### 4.1 Generate Key

1. In the API section, click **"Generate API Key"** or **"Get API Key"**
2. Confirm your action
3. Your API key will be displayed

### 4.2 Copy and Save Key

**Your API key will look like:**
```
A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0
```

⚠️ **IMPORTANT**: 
- Copy the key immediately
- Save it securely
- You may not be able to see it again
- If lost, you can regenerate a new key (old one will be invalidated)

## Step 5: Configure Environment Variables

### Local Development (.env.local)

Add to your `.env.local` file:

```bash
# Bing Webmaster API Key
BING_WEBMASTER_API_KEY="your-actual-bing-api-key-here"

# Optional: Your site URL for API calls
BING_SITE_URL="https://geo-seo-domination-tool.vercel.app"
```

### Production (Vercel)

Add via CLI:
```bash
vercel env add BING_WEBMASTER_API_KEY production
# Paste your API key when prompted

vercel env add BING_SITE_URL production  
# Enter: https://geo-seo-domination-tool.vercel.app
```

Or via Vercel Dashboard:
1. Go to: https://vercel.com/your-org/geo-seo-domination-tool/settings/environment-variables
2. Click **"Add"**
3. Name: `BING_WEBMASTER_API_KEY`
4. Value: Your API key
5. Environment: Production (and Preview, Development if needed)
6. Click **"Save"**

## Step 6: Test Your API Connection

### 6.1 Test with cURL

```bash
# Get URL statistics
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "siteUrl": "https://geo-seo-domination-tool.vercel.app",
    "apikey": "YOUR_API_KEY"
  }' \
  https://ssl.bing.com/webmaster/api.svc/json/GetUrlStatistics
```

### 6.2 Test in Your Code

```javascript
// Test API connection
async function testBingAPI() {
  const response = await fetch(
    'https://ssl.bing.com/webmaster/api.svc/json/GetUrlStatistics',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: process.env.BING_SITE_URL,
        apikey: process.env.BING_WEBMASTER_API_KEY
      })
    }
  );

  const data = await response.json();
  console.log('Bing API Response:', data);
  return data;
}
```

### 6.3 Expected Response

Success response:
```json
{
  "d": {
    "UrlCrawled": 125,
    "UrlInIndex": 100,
    "UrlSubmitted": 150,
    "CrawlErrors": 5
  }
}
```

Error response:
```json
{
  "ErrorCode": "InvalidApiKey",
  "Message": "The API key is invalid"
}
```

## Common API Endpoints

### Base URL
```
https://ssl.bing.com/webmaster/api.svc/json
```

### Available Endpoints

#### 1. URL Statistics
```javascript
POST /GetUrlStatistics
Body: { siteUrl, apikey }
Returns: Crawled URLs, indexed URLs, errors
```

#### 2. Query Statistics (Search Analytics)
```javascript
POST /GetQueryStats
Body: { siteUrl, apikey, query }
Returns: Impressions, clicks, CTR for keywords
```

#### 3. Page Traffic Statistics
```javascript
POST /GetPageTrafficStats  
Body: { siteUrl, apikey }
Returns: Page-level traffic data
```

#### 4. Rank and Traffic Stats
```javascript
POST /GetRankAndTrafficStats
Body: { siteUrl, apikey, query, country }
Returns: Keyword rankings and traffic
```

#### 5. Crawl Stats
```javascript
POST /GetCrawlStats
Body: { siteUrl, apikey }
Returns: Crawl frequency, errors, blocked URLs
```

#### 6. Index Stats
```javascript
POST /GetIndexStats  
Body: { siteUrl, apikey }
Returns: Indexation status, sitemap stats
```

#### 7. Backlinks
```javascript
POST /GetUrlBacklinks
Body: { siteUrl, apikey, url }
Returns: Backlink data for specific URL
```

#### 8. Crawl Errors
```javascript
POST /GetCrawlIssues
Body: { siteUrl, apikey }
Returns: List of crawl errors and issues
```

#### 9. Submit URLs
```javascript
POST /SubmitUrl
Body: { siteUrl, apikey, url }
Returns: Submission status
```

#### 10. Submit Sitemap
```javascript
POST /SubmitSitemap
Body: { siteUrl, apikey, sitemapUrl }
Returns: Sitemap submission status
```

## Usage Examples

### Example 1: Get Search Analytics

```javascript
// lib/bing/get-search-stats.js
export async function getBingSearchStats(query = null) {
  const response = await fetch(
    'https://ssl.bing.com/webmaster/api.svc/json/GetQueryStats',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: process.env.BING_SITE_URL,
        apikey: process.env.BING_WEBMASTER_API_KEY,
        query: query // null for all queries
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Bing API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.d; // Bing wraps response in 'd' property
}
```

### Example 2: Get Crawl Issues

```javascript
// lib/bing/get-crawl-issues.js
export async function getBingCrawlIssues() {
  const response = await fetch(
    'https://ssl.bing.com/webmaster/api.svc/json/GetCrawlIssues',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: process.env.BING_SITE_URL,
        apikey: process.env.BING_WEBMASTER_API_KEY
      })
    }
  );

  const data = await response.json();
  return data.d.CrawlIssues || [];
}
```

### Example 3: Submit URL for Indexing

```javascript
// lib/bing/submit-url.js
export async function submitUrlToBing(url) {
  const response = await fetch(
    'https://ssl.bing.com/webmaster/api.svc/json/SubmitUrl',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: process.env.BING_SITE_URL,
        apikey: process.env.BING_WEBMASTER_API_KEY,
        url: url
      })
    }
  );

  const data = await response.json();
  return data.d;
}
```

### Example 4: API Route Integration

```javascript
// app/api/bing/stats/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      'https://ssl.bing.com/webmaster/api.svc/json/GetUrlStatistics',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: process.env.BING_SITE_URL,
          apikey: process.env.BING_WEBMASTER_API_KEY
        })
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Bing API request failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data.d);
  } catch (error) {
    console.error('Bing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Rate Limits & Quotas

**Bing Webmaster API Limits:**
- **10,000 API calls per day** (free tier)
- Rate limit resets daily at midnight UTC
- No per-second rate limit specified
- Monitor usage in Bing Webmaster dashboard

**Best Practices:**
- Cache API responses when possible
- Implement exponential backoff for retries
- Monitor daily usage to avoid hitting limits
- Consider batching requests where supported

## Security Best Practices

### ✅ DO:
- Keep API key in environment variables
- Use HTTPS for all API requests
- Monitor API usage regularly
- Regenerate key if compromised
- Use separate keys for dev/staging/prod if possible

### ❌ DON'T:
- Never commit API key to Git
- Don't expose in frontend code
- Don't share publicly
- Don't use `NEXT_PUBLIC_` prefix
- Don't hardcode in source files

## Troubleshooting

### Issue: "API Key Not Found" in Settings

**Possible Causes:**
- Account too new (may need 24-48 hours after site verification)
- Site not fully verified
- Region restrictions

**Solutions:**
- Wait 24-48 hours after site verification
- Re-verify your website
- Check account email for verification status
- Try accessing from different browser
- Contact Bing support if issue persists

### Issue: "InvalidApiKey" Error

**Causes:**
- API key copied incorrectly
- Extra spaces in key
- Key expired or regenerated
- Using wrong key for wrong site

**Solutions:**
- Double-check key copied exactly
- Trim whitespace from key
- Regenerate key in Bing Webmaster
- Verify you're using correct site URL

### Issue: "Unauthorized" or "Access Denied"

**Causes:**
- Site URL doesn't match verified site
- API key not activated yet
- Account suspended

**Solutions:**
- Ensure siteUrl in request matches verified site exactly (http vs https)
- Wait 15 minutes after generating key for activation
- Check account status in Bing Webmaster dashboard
- Contact Bing support

### Issue: "Daily Limit Exceeded"

**Cause:** Hit the 10,000 requests/day limit

**Solutions:**
- Wait until midnight UTC for reset
- Implement caching to reduce API calls
- Review and optimize API usage patterns
- Contact Bing if you need higher limits

### Issue: No Data Returned

**Causes:**
- Site is newly added (takes time to collect data)
- No traffic from Bing yet
- Site not indexed by Bing

**Solutions:**
- Wait 48-72 hours after verification
- Submit sitemap to Bing
- Ensure site is crawlable by Bing
- Check robots.txt isn't blocking Bing

## Response Format

All Bing API responses are wrapped in a `d` property:

```javascript
// Raw response
{
  "d": {
    "UrlCrawled": 100,
    "UrlInIndex": 85
  }
}

// Access data
const stats = response.d;
console.log(stats.UrlCrawled); // 100
```

## Error Codes

Common error codes you might encounter:

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `InvalidApiKey` | API key is wrong or invalid | Regenerate key |
| `Unauthorized` | No access to this site | Verify site ownership |
| `InvalidSiteUrl` | Site URL format incorrect | Check URL format |
| `DailyLimitExceeded` | Hit rate limit | Wait for reset |
| `InternalServerError` | Bing server issue | Retry later |

## Additional Resources

- **Bing Webmaster Tools**: https://www.bing.com/webmasters
- **API Documentation**: https://docs.microsoft.com/en-us/bingwebmaster/
- **Help Center**: https://www.bing.com/webmasters/help
- **Community Forum**: https://www.bing.com/webmasters/community
- **Support**: https://www.bing.com/webmasters/help/help-center-sitemaps-3b5cf44f

## Comparison: Bing vs Google Search Console

| Feature | Bing Webmaster | Google Search Console |
|---------|----------------|----------------------|
| **API Type** | Simple API Key | OAuth 2.0 |
| **Setup Complexity** | Easy | Moderate |
| **Rate Limits** | 10K/day | 100K/day |
| **Data Freshness** | 24-48 hours | 24-72 hours |
| **Keyword Data** | Yes | Yes |
| **Backlinks** | Yes | Limited |
| **Index Coverage** | Yes | Yes |

## Summary Checklist

- [ ] Create/sign in to Microsoft account
- [ ] Add site to Bing Webmaster Tools
- [ ] Verify site ownership (XML file, meta tag, or DNS)
- [ ] Navigate to Settings → API Access
- [ ] Generate API key
- [ ] Copy and save API key securely
- [ ] Add to `.env.local` for local development
- [ ] Add to Vercel environment variables for production
- [ ] Test API connection with sample request
- [ ] Implement error handling and rate limiting
- [ ] Monitor API usage in Bing dashboard

---

**Status**: ✅ Ready to obtain Bing Webmaster API key!

**Next Steps**: 
1. Sign in to Bing Webmaster Tools
2. Verify your website
3. Generate API key
4. Add to environment variables

**Related Guides**:
- [Google PageSpeed API Setup](./GOOGLE_SPEED_KEY_SETUP.md)
- [GMB OAuth Token Setup](./GMB_OAUTH_TOKEN_SETUP.md)
