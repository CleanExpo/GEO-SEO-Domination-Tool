# FREE API SETUP GUIDE
**Zero-Cost SEO Tool Configuration**

This guide shows you how to set up the FREE APIs that power the GEO-SEO Domination Tool, saving you $420/month compared to paid alternatives.

---

## 1. OpenRouter (DeepSeek V3 Access) - $5-10/month

**What it provides:**
- DeepSeek R1 (reasoning model) - 90% cheaper than GPT-4
- DeepSeek Chat - Fast responses
- Access to 100+ other AI models

**Setup:**

1. Go to https://openrouter.ai
2. Sign up (free account)
3. Add payment method (you only pay for what you use)
4. Go to "Keys" → Create new key
5. Copy the key (starts with `sk-or-v1-...`)

**Add to Vercel:**
```bash
cd web-app
vercel env add OPENROUTER_API_KEY
# Paste your key when prompted
# Select: Production, Preview, Development (all)
```

**Add to Local:**
```bash
# web-app/.env.local
OPENROUTER_API_KEY="sk-or-v1-..."
```

**Cost:** ~$5-10/month for typical usage (vs $50-100/month for OpenAI)

---

## 2. Google Search Console API - FREE

**What it provides:**
- 100% accurate ranking data from Google
- Historical data (16 months)
- Clicks, impressions, CTR
- Device breakdown
- Page-level performance

**Setup:**

### Step 1: Enable API in Google Cloud Console

1. Go to https://console.cloud.google.com
2. Create a new project (or select existing)
3. Enable "Google Search Console API"
4. Go to "Credentials" → Create OAuth 2.0 Client ID
5. Application type: "Web application"
6. Authorized redirect URIs: Add your domain
   ```
   https://your-domain.vercel.app/api/auth/google/callback
   http://localhost:3000/api/auth/google/callback
   ```

### Step 2: Add Credentials to Environment

```bash
# Add to Vercel
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET

# Add to Local (.env.local)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### Step 3: User Connection Flow

Users will connect their Google Search Console via OAuth:
1. Go to `/settings/integrations/google`
2. Click "Connect Site"
3. Authorize access to Google Search Console
4. Select which site to track

**Cost:** FREE (200 requests/day quota - plenty for most users)

---

## 3. DataForSEO (Keyword Research) - OPTIONAL

**Note:** You already have `DATAFORSEO_API_KEY` configured! This is for additional features.

**What it provides:**
- Keyword difficulty scores
- Search volume data
- Local pack positions
- SERP features

**Current Setup:**
```bash
# Already in .env.local
DATAFORSEO_API_KEY="phill@disasterrecovery.com.au:f1f7eebc972699a7"
```

**Add to Vercel:**
```bash
vercel env add DATAFORSEO_API_KEY
# Value: phill@disasterrecovery.com.au:f1f7eebc972699a7
```

**Cost:** Pay-as-you-go (can be used sparingly to minimize cost)

---

## 4. Google Maps API - FREE (28,000 requests/month)

**What it provides:**
- Local business search
- Competitor location data
- Place details (ratings, reviews, hours)

**Setup:**

1. Go to https://console.cloud.google.com
2. Enable "Maps JavaScript API" and "Places API"
3. Create API key (restrict to your domain)
4. **Already configured:** You have `GOOGLE_API_KEY` ✅

**Add to Vercel (if not already):**
```bash
vercel env add GOOGLE_API_KEY
# Your existing key: AIzaSyAadUhtaRrrdlSrL2Q_liY4-0fZqQttLjg
```

**Cost:** FREE up to 28,000 requests/month (then $0.017/request)

---

## 5. Verify All Environment Variables

**Run this command to check:**
```bash
cd web-app
vercel env pull .env.production
cat .env.production
```

**Required Variables:**

✅ **Already Set:**
- `GOOGLE_API_KEY` - For Maps/PageSpeed
- `FIRECRAWL_API_KEY` - For web scraping
- `PERPLEXITY_API_KEY` - For research
- `SEMRUSH_API_KEY` - For competitor data
- `OPENAI_API_KEY` - Fallback AI model
- `NEXT_PUBLIC_SUPABASE_URL` - Database
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Database auth
- `SUPABASE_SERVICE_ROLE_KEY` - Database admin

🆕 **Need to Add:**
- `OPENROUTER_API_KEY` - For DeepSeek V3 ($5-10/mo)
- `GOOGLE_CLIENT_ID` - For OAuth (FREE)
- `GOOGLE_CLIENT_SECRET` - For OAuth (FREE)
- `DATAFORSEO_API_KEY` - Optional, for advanced features

---

## 6. Cost Comparison

### Before (Paid APIs):
- DataForSEO: $150/month
- SEMrush Premium: $230/month
- OpenAI GPT-4: $50/month
- **Total: $430/month**

### After (Free + OpenRouter):
- OpenRouter (DeepSeek): $5-10/month
- Google Search Console: FREE
- Google Maps API: FREE (under quota)
- Firecrawl: FREE tier
- **Total: $5-10/month**

**Savings: $420/month = $5,040/year!**

---

## 7. Quick Start Commands

**Set everything up in 5 minutes:**

```bash
# 1. Get OpenRouter key
echo "1. Go to https://openrouter.ai and get your API key"
read -p "Enter OPENROUTER_API_KEY: " OPENROUTER_KEY

