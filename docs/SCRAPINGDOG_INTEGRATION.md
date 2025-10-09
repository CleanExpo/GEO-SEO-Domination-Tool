# Scrapingdog API Integration

## Overview

Scrapingdog is a cost-effective SERP API alternative to DataForSEO, offering **52% cost savings** ($0.29 per 1,000 queries vs $0.60-$2.00 for DataForSEO).

### Key Features:
- ✅ **Multi-engine support**: Google, Baidu, Bing, Yahoo
- ✅ **Baidu support**: Critical for Chinese market SEO
- ✅ **Australian market**: Full support for AU-targeted queries
- ✅ **Cost-effective**: $0.29 per 1,000 queries
- ✅ **SERP features**: Organic results, People Also Ask, Related Searches, Sitelinks
- ✅ **Fast performance**: 1-2 second response times

---

## Setup

### 1. Environment Configuration

The API key is stored in Vercel environment variables:

```bash
# Already configured in Vercel:
SCRAPINGDOG_API_KEY=your_api_key_here
```

For local development, add to your `.env` file:

```bash
SCRAPINGDOG_API_KEY=your_api_key_here
```

### 2. Verify Configuration

Check if the API is configured:

```typescript
import { isConfigured } from '@/services/api/scrapingdog'

if (isConfigured()) {
  console.log('Scrapingdog API is ready')
}
```

---

## Usage Examples

### Basic Google SERP Query (Australian Market)

```typescript
import { getGoogleSERP } from '@/services/api/scrapingdog'

const results = await getGoogleSERP({
  query: 'water damage restoration Brisbane',
  country: 'au',
  results: 20,
  device: 'desktop'
})

if (results) {
  console.log('Total results:', results.totalResults)
  console.log('Top 10 results:', results.organicResults.slice(0, 10))
  console.log('Related searches:', results.relatedSearches)
  console.log('People Also Ask:', results.peopleAlsoAsk)
}
```

### Baidu Search (Chinese Market)

```typescript
import { getBaiduSERP } from '@/services/api/scrapingdog'

const results = await getBaiduSERP({
  query: '水损修复服务', // Water damage restoration in Chinese
  page: 1,
  results: 20
})

if (results) {
  results.organicResults.forEach(result => {
    console.log(`${result.position}. ${result.title}`)
    console.log(`   ${result.link}`)
    console.log(`   ${result.snippet}`)
  })
}
```

### Keyword Research

```typescript
import { getKeywordIdeas } from '@/services/api/scrapingdog'

// Google keyword research (Australian market)
const keywords = await getKeywordIdeas(
  'water damage restoration',
  'au',
  'google'
)

keywords.forEach(kw => {
  console.log(`${kw.keyword}:`)
  console.log(`  Search Volume: ${kw.search_volume}`)
  console.log(`  Difficulty: ${kw.keyword_difficulty}`)
  console.log(`  CPC: $${kw.cpc?.toFixed(2)}`)
  console.log(`  SERP Features: ${kw.serp_features?.join(', ')}`)
})

// Baidu keyword research (Chinese market)
const baiduKeywords = await getKeywordIdeas(
  '水损修复',
  'cn',
  'baidu'
)
```

### Batch Keyword Metrics

```typescript
import { getBatchKeywordMetrics } from '@/services/api/scrapingdog'

const keywords = [
  'water damage restoration',
  'emergency water removal',
  'flood damage repair',
  'water damage cleanup'
]

const metrics = await getBatchKeywordMetrics(keywords, 'au', 'google')

metrics.forEach(metric => {
  console.log(`${metric.keyword}: ${metric.search_volume} searches/month`)
})
```

### Competitor Analysis

```typescript
import { analyzeCompetitorRankings } from '@/services/api/scrapingdog'

const analysis = await analyzeCompetitorRankings(
  'water damage restoration Brisbane',
  [
    'waterdamagebrisbane.com.au',
    'floodresponse.com.au',
    'emergencyrepairs.com.au'
  ],
  'au',
  'google'
)

if (analysis) {
  analysis.competitors.forEach(comp => {
    if (comp.position) {
      console.log(`${comp.domain}: Position ${comp.position}`)
      console.log(`  Title: ${comp.title}`)
    } else {
      console.log(`${comp.domain}: Not ranking in top 100`)
    }
  })
}
```

