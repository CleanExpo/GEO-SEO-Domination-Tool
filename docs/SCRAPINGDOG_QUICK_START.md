# Scrapingdog Quick Start Guide

**52% cheaper than DataForSEO** | **Full Baidu support** | **Australian market ready**

---

## 🚀 Quick Setup

### 1. Environment Variable (Already Configured in Vercel)
```bash
SCRAPINGDOG_API_KEY=your_api_key_here
```

### 2. Import & Use
```typescript
import { getGoogleSERP, getKeywordIdeas } from '@/services/api/scrapingdog'
```

---

## 📊 Common Use Cases

### Australian Market Keyword Research
```typescript
const keywords = await getKeywordIdeas('water damage', 'au', 'google')

// Returns: 20+ keyword variations with:
// - Search volume
// - Keyword difficulty
// - CPC
// - SERP features
```

### Get SERP Results
```typescript
const results = await getGoogleSERP({
  query: 'water damage restoration Brisbane',
  country: 'au',
  results: 20
})

// Returns:
// - Organic results (position, title, URL, snippet)
// - People Also Ask questions
// - Related Searches
// - Sitelinks, ratings, prices
```

### Chinese Market (Baidu)
```typescript
const baiduResults = await getBaiduSERP({
  query: '水损修复服务',
  results: 20
})
```

### Competitor Tracking
```typescript
const rankings = await analyzeCompetitorRankings(
  'water damage restoration',
  ['competitor1.com.au', 'competitor2.com.au'],
  'au',
  'google'
)
```

---

## 💰 Pricing

| Queries | Scrapingdog | DataForSEO | Savings |
|---------|------------|------------|---------|
| 1,000   | $0.29      | $0.60+     | 52%     |
| 10,000  | $2.90      | $6.00+     | 52%     |
| 100,000 | $29.00     | $60.00+    | 52%     |

---

## 🌍 Supported Markets

**Countries**: AU, US, UK, CA, NZ, IN, SG, CN, JP, KR

**Search Engines**:
- Google (all except CN)
- Baidu (CN only)

---

## 📝 Key Functions

| Function | Purpose |
|----------|---------|
| `getGoogleSERP(params)` | Get Google SERP results |
| `getBaiduSERP(params)` | Get Baidu SERP results |
| `getKeywordIdeas(seed, country, engine)` | Get keyword variations |
| `getKeywordMetrics(keyword, country, engine)` | Get single keyword data |
| `getBatchKeywordMetrics(keywords, country, engine)` | Batch keyword lookup |
| `analyzeCompetitorRankings(keyword, competitors, country, engine)` | Track competitor positions |
| `estimateCost(queryCount)` | Calculate API cost |
| `isConfigured()` | Check if API key is set |

---

## ⚡ Pro Tips

### 1. Batch Requests for Cost Savings
```typescript
// ❌ Expensive (5 API calls)
for (const kw of keywords) {
  await getKeywordMetrics(kw, 'au', 'google')
}

// ✅ Cheaper (1 API call)
await getBatchKeywordMetrics(keywords, 'au', 'google')
```

### 2. Cache Results
```typescript
// Save 24 hours to reduce duplicate queries
const cacheKey = `serp:${country}:${query}`
const cached = await cache.get(cacheKey)
if (cached) return cached

const fresh = await getGoogleSERP({ query, country })
await cache.set(cacheKey, fresh, 86400) // 24h
```

### 3. Check Configuration
```typescript
import { isConfigured } from '@/services/api/scrapingdog'

if (!isConfigured()) {
  console.warn('API key not set - using mock data')
}
```

---

## 🧪 Testing

### Run Test Script
```bash
npx tsx scripts/test-scrapingdog.ts
```

### Expected Output
- Configuration check
- Google SERP test (AU market)
- Baidu SERP test (CN market)
- Keyword research test
- Competitor analysis test
- Cost estimation

---

## 📚 Documentation

- **Full Guide**: [docs/SCRAPINGDOG_INTEGRATION.md](SCRAPINGDOG_INTEGRATION.md)
- **API Client**: [services/api/scrapingdog.ts](../services/api/scrapingdog.ts)
- **Cost Analysis**: [.audit/CHINESE_DATAFORSEO_ALTERNATIVES.md](../.audit/CHINESE_DATAFORSEO_ALTERNATIVES.md)
- **Summary**: [.audit/SCRAPINGDOG_INTEGRATION_SUMMARY.md](../.audit/SCRAPINGDOG_INTEGRATION_SUMMARY.md)

---

## ❓ Troubleshooting

### API returns null
✅ Check Vercel environment variables are set

### Baidu results empty
✅ Use Chinese characters in query for best results

### High costs
✅ Implement caching and batch requests

---

**Status**: ✅ Production Ready | **Vercel**: Configured | **Savings**: 52-86%
