# Bing Webmaster Tools Setup Guide

## 🔍 What You Have

You have a **Bing Webmaster verification meta tag**:

```html
<meta name="msvalidate.01" content="DB030D197A83DF2F524BF0DFBACDC52C" />
```

This is used to verify ownership of your website with Bing Webmaster Tools.

## 📋 Step-by-Step Setup

### Step 1: Verify Your Website with Bing

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Sign in with your Microsoft account
3. Click "Add a site"
4. Enter your website URL (e.g., `https://yourdomain.com`)
5. Choose verification method: **Meta tag** (you already have this)
6. Add the meta tag to your website's `<head>` section
7. Click "Verify"

### Step 2: Add Meta Tag to Your Next.js Site

Add the verification tag to your site's HTML head:

**Option A: Update `app/layout.tsx` (Root Layout)**

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Bing Webmaster Verification */}
        <meta name="msvalidate.01" content="DB030D197A83DF2F524BF0DFBACDC52C" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
```

**Option B: Use Next.js Metadata API (Recommended)**

```tsx
// app/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GEO-SEO Domination Tool',
  description: 'Comprehensive SEO and Local Ranking Analysis',
  verification: {
    other: {
      'msvalidate.01': 'DB030D197A83DF2F524BF0DFBACDC52C',
    },
  },
};
```

### Step 3: Get Your Bing API Key

1. In Bing Webmaster Tools, click **Settings** → **API access**
2. Click "Get API Key"
3. Copy your API key
4. Add to `.env.local`:

```bash
# Bing Webmaster Tools API
BING_WEBMASTER_API_KEY="your_api_key_here"
```

### Step 4: Test Bing Webmaster API

Once you have your API key, test the connection:

```bash
# Create a test script
node scripts/test-bing-webmaster.mjs
```

Create the test script:

```javascript
// scripts/test-bing-webmaster.mjs
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const BING_API_BASE = 'https://ssl.bing.com/webmaster/api.svc/json';
const siteUrl = 'https://yourdomain.com'; // Replace with your domain

async function testBingAPI() {
  const apiKey = process.env.BING_WEBMASTER_API_KEY;

  if (!apiKey) {
    console.error('❌ BING_WEBMASTER_API_KEY not found in .env.local');
    return;
  }

  try {
    console.log('🔍 Testing Bing Webmaster API...');

    // Test: Get URL statistics
    const response = await axios.get(`${BING_API_BASE}/GetUrlStatistics`, {
      params: {
        apikey: apiKey,
        siteUrl: siteUrl,
      },
    });

    console.log('✅ API connection successful!');
    console.log('📊 URL Statistics:', response.data.d);
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
  }
}

testBingAPI();
```

### Step 5: Deploy Verification Tag to Production

1. Commit the meta tag changes:
   ```bash
   git add app/layout.tsx
   git commit -m "feat: add Bing Webmaster verification meta tag"
   git push origin main
   ```

2. Deploy to Vercel:
   ```bash
   npx vercel --prod
   ```

3. Return to Bing Webmaster Tools and click "Verify"

### Step 6: Add Bing API Key to Vercel

Once verified and you have your API key:

```bash
npx vercel env add BING_WEBMASTER_API_KEY production preview development
# Paste your Bing API key when prompted
```

## 🎯 What This Enables

Once Bing Webmaster Tools is set up, the Onboarding Vitals system can capture:

### Bing Webmaster Metrics (10% of Health Score)

- ✅ **SEO Score** (0-100) - Bing's overall site quality score
- ✅ **Pages Indexed** - How many pages Bing has indexed
- ✅ **Crawl Errors** - Technical issues preventing indexing
- ✅ **Backlinks** - Total inbound links
- ✅ **Linking Domains** - Unique domains linking to you
- ✅ **Impressions & Clicks** - Search performance on Bing
- ✅ **Top Queries** - Keywords driving Bing traffic
- ✅ **Mobile Friendly** - Mobile usability status
- ✅ **Crawl Rate** - Pages crawled per day

## 📊 Bing Vitals Capture Flow

After setup, the system will automatically capture Bing data:

```typescript
// POST /api/onboarding/vitals/capture
{
  "companyId": "uuid",
  "options": {
    "includeBing": true  // ← Now this will work!
  }
}
```

**Response includes**:
```json
{
  "bing": {
    "seoScore": 85,
    "pagesIndexed": 142,
    "backlinks": 1247,
    "linkingDomains": 38,
    "impressions": 15234,
    "clicks": 892,
    "ctr": 5.85
  }
}
```

## 🔍 Verification Status Check

To check if your site is verified:

```bash
curl "https://ssl.bing.com/webmaster/api.svc/json/GetUrlStatistics?apikey=YOUR_API_KEY&siteUrl=https://yourdomain.com"
```

**Expected Response**:
```json
{
  "d": {
    "CrawledUrls": 142,
    "IndexedUrls": 138,
    "InlinksCount": 1247
  }
}
```

## 🚨 Common Issues

### Issue 1: "Site not verified"
**Solution**: Make sure the meta tag is in the `<head>` section and deployed to production, then click "Verify" in Bing Webmaster Tools.

### Issue 2: "API key invalid"
**Solution**: Regenerate your API key in Bing Webmaster Tools → Settings → API access.

### Issue 3: "Site not found"
**Solution**: Ensure you've added your site to Bing Webmaster Tools first before trying to use the API.

## 📝 Next Steps After Setup

1. ✅ Add verification meta tag to your site
2. ✅ Deploy to production
3. ✅ Verify ownership in Bing Webmaster Tools
4. ✅ Get API key
5. ✅ Add API key to `.env.local` and Vercel
6. ✅ Test vitals capture with Bing enabled
7. ✅ View Bing metrics in your vitals dashboard

## 📚 Related Documentation

- **Bing Webmaster Tools**: https://www.bing.com/webmasters
- **Bing API Documentation**: https://learn.microsoft.com/en-us/bingwebmaster/
- **Bing Service Client**: `services/api/bing-webmaster.ts`
- **Vitals Capture Endpoint**: `app/api/onboarding/vitals/capture/route.ts`

---

**Verification Code**: `DB030D197A83DF2F524BF0DFBACDC52C`
**Status**: ⏳ Pending deployment and verification
**Last Updated**: January 11, 2025