# 2. Add to Vercel
cd web-app
vercel env add OPENROUTER_API_KEY
# Paste: $OPENROUTER_KEY

# 3. Add to local
echo "OPENROUTER_API_KEY=\"$OPENROUTER_KEY\"" >> .env.local

# 4. Add DataForSEO to Vercel
vercel env add DATAFORSEO_API_KEY
# Value: phill@disasterrecovery.com.au:f1f7eebc972699a7

# 5. Deploy
vercel --prod
```

**That's it!** Your FREE SEO tool is ready to use.

---

## 8. Testing the Setup

**Test DeepSeek via OpenRouter:**
```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d '{
    "model": "deepseek/deepseek-chat",
    "messages": [{"role": "user", "content": "Say hello!"}]
  }'
```

**Test Google Search Console:**
- Go to `/settings/integrations/google`
- Click "Connect Site"
- Verify OAuth flow works

**Test Rankings Dashboard:**
- Go to `/companies/[id]/real-rankings`
- Click "Sync Now"
- Verify data appears

**Test AI Insights:**
- On rankings page, click "AI Insights"
- Verify DeepSeek analyzes your data

---

## 9. Troubleshooting

**"OpenRouter API key not configured"**
- Make sure `OPENROUTER_API_KEY` is set in Vercel
- Run `vercel env pull` to sync locally
- Redeploy: `vercel --prod`

**"Google Search Console API error"**
- Verify API is enabled in Google Cloud Console
- Check OAuth redirect URIs are correct
- Ensure user has access to the site in GSC

**"Failed to fetch rankings"**
- User must connect GSC account first
- Site must be verified in Google Search Console
- Check that OAuth token hasn't expired

---

## 10. Production Checklist

Before going live:

- [ ] Add `OPENROUTER_API_KEY` to Vercel Production
- [ ] Add `DATAFORSEO_API_KEY` to Vercel Production
- [ ] Set up Google OAuth credentials
- [ ] Add OAuth redirect URIs for production domain
- [ ] Test GSC connection with real user account
- [ ] Verify rankings sync works
- [ ] Test AI insights generation
- [ ] Check rate limits and quotas
- [ ] Set up billing alerts on OpenRouter ($10 threshold)

---

## 11. Monitoring Costs

**OpenRouter Dashboard:**
- View usage: https://openrouter.ai/activity
- Set spending limits
- Track per-model costs

**Google Cloud Console:**
- Monitor API quotas
- Set up quota alerts
- Review API usage graphs

**Set Budget Alerts:**
```bash
# OpenRouter: Set max $20/month
# Google Maps: Alert at 80% of free quota (22,400 requests)
```

---

**Questions?** Check the architecture docs:
- `FREE_GEO_SEO_ARCHITECTURE.md` - Full technical details
- `GEO_SEO_ENHANCEMENT_ARCHITECTURE.md` - Feature roadmap