---

## API Reference

### `getGoogleSERP(params: ScrapingdogSERPParams)`

Get Google SERP results.

**Parameters:**
- `query` (string, required): Search query
- `country` (string, optional): Country code ('au', 'us', 'uk', etc.) - default: 'au'
- `domain` (string, optional): Google domain ('google.com', 'google.com.au')
- `page` (number, optional): Page number for pagination - default: 1
- `results` (number, optional): Number of results (10-100) - default: 10
- `device` ('desktop' | 'mobile', optional): Device type - default: 'desktop'
- `language` (string, optional): Language code ('en', 'zh-CN', etc.)

**Returns:** `ScrapingdogSERPResponse | null`

```typescript
{
  searchParameters: {
    query: string
    domain: string
    device: string
    page: number
  }
  organicResults: Array<{
    position: number
    title: string
    link: string
    snippet: string
    displayedLink?: string
    sitelinks?: Array<{ title: string; link: string }>
    rating?: { score: number; count: number }
    price?: string
    isAd?: boolean
  }>
  relatedSearches?: Array<{ query: string }>
  peopleAlsoAsk?: Array<{
    question: string
    snippet: string
    link: string
  }>
  totalResults?: number
  searchTime?: number
}
```

### `getBaiduSERP(params: BaiduSERPParams)`

Get Baidu SERP results (Chinese market).

**Parameters:**
- `query` (string, required): Search query (supports Chinese)
- `page` (number, optional): Page number - default: 1
- `results` (number, optional): Number of results - default: 10

**Returns:** `{ organicResults: BaiduSERPResult[] } | null`

```typescript
{
  organicResults: Array<{
    position: number
    title: string
    link: string
    snippet: string
    source?: string
    date?: string
  }>
}
```

### `getKeywordIdeas(seedKeyword, country, searchEngine)`

Get keyword ideas and SERP data.

**Parameters:**
- `seedKeyword` (string): Seed keyword to expand
- `country` (string, optional): Country code - default: 'au'
- `searchEngine` ('google' | 'baidu', optional): Search engine - default: 'google'

**Returns:** `KeywordData[]`

### `getKeywordMetrics(keyword, country, searchEngine)`

Get metrics for a specific keyword.

**Returns:** `KeywordData | null`

### `getBatchKeywordMetrics(keywords, country, searchEngine)`

Get metrics for multiple keywords (more cost-effective).

**Returns:** `KeywordData[]`

### `analyzeCompetitorRankings(keyword, competitors, country, searchEngine)`

Analyze competitor rankings for a keyword.

**Parameters:**
- `keyword` (string): Keyword to analyze
- `competitors` (string[]): Array of competitor domains
- `country` (string, optional): Country code - default: 'au'
- `searchEngine` ('google' | 'baidu', optional): Search engine - default: 'google'

**Returns:** Competitor ranking data or null

---

## Cost Management

### Pricing Comparison

| Provider | Cost per 1K Queries | Annual Cost (1M queries) |
|----------|-------------------|-------------------------|
| Scrapingdog | $0.29 | $290 |
| DataForSEO (Standard) | $0.60 | $600 |
| DataForSEO (Priority) | $1.20 | $1,200 |
| DataForSEO (Live) | $2.00 | $2,000 |

**Savings with Scrapingdog**: 52-86% depending on DataForSEO tier

### Cost Estimation

```typescript
import { estimateCost } from '@/services/api/scrapingdog'

const monthlyCost = estimateCost(100000) // 100K queries
console.log(`Estimated monthly cost: $${monthlyCost.toFixed(2)}`)
// Output: Estimated monthly cost: $29.00
```

### Query Optimization Tips

1. **Batch requests**: Use `getBatchKeywordMetrics()` instead of individual queries
2. **Cache results**: Store SERP data locally to avoid duplicate queries
3. **Pagination strategy**: Only fetch additional pages when needed
4. **Fallback to mock data**: Development/testing uses mock data when API key is missing

---

## Supported Countries

