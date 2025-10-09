/**
 * Scrapingdog API Integration Test
 * Run: npx tsx scripts/test-scrapingdog.ts
 */

import {
  getGoogleSERP,
  getBaiduSERP,
  getKeywordIdeas,
  analyzeCompetitorRankings,
  isConfigured,
  estimateCost,
  getSupportedCountries,
  getSupportedSearchEngines
} from '../services/api/scrapingdog'

async function main() {
  console.log('🔍 Scrapingdog API Integration Test\n')
  console.log('=' .repeat(60))

  // Check configuration
  console.log('\n📋 Configuration Check')
  console.log('-'.repeat(60))
  const configured = isConfigured()
  console.log(`API Configured: ${configured ? '✅ Yes' : '❌ No (will use mock data)'}`)

  if (!configured) {
    console.log('\n⚠️  Note: SCRAPINGDOG_API_KEY not found in environment')
    console.log('   Using mock data for testing\n')
  }

  // Show supported options
  console.log('\n🌍 Supported Countries:', getSupportedCountries().join(', '))
  console.log('\n🔎 Supported Search Engines:')
  getSupportedSearchEngines().forEach(engine => {
    console.log(`   - ${engine.name} (${engine.id}): ${engine.countries.join(', ')}`)
  })

  // Test 1: Google SERP (Australian market)
  console.log('\n' + '='.repeat(60))
  console.log('Test 1: Google SERP - Australian Market')
  console.log('='.repeat(60))
  console.log('Query: "water damage restoration Brisbane"')
  console.log('Country: Australia (au)')
  console.log('Results: 10\n')

  const googleResults = await getGoogleSERP({
    query: 'water damage restoration Brisbane',
    country: 'au',
    results: 10,
    device: 'desktop'
  })

  if (googleResults) {
    console.log(`✅ Success! Retrieved ${googleResults.organicResults.length} organic results`)
    console.log(`   Total Results: ${googleResults.totalResults?.toLocaleString() || 'N/A'}`)
    console.log(`   Search Time: ${googleResults.searchTime || 'N/A'}s`)

    console.log('\n📊 Top 5 Results:')
    googleResults.organicResults.slice(0, 5).forEach(result => {
      console.log(`\n   ${result.position}. ${result.title}`)
      console.log(`      URL: ${result.link}`)
      console.log(`      Snippet: ${result.snippet.slice(0, 100)}...`)
      if (result.rating) {
        console.log(`      Rating: ${result.rating.score}⭐ (${result.rating.count} reviews)`)
      }
      if (result.sitelinks && result.sitelinks.length > 0) {
        console.log(`      Sitelinks: ${result.sitelinks.length} found`)
      }
    })

    if (googleResults.relatedSearches && googleResults.relatedSearches.length > 0) {
      console.log('\n🔗 Related Searches:')
      googleResults.relatedSearches.slice(0, 5).forEach(search => {
        console.log(`   - ${search.query}`)
      })
    }

    if (googleResults.peopleAlsoAsk && googleResults.peopleAlsoAsk.length > 0) {
      console.log('\n❓ People Also Ask:')
      googleResults.peopleAlsoAsk.slice(0, 3).forEach(paa => {
        console.log(`   Q: ${paa.question}`)
        console.log(`   A: ${paa.snippet.slice(0, 100)}...`)
      })
    }
  } else {
    console.log('❌ Failed to fetch Google SERP results')
  }

  // Test 2: Baidu SERP (Chinese market)
  console.log('\n' + '='.repeat(60))
  console.log('Test 2: Baidu SERP - Chinese Market')
  console.log('='.repeat(60))
  console.log('Query: "水损修复服务" (Water damage restoration)')
  console.log('Results: 10\n')

  const baiduResults = await getBaiduSERP({
    query: '水损修复服务',
    page: 1,
    results: 10
  })

  if (baiduResults) {
    console.log(`✅ Success! Retrieved ${baiduResults.organicResults.length} Baidu results`)

    console.log('\n📊 Top 5 Baidu Results:')
    baiduResults.organicResults.slice(0, 5).forEach(result => {
      console.log(`\n   ${result.position}. ${result.title}`)
      console.log(`      URL: ${result.link}`)
      console.log(`      Snippet: ${result.snippet.slice(0, 100)}...`)
      if (result.source) {
        console.log(`      Source: ${result.source}`)
      }
      if (result.date) {
        console.log(`      Date: ${result.date}`)
      }
    })
  } else {
    console.log('❌ Failed to fetch Baidu SERP results')
  }

  // Test 3: Keyword Research (Google AU)
  console.log('\n' + '='.repeat(60))
  console.log('Test 3: Keyword Research - Google Australia')
  console.log('='.repeat(60))
  console.log('Seed Keyword: "water damage"')
  console.log('Country: Australia (au)')
  console.log('Search Engine: Google\n')

  const keywords = await getKeywordIdeas('water damage', 'au', 'google')

  if (keywords.length > 0) {
    console.log(`✅ Success! Found ${keywords.length} keyword variations`)

    console.log('\n📈 Top 10 Keywords by Search Volume:')
    const sortedKeywords = [...keywords]
      .sort((a, b) => b.search_volume - a.search_volume)
      .slice(0, 10)

    sortedKeywords.forEach((kw, index) => {
      console.log(`\n   ${index + 1}. "${kw.keyword}"`)
      console.log(`      Search Volume: ${kw.search_volume.toLocaleString()}/month`)
      console.log(`      Difficulty: ${kw.keyword_difficulty.toFixed(0)}/100`)
      console.log(`      CPC: $${kw.cpc?.toFixed(2) || 'N/A'}`)
      console.log(`      Competition: ${(kw.competition || 0).toFixed(2)}`)
      console.log(`      SERP Features: ${kw.serp_features?.join(', ') || 'None'}`)
    })
  } else {
    console.log('❌ No keyword variations found')
  }

  // Test 4: Competitor Analysis
  console.log('\n' + '='.repeat(60))
  console.log('Test 4: Competitor Ranking Analysis')
  console.log('='.repeat(60))
  console.log('Keyword: "water damage restoration Brisbane"')
  console.log('Competitors: 3 domains\n')

  const competitorAnalysis = await analyzeCompetitorRankings(
    'water damage restoration Brisbane',
    [
      'waterdamagebrisbane.com.au',
      'floodresponse.com.au',
      'emergencyrestoration.com.au'
    ],
    'au',
    'google'
  )

  if (competitorAnalysis) {
    console.log('✅ Success! Competitor analysis complete\n')
    console.log('🏆 Competitor Rankings:')

    competitorAnalysis.competitors.forEach(comp => {
      console.log(`\n   ${comp.domain}`)
      if (comp.position) {
        console.log(`      Position: #${comp.position}`)
        console.log(`      Title: ${comp.title}`)
        console.log(`      Snippet: ${comp.snippet.slice(0, 100)}...`)
      } else {
        console.log(`      Position: Not in top 100`)
      }
    })
  } else {
    console.log('❌ Failed to analyze competitors')
  }

  // Test 5: Cost Estimation
  console.log('\n' + '='.repeat(60))
  console.log('Test 5: Cost Estimation')
  console.log('='.repeat(60))

  const scenarios = [
    { queries: 1000, label: '1,000 queries' },
    { queries: 10000, label: '10,000 queries' },
    { queries: 100000, label: '100,000 queries' },
    { queries: 1000000, label: '1,000,000 queries' }
  ]

  console.log('\n💰 Scrapingdog Pricing:')
  scenarios.forEach(scenario => {
    const cost = estimateCost(scenario.queries)
    console.log(`   ${scenario.label.padEnd(20)}: $${cost.toFixed(2)}`)
  })

  console.log('\n📊 Cost Comparison with DataForSEO:')
  console.log('\n   Scenario: 100,000 queries/month')
  console.log('   - Scrapingdog:           $29.00')
  console.log('   - DataForSEO (Standard): $60.00')
  console.log('   - DataForSEO (Priority): $120.00')
  console.log('   - DataForSEO (Live):     $200.00')
  console.log('\n   💡 Savings: $31 - $171/month (52% - 86%)')

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('✅ Test Suite Complete!')
  console.log('='.repeat(60))
  console.log('\n📋 Summary:')
  console.log(`   API Configured: ${configured ? '✅' : '❌'}`)
  console.log(`   Google SERP: ${googleResults ? '✅' : '❌'}`)
  console.log(`   Baidu SERP: ${baiduResults ? '✅' : '❌'}`)
  console.log(`   Keyword Research: ${keywords.length > 0 ? '✅' : '❌'}`)
  console.log(`   Competitor Analysis: ${competitorAnalysis ? '✅' : '❌'}`)

  console.log('\n📚 Next Steps:')
  console.log('   1. Add SCRAPINGDOG_API_KEY to .env if not configured')
  console.log('   2. Verify API key is set in Vercel environment variables')
  console.log('   3. Test with real queries in production')
  console.log('   4. Implement caching to reduce costs')
  console.log('   5. Set up monitoring for API usage\n')

  console.log('📖 Documentation: docs/SCRAPINGDOG_INTEGRATION.md')
  console.log('💵 Cost Analysis: .audit/CHINESE_DATAFORSEO_ALTERNATIVES.md\n')
}

// Run tests
main().catch(error => {
  console.error('\n❌ Test failed with error:', error)
  process.exit(1)
})
