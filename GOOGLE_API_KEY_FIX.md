# 🚨 CRITICAL: Google API Key Expired

## Problem
The Google Places API key has expired, causing **ALL business lookups to fail**.

**Error:** `REQUEST_DENIED - The provided API key is expired`

This affects:
- ❌ New Client onboarding (can't auto-populate business data)
- ❌ Business profile lookups
- ❌ Competitor discovery
- ❌ Location-based features

---

## Solution: Generate New Google API Key

### Step 1: Go to Google Cloud Console
https://console.cloud.google.com/apis/credentials

### Step 2: Create New API Key
1. Click **"Create Credentials"** → **"API Key"**
2. Copy the new key immediately
3. Click **"Restrict Key"** (IMPORTANT for security)

### Step 3: Enable Required APIs
Go to: https://console.cloud.google.com/apis/library

Enable these APIs for your project:
- ✅ **Places API** (legacy)
- ✅ **Places API (New)**
- ✅ **Maps JavaScript API**
- ✅ **Geocoding API**
- ✅ **Maps Static API** (optional, for maps display)

### Step 4: Restrict the API Key
1. Go back to Credentials
2. Click on your new API key
3. Under **"API restrictions"**, select **"Restrict key"**
4. Choose **"Places API"**, **"Places API (New)"**, **"Maps JavaScript API"**, **"Geocoding API"**
5. Under **"Application restrictions"**, select:
   - **"HTTP referrers (web sites)"** for production
   - **"IP addresses"** for development
   - OR **"None"** for testing (LESS SECURE)

### Step 5: Update Environment Variables

**Local Development (.env.local)**:
```bash
GOOGLE_API_KEY=YOUR_NEW_KEY_HERE
NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY=YOUR_NEW_KEY_HERE
```

**Production (Vercel)**:
1. Go to: https://vercel.com/unite-group/geo-seo-domination-tool/settings/environment-variables
2. Update **`GOOGLE_API_KEY`**
3. Update **`NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY`**
4. Redeploy

### Step 6: Test the Fix

Run this command after updating the key:
```bash
node scripts/test-business-lookup.mjs
```

**Expected output:**
```
========== Testing: https://www.carsi.com.au ==========
Status: 200
Found: true  ✅
Business Name: Carsi (or similar)
Website: https://www.carsi.com.au
Address: ...
Phone: ...
```

---

## Alternative: Use SEMrush or Custom Scraper

If Google Places API is too expensive or complex, we can implement:

### Option 1: Website Scraping (Free)
- Fetch business website
- Extract business name from `<title>` or Schema.org markup
- Extract phone, address from footer/contact page
- Extract social links

### Option 2: SEMrush API (Already Integrated)
- Use SEMrush domain overview API
- Get traffic, keywords, competitors
- No GBP data, but SEO data is available

### Option 3: Hybrid Approach
- Scrape website for basic info (name, address, phone)
- Use SEMrush for SEO data
- Skip Google Places entirely

---

## Quick Scraper Implementation

If you want me to implement the scraper fallback NOW (without waiting for Google API key), let me know. I can have it working in 10 minutes.

The scraper would:
1. ✅ Fetch the website HTML
2. ✅ Extract business name from `<title>`, `<meta>`, or Schema.org
3. ✅ Extract phone number using regex patterns
4. ✅ Extract address from Schema.org LocalBusiness
5. ✅ Detect platform (WordPress, Shopify, etc.)
6. ✅ Return found: true with auto-populated data

---

## Cost Comparison

**Google Places API:**
- $17 per 1000 requests (Place Details)
- $17 per 1000 requests (Find Place)
- **Total per lookup:** ~$0.034 (2 API calls)
- **100 lookups/month:** $3.40

**Website Scraping:**
- $0.00 (free)
- No API limits
- Faster for websites we already have URLs for

**SEMrush API:**
- Already have API key configured
- $0.00 additional cost (part of existing subscription)
- Better SEO data than Google Places

---

## Recommendation

**SHORT TERM (NOW):**
Implement website scraper fallback so business lookup works immediately.

**MEDIUM TERM (THIS WEEK):**
Get new Google API key for businesses without websites or better GBP data.

**LONG TERM:**
Use hybrid:
- If user provides URL → Scrape website (free, instant)
- If user provides business name → Google Places (paid, accurate)
- Enrich both with SEMrush data

This gives best of all worlds.

---

## Next Steps

**What do you want me to do?**

1. ✅ **[FASTEST]** Implement website scraper fallback RIGHT NOW (10 minutes)
   - Works for carsi.com.au, disasterrecovery.com.au immediately
   - No API key needed
   - Free

2. ⏸ **[WAITING]** Wait for you to generate new Google API key
   - More accurate for businesses without websites
   - Costs money per lookup
   - Provides GBP data

3. ✅ **[HYBRID]** Implement both (15 minutes)
   - Scraper for URLs
   - Google Places for business names
   - Best user experience

**Tell me which option and I'll implement it immediately.**
