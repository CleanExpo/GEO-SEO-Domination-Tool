# QUICK START - Get Running in 5 Minutes

## ✅ What's Already Working

Your GEO-SEO Domination Tool already has:
- ✅ Supabase database with authentication
- ✅ SEO audit system (Lighthouse + Firecrawl)
- ✅ Keywords tracking with DataForSEO
- ✅ Beautiful UI with Next.js 15
- ✅ Deployed on Vercel

**Vercel Environment Variables Already Set:**
- GOOGLE_API_KEY ✅
- FIRECRAWL_API_KEY ✅
- PERPLEXITY_API_KEY ✅
- SEMRUSH_API_KEY ✅
- OPENAI_API_KEY ✅
- SUPABASE credentials ✅

---

## 🆕 New Features Just Added (Need Setup)

### 1. Real Google Rankings (FREE!)

**What it does:**
- Fetch 100% accurate ranking data from Google Search Console
- Show exact positions, clicks, impressions, CTR
- Track ranking changes over time
- Device breakdown (mobile/desktop/tablet)

**Setup:**
1. Go to https://console.cloud.google.com
2. Enable "Google Search Console API"
3. Create OAuth credentials
4. Add redirect URI: `https://your-domain.vercel.app/api/auth/google/callback`
5. Add to Vercel:
   ```bash
   cd web-app
   vercel env add GOOGLE_CLIENT_ID
   vercel env add GOOGLE_CLIENT_SECRET
   ```

**Use it:**
- Visit: `/companies/[id]/real-rankings`
- Click "Connect Site" in settings
- Click "Sync Now" to fetch rankings

---

### 2. DeepSeek V3 AI Insights ($5/month)

**What it does:**
- Analyze ranking data with AI
- Generate SEO recommendations
- Create GBP posts automatically
- Write review responses
- Find citations
- Competitor analysis

**Setup (via OpenRouter):**
1. Go to https://openrouter.ai
2. Sign up + add payment method
3. Create API key (Keys tab)
4. Add to Vercel:
   ```bash
   vercel env add OPENROUTER_API_KEY
   # Paste your sk-or-v1-... key
   ```
5. Add to local `.env.local`:
   ```
   OPENROUTER_API_KEY="sk-or-v1-..."
   ```

**Use it:**
- Rankings page → Click "AI Insights"
- Automatically analyzes your data
- Provides strategic recommendations

---

## 🚀 Deploy With New Features

```bash
cd geo-seo-domination-tool/web-app

# Pull latest code
git pull

# Deploy to Vercel
vercel --prod
```

**After deployment:**
1. Check Vercel dashboard for any errors
2. Test rankings page: `/companies/[your-company-id]/real-rankings`
3. Test AI insights button
4. Connect Google Search Console

---

## 📊 What You Get vs Paid Tools

| Feature | Paid Tools | GEO-SEO Tool | Savings |
|---------|-----------|--------------|---------|
| **Ranking Data** | SEMrush $230/mo | Google Search Console FREE | $230/mo |
| **Keyword Research** | DataForSEO $150/mo | DataForSEO pay-as-you-go | $100/mo |
| **AI Analysis** | OpenAI $50/mo | DeepSeek $5-10/mo | $40/mo |
| **Local Search** | Gridmybusiness $890/yr | Google Maps FREE | $74/mo |
| **TOTAL** | **$494/month** | **$10/month** | **$484/mo saved!** |

**Annual Savings: $5,808** 🎉

---

## 🔧 Optional: DataForSEO on Vercel

You have DataForSEO configured locally. Add to Vercel for production:

```bash
vercel env add DATAFORSEO_API_KEY
# Value: phill@disasterrecovery.com.au:f1f7eebc972699a7
# Select: Production, Preview, Development
```

---

## ✅ Verification Checklist

**Test each feature:**

- [ ] SEO Audits work (go to `/audits`, click "New Audit")
- [ ] Keywords work (go to `/keywords`, add a keyword)
- [ ] Real Rankings page loads (`/companies/[id]/real-rankings`)
- [ ] AI Insights button appears (may error if no API key yet)
- [ ] Google integrations page loads (`/settings/integrations/google`)

**If anything doesn't work:**
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify environment variables are set
4. Redeploy: `vercel --prod`

---

## 📚 Documentation

- `SETUP_FREE_APIs.md` - Detailed API setup guide
- `FREE_GEO_SEO_ARCHITECTURE.md` - Technical architecture
- `GEO_SEO_ENHANCEMENT_ARCHITECTURE.md` - Feature roadmap
- `SYSTEM_INTEGRATION_AUDIT.md` - Integration health status

---

## 🎯 Next Steps

**Now (5 min):**
1. Get OpenRouter API key
2. Add to Vercel
3. Redeploy
4. Test AI insights

**Soon (30 min):**
1. Set up Google OAuth for Search Console
2. Connect your first site
3. Sync rankings
4. Review AI recommendations

**Later (as needed):**
1. Connect more Google Search Console sites
2. Set up automated daily ranking checks
3. Build custom reports
4. Add more AI features (review responses, GBP posts)

---

## 🆘 Need Help?

**Common Issues:**

**"API key not configured"**
- Run: `vercel env pull` to sync environment variables
- Check `.env.local` has `OPENROUTER_API_KEY`
- Redeploy: `vercel --prod`

**"Unauthorized" errors**
- Make sure you're logged in to the app
- Check Supabase auth is working
- Verify RLS policies are correct

**"Failed to fetch rankings"**
- User must connect Google Search Console first
- Visit `/settings/integrations/google`
- Follow OAuth flow to connect

**Still stuck?**
- Check Vercel deployment logs
- Check browser console (F12)
- Review API endpoint responses in Network tab

---

**You're all set!** 🚀

Your GEO-SEO Domination Tool now has:
- Real Google ranking data (FREE)
- AI-powered insights ($5/mo)
- Professional UI
- Zero-cost alternative to $500/month tools

**Total cost: ~$10/month vs $500/month** = 98% savings!