```typescript
import { getSupportedCountries } from '@/services/api/scrapingdog'

const countries = getSupportedCountries()
// ['au', 'us', 'uk', 'ca', 'nz', 'in', 'sg', 'cn', 'jp', 'kr']
```

## Supported Search Engines

```typescript
import { getSupportedSearchEngines } from '@/services/api/scrapingdog'

const engines = getSupportedSearchEngines()
/*
[
  { id: 'google', name: 'Google', countries: ['au', 'us', 'uk', 'ca', 'nz', 'in', 'sg'] },
  { id: 'baidu', name: 'Baidu', countries: ['cn'] }
]
*/
```

---

## Error Handling

All functions include comprehensive error handling with Sentry integration:

```typescript
import { getGoogleSERP } from '@/services/api/scrapingdog'

const results = await getGoogleSERP({ query: 'test query' })

if (!results) {
  console.error('Failed to fetch SERP results')
  // Error is automatically logged to Sentry
  // Falls back to mock data if appropriate
}
```

### Error Scenarios:
- **Missing API key**: Returns `null`, logs warning to Sentry
- **API error (4xx/5xx)**: Returns `null`, logs exception to Sentry
- **Network timeout**: Returns `null`, logs exception to Sentry
- **Invalid response**: Returns `null`, logs exception to Sentry

---

## Migration from DataForSEO

### Step 1: Update Imports

```typescript
// Old (DataForSEO)
import { getKeywordIdeas } from '@/services/api/dataforseo'

// New (Scrapingdog)
import { getKeywordIdeas } from '@/services/api/scrapingdog'
```

### Step 2: Update Function Calls

```typescript
// Old (DataForSEO)
const keywords = await getKeywordIdeas('water damage', 'au')

// New (Scrapingdog) - Same interface!
const keywords = await getKeywordIdeas('water damage', 'au', 'google')
```

### Step 3: Add Baidu Support (New Feature)

```typescript
// Baidu support (not available in DataForSEO)
const baiduResults = await getBaiduSERP({
  query: '水损修复',
  page: 1,
  results: 20
})
```

---

## Use Cases

### 1. Local SEO Ranking Tracker

```typescript
import { getGoogleSERP } from '@/services/api/scrapingdog'

async function trackLocalRankings(business: string, keywords: string[]) {
  const rankings = []

  for (const keyword of keywords) {
    const results = await getGoogleSERP({
      query: keyword,
      country: 'au',
      results: 50 // Check top 50
    })

    if (results) {
      const position = results.organicResults.findIndex(r =>
        r.link.includes(business)
      )

      rankings.push({
        keyword,
        position: position >= 0 ? position + 1 : null,
        date: new Date().toISOString()
      })
    }
  }

  return rankings
}
```

### 2. SERP Feature Analysis

```typescript
import { getGoogleSERP } from '@/services/api/scrapingdog'

async function analyzeSERPFeatures(keyword: string) {
  const results = await getGoogleSERP({
    query: keyword,
    country: 'au',
    results: 20
  })

  if (!results) return null

  return {
    hasPeopleAlsoAsk: (results.peopleAlsoAsk?.length || 0) > 0,
    hasRelatedSearches: (results.relatedSearches?.length || 0) > 0,
    hasSitelinks: results.organicResults.some(r => r.sitelinks && r.sitelinks.length > 0),
    hasReviews: results.organicResults.some(r => r.rating),
    totalResults: results.totalResults
  }
}
```

### 3. Content Gap Analysis

```typescript
import { getGoogleSERP } from '@/services/api/scrapingdog'

async function findContentGaps(yourDomain: string, keyword: string) {
  const results = await getGoogleSERP({
    query: keyword,
    country: 'au',
    results: 100
  })

  if (!results) return null

  const yourRanking = results.organicResults.find(r => r.link.includes(yourDomain))
  const topCompetitors = results.organicResults.slice(0, 10)

  return {
    yourPosition: yourRanking?.position || null,
    missingTopics: results.relatedSearches?.map(rs => rs.query) || [],
    competitorTitles: topCompetitors.map(c => c.title),
    featuredSnippets: results.organicResults.filter(r => r.position === 0)
  }
}
```

---

## Testing

### Unit Tests

```typescript
import { getKeywordIdeas, isConfigured } from '@/services/api/scrapingdog'

describe('Scrapingdog API', () => {
  it('should check if API is configured', () => {
    const configured = isConfigured()
    expect(typeof configured).toBe('boolean')
  })

  it('should return keyword ideas', async () => {
    const keywords = await getKeywordIdeas('test keyword', 'au', 'google')
    expect(Array.isArray(keywords)).toBe(true)
    expect(keywords.length).toBeGreaterThan(0)
  })

  it('should handle missing API key gracefully', async () => {
    // Temporarily unset API key
    const originalKey = process.env.SCRAPINGDOG_API_KEY
    delete process.env.SCRAPINGDOG_API_KEY

    const result = await getGoogleSERP({ query: 'test' })
    expect(result).toBeNull()

    // Restore API key
    process.env.SCRAPINGDOG_API_KEY = originalKey
  })
})
```

### Integration Test Script

```bash
# Create test script
npx tsx scripts/test-scrapingdog.ts
```

```typescript
// scripts/test-scrapingdog.ts
import { getGoogleSERP, getBaiduSERP, getKeywordIdeas } from '@/services/api/scrapingdog'

async function testScrapingdog() {
  console.log('Testing Scrapingdog API...\n')

  // Test 1: Google SERP (Australian market)
  console.log('Test 1: Google SERP (Australia)')
  const googleResults = await getGoogleSERP({
    query: 'water damage restoration Brisbane',
    country: 'au',
    results: 10
  })
  console.log(`✓ Retrieved ${googleResults?.organicResults.length || 0} results\n`)

  // Test 2: Baidu SERP (Chinese market)
  console.log('Test 2: Baidu SERP (China)')
  const baiduResults = await getBaiduSERP({
    query: '水损修复',
    results: 10
  })
  console.log(`✓ Retrieved ${baiduResults?.organicResults.length || 0} results\n`)

  // Test 3: Keyword research
  console.log('Test 3: Keyword Ideas (Google AU)')
  const keywords = await getKeywordIdeas('water damage', 'au', 'google')
  console.log(`✓ Retrieved ${keywords.length} keyword variations\n`)

  console.log('All tests completed!')
}

testScrapingdog()
```

---

## Best Practices

### 1. Always Check Configuration
```typescript
import { isConfigured } from '@/services/api/scrapingdog'

if (!isConfigured()) {
  console.warn('Scrapingdog API not configured - using mock data')
}
```

### 2. Handle Null Responses
```typescript
const results = await getGoogleSERP({ query: 'test' })

if (!results) {
  // Log error, use fallback, or notify user
  return { error: 'Failed to fetch SERP data' }
}
```

### 3. Cache Results
```typescript
// Store in database to avoid duplicate queries
const cacheKey = `serp:${country}:${query}:${page}`
const cached = await getCachedSERP(cacheKey)

if (cached && !isExpired(cached.timestamp)) {
  return cached.data
}

const fresh = await getGoogleSERP({ query, country, page })
await cacheSERP(cacheKey, fresh)
return fresh
```

### 4. Rate Limiting
```typescript
// Implement rate limiting for high-volume usage
import pLimit from 'p-limit'

const limit = pLimit(5) // Max 5 concurrent requests

const results = await Promise.all(
  keywords.map(keyword =>
    limit(() => getKeywordMetrics(keyword, 'au', 'google'))
  )
)
```

---

## Troubleshooting

### Issue: API returns null
**Solution**: Check Vercel environment variables are set correctly

### Issue: Baidu results empty
**Solution**: Ensure query is in Chinese characters for best results

### Issue: High costs
**Solution**: Implement caching and batch requests

### Issue: Rate limit errors
**Solution**: Add rate limiting with `p-limit` or similar

---

## Additional Resources

- [Scrapingdog Documentation](https://www.scrapingdog.com/documentation)
- [Cost Comparison Report](.audit/CHINESE_DATAFORSEO_ALTERNATIVES.md)
- [API Service Pattern](services/api/README.md)
- [Sentry Error Tracking](.audit/SENTRY_DSN_INSTRUCTIONS.md)

---

**Status**: ✅ Integrated and deployed to Vercel
**Cost Savings**: 52% vs DataForSEO
**Baidu Support**: ✅ Full support for Chinese market
