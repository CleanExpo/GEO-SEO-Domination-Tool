# DeepSeek V3 API Routes Implementation Guide

This guide shows you how to implement the remaining 23 API routes to complete the MCP server integration.

## ✅ Already Created (4 routes)

1. `/api/deepseek/route.ts` - Root endpoint (health check & docs)
2. `/api/deepseek/keywords/research/route.ts` - Keyword research
3. `/api/deepseek/competitors/analyze/route.ts` - Competitor analysis
4. `/api/deepseek/competitors/find/route.ts` - Find competitors

## 🔄 Remaining Routes (23 routes)

### Backlink Analysis (2 routes)

#### `/app/api/deepseek/backlinks/discover/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekBacklinks } from '@/services/api/deepseek-backlinks';

export async function POST(request: NextRequest) {
  try {
    const { domain, maxBacklinks = 100, minQualityScore = 30 } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: 'domain is required' }, { status: 400 });
    }

    const backlinks = await deepseekBacklinks.discoverBacklinks(domain, {
      maxBacklinks,
      minQualityScore
    });

    return NextResponse.json({
      success: true,
      domain,
      totalBacklinks: backlinks.length,
      backlinks
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to discover backlinks', details: error.message },
      { status: 500 }
    );
  }
}
```

#### `/app/api/deepseek/backlinks/opportunities/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekBacklinks } from '@/services/api/deepseek-backlinks';

export async function POST(request: NextRequest) {
  try {
    const { domain, niche, maxOpportunities = 50 } = await request.json();

    if (!domain || !niche) {
      return NextResponse.json(
        { error: 'domain and niche are required' },
        { status: 400 }
      );
    }

    const opportunities = await deepseekBacklinks.findBacklinkOpportunities(
      domain,
      niche,
      maxOpportunities
    );

    return NextResponse.json({
      success: true,
      domain,
      niche,
      totalOpportunities: opportunities.length,
      opportunities
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to find backlink opportunities', details: error.message },
      { status: 500 }
    );
  }
}
```

### Content Gap Analysis (1 route)

#### `/app/api/deepseek/content-gaps/analyze/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekContentGaps } from '@/services/api/deepseek-content-gaps';

export async function POST(request: NextRequest) {
  try {
    const {
      yourDomain,
      competitorDomains,
      minOpportunity = 50,
      maxGaps = 50
    } = await request.json();

    if (!yourDomain || !competitorDomains || competitorDomains.length === 0) {
      return NextResponse.json(
        { error: 'yourDomain and competitorDomains are required' },
        { status: 400 }
      );
    }

    const gaps = await deepseekContentGaps.findContentGaps(
      yourDomain,
      competitorDomains,
      { minOpportunity, maxGaps }
    );

    return NextResponse.json({
      success: true,
      yourDomain,
      competitorDomains,
      totalGaps: gaps.length,
      gaps
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to analyze content gaps', details: error.message },
      { status: 500 }
    );
  }
}
```

### Local/GEO SEO (3 routes)

#### `/app/api/deepseek/local-seo/gbp-analysis/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekLocalSEO } from '@/services/api/deepseek-local-seo';

export async function POST(request: NextRequest) {
  try {
    const {
      businessName,
      address,
      city,
      state,
      zipCode,
      phone,
      website,
      categories,
      serviceAreas = []
    } = await request.json();

    if (!businessName || !address || !city || !state || !zipCode) {
      return NextResponse.json(
        { error: 'Business profile information is incomplete' },
        { status: 400 }
      );
    }

    const analysis = await deepseekLocalSEO.analyzeGBP({
      businessName,
      address,
      city,
      state,
      zipCode,
      phone,
      website,
      categories,
      serviceAreas
    });

    return NextResponse.json({
      success: true,
      businessName,
      analysis
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to analyze GBP', details: error.message },
      { status: 500 }
    );
  }
}
```

#### `/app/api/deepseek/local-seo/solv/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekLocalSEO } from '@/services/api/deepseek-local-seo';

export async function POST(request: NextRequest) {
  try {
    const {
      yourBusiness,
      competitors,
      keywords,
      location
    } = await request.json();

    if (!yourBusiness || !competitors || !keywords || !location) {
      return NextResponse.json(
        { error: 'All parameters are required' },
        { status: 400 }
      );
    }

    const solv = await deepseekLocalSEO.calculateShareOfLocalVoice(
      yourBusiness,
      competitors,
      keywords,
      location
    );

    return NextResponse.json({
      success: true,
      yourBusiness,
      location,
      solv
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to calculate SoLV', details: error.message },
      { status: 500 }
    );
  }
}
```

#### `/app/api/deepseek/local-seo/local-pack/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekLocalSEO } from '@/services/api/deepseek-local-seo';

export async function POST(request: NextRequest) {
  try {
    const {
      businessName,
      keywords,
      location
    } = await request.json();

    if (!businessName || !keywords || !location) {
      return NextResponse.json(
        { error: 'businessName, keywords, and location are required' },
        { status: 400 }
      );
    }

    const rankings = await deepseekLocalSEO.trackLocalPackRankings(
      businessName,
      keywords,
      location
    );

    return NextResponse.json({
      success: true,
      businessName,
      location,
      rankings
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to track local pack rankings', details: error.message },
      { status: 500 }
    );
  }
}
```

### Data Aggregation (1 route)

#### `/app/api/deepseek/aggregator/domain-overview/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekDataAggregator } from '@/services/api/deepseek-data-aggregator';

export async function POST(request: NextRequest) {
  try {
    const {
      domain,
      includeSocial = true,
      includeTech = true
    } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: 'domain is required' }, { status: 400 });
    }

    const overview = await deepseekDataAggregator.getDomainOverview(domain, {
      includeSocial,
      includeTech
    });

    return NextResponse.json({
      success: true,
      domain,
      dataPoints: 117,
      overview
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get domain overview', details: error.message },
      { status: 500 }
    );
  }
}
```

### Social Media Intelligence (7 routes)

#### `/app/api/deepseek/social-media/profile-analysis/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekSocialMedia } from '@/services/api/deepseek-social-media';

export async function POST(request: NextRequest) {
  try {
    const { platform, username, periodDays = 30 } = await request.json();

    if (!platform || !username) {
      return NextResponse.json(
        { error: 'platform and username are required' },
        { status: 400 }
      );
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const analysis = await deepseekSocialMedia.analyzeProfile(
      platform,
      username,
      { start: startDate, end: endDate }
    );

    return NextResponse.json({
      success: true,
      platform,
      username,
      periodDays,
      analysis
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to analyze profile', details: error.message },
      { status: 500 }
    );
  }
}
```

#### `/app/api/deepseek/social-media/influencer-discovery/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekSocialMedia } from '@/services/api/deepseek-social-media';

export async function POST(request: NextRequest) {
  try {
    const {
      niche,
      platform,
      minFollowers = 10000,
      maxFollowers = 1000000,
      minEngagementRate = 2.0,
      maxResults = 50
    } = await request.json();

    if (!niche || !platform) {
      return NextResponse.json(
        { error: 'niche and platform are required' },
        { status: 400 }
      );
    }

    const influencers = await deepseekSocialMedia.discoverInfluencers(
      niche,
      platform,
      { minFollowers, maxFollowers, minEngagementRate, maxResults }
    );

    return NextResponse.json({
      success: true,
      niche,
      platform,
      totalInfluencers: influencers.length,
      influencers
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to discover influencers', details: error.message },
      { status: 500 }
    );
  }
}
```

#### `/app/api/deepseek/social-media/hashtag-research/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekSocialMedia } from '@/services/api/deepseek-social-media';

export async function POST(request: NextRequest) {
  try {
    const { keyword, platform, maxHashtags = 30 } = await request.json();

    if (!keyword || !platform) {
      return NextResponse.json(
        { error: 'keyword and platform are required' },
        { status: 400 }
      );
    }

    const hashtags = await deepseekSocialMedia.researchHashtags(
      keyword,
      platform,
      maxHashtags
    );

    return NextResponse.json({
      success: true,
      keyword,
      platform,
      totalHashtags: hashtags.length,
      hashtags
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to research hashtags', details: error.message },
      { status: 500 }
    );
  }
}
```

#### `/app/api/deepseek/social-media/viral-content/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekSocialMedia } from '@/services/api/deepseek-social-media';

export async function POST(request: NextRequest) {
  try {
    const {
      topic,
      platforms,
      periodDays = 30,
      minEngagement = 10000,
      maxResults = 50
    } = await request.json();

    if (!topic || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'topic and platforms are required' },
        { status: 400 }
      );
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const viralContent = await deepseekSocialMedia.discoverViralContent(
      topic,
      platforms,
      { start: startDate, end: endDate, minEngagement, maxResults }
    );

    return NextResponse.json({
      success: true,
      topic,
      platforms,
      totalPosts: viralContent.length,
      viralContent
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to discover viral content', details: error.message },
      { status: 500 }
    );
  }
}
```

#### `/app/api/deepseek/social-media/posting-schedule/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekSocialMedia } from '@/services/api/deepseek-social-media';

export async function POST(request: NextRequest) {
  try {
    const {
      platform,
      timezone,
      audienceDemographics = {}
    } = await request.json();

    if (!platform || !timezone) {
      return NextResponse.json(
        { error: 'platform and timezone are required' },
        { status: 400 }
      );
    }

    const schedule = await deepseekSocialMedia.getOptimalPostingSchedule(
      platform,
      timezone,
      audienceDemographics
    );

    return NextResponse.json({
      success: true,
      platform,
      timezone,
      schedule
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get posting schedule', details: error.message },
      { status: 500 }
    );
  }
}
```

#### `/app/api/deepseek/social-media/social-listening/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekSocialMedia } from '@/services/api/deepseek-social-media';

export async function POST(request: NextRequest) {
  try {
    const {
      keywords,
      platforms,
      periodDays = 7,
      includeSentiment = true
    } = await request.json();

    if (!keywords || !platforms || keywords.length === 0 || platforms.length === 0) {
      return NextResponse.json(
        { error: 'keywords and platforms are required' },
        { status: 400 }
      );
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const mentions = await deepseekSocialMedia.socialListening(
      keywords,
      platforms,
      { start: startDate, end: endDate, includeSentiment }
    );

    return NextResponse.json({
      success: true,
      keywords,
      platforms,
      periodDays,
      totalMentions: mentions.length,
      mentions
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to perform social listening', details: error.message },
      { status: 500 }
    );
  }
}
```

#### `/app/api/deepseek/social-media/competitor-analysis/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekSocialMedia } from '@/services/api/deepseek-social-media';

export async function POST(request: NextRequest) {
  try {
    const { platform, competitorUsername, periodDays = 30 } = await request.json();

    if (!platform || !competitorUsername) {
      return NextResponse.json(
        { error: 'platform and competitorUsername are required' },
        { status: 400 }
      );
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const analysis = await deepseekSocialMedia.analyzeCompetitorSocial(
      platform,
      competitorUsername,
      { start: startDate, end: endDate }
    );

    return NextResponse.json({
      success: true,
      platform,
      competitorUsername,
      analysis
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to analyze competitor', details: error.message },
      { status: 500 }
    );
  }
}
```

### Content Writing Engine (7 routes)

#### `/app/api/deepseek/content-writer/blog-article/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekContentWriter } from '@/services/api/deepseek-content-writer';

export async function POST(request: NextRequest) {
  try {
    const {
      topic,
      keywords,
      tone = 'professional',
      length = 'medium',
      targetAudience = 'general',
      includeFAQ = true,
      includeImages = true
    } = await request.json();

    if (!topic || !keywords || keywords.length === 0) {
      return NextResponse.json(
        { error: 'topic and keywords are required' },
        { status: 400 }
      );
    }

    const article = await deepseekContentWriter.writeBlogArticle({
      type: 'blog_article',
      topic,
      keywords,
      tone,
      length,
      targetAudience,
      includeFAQ,
      includeImages
    });

    return NextResponse.json({
      success: true,
      type: 'blog_article',
      article
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to write blog article', details: error.message },
      { status: 500 }
    );
  }
}
```

#### `/app/api/deepseek/content-writer/social-post/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekContentWriter } from '@/services/api/deepseek-content-writer';

export async function POST(request: NextRequest) {
  try {
    const {
      topic,
      platform,
      tone = 'casual',
      callToAction = 'Learn more',
      includeHashtags = true,
      abTestVariations = 3
    } = await request.json();

    if (!topic || !platform) {
      return NextResponse.json(
        { error: 'topic and platform are required' },
        { status: 400 }
      );
    }

    const post = await deepseekContentWriter.writeSocialPost({
      type: 'social_post',
      topic,
      platform,
      tone,
      callToAction,
      includeHashtags,
      abTestVariations
    });

    return NextResponse.json({
      success: true,
      type: 'social_post',
      platform,
      post
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to write social post', details: error.message },
      { status: 500 }
    );
  }
}
```

#### `/app/api/deepseek/content-writer/ad-copy/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekContentWriter } from '@/services/api/deepseek-content-writer';

export async function POST(request: NextRequest) {
  try {
    const {
      product,
      platform,
      targetAudience,
      budget,
      objective = 'conversions',
      headlineVariations = 5,
      descriptionVariations = 5
    } = await request.json();

    if (!product || !platform || !targetAudience || !budget) {
      return NextResponse.json(
        { error: 'product, platform, targetAudience, and budget are required' },
        { status: 400 }
      );
    }

    const adCopy = await deepseekContentWriter.writeAdCopy({
      type: 'ad_copy',
      product,
      platform,
      targetAudience,
      budget,
      objective,
      headlineVariations,
      descriptionVariations
    });

    return NextResponse.json({
      success: true,
      type: 'ad_copy',
      platform,
      adCopy
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to write ad copy', details: error.message },
      { status: 500 }
    );
  }
}
```

#### `/app/api/deepseek/content-writer/email-campaign/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekContentWriter } from '@/services/api/deepseek-content-writer';

export async function POST(request: NextRequest) {
  try {
    const {
      topic,
      purpose,
      audience,
      tone = 'friendly',
      subjectLineVariations = 5,
      includeSpamCheck = true
    } = await request.json();

    if (!topic || !purpose || !audience) {
      return NextResponse.json(
        { error: 'topic, purpose, and audience are required' },
        { status: 400 }
      );
    }

    const email = await deepseekContentWriter.writeEmailCampaign({
      type: 'email',
      topic,
      purpose,
      audience,
      tone,
      subjectLineVariations,
      includeSpamCheck
    });

    return NextResponse.json({
      success: true,
      type: 'email',
      email
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to write email campaign', details: error.message },
      { status: 500 }
    );
  }
}
```

#### `/app/api/deepseek/content-writer/optimize/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekContentWriter } from '@/services/api/deepseek-content-writer';

export async function POST(request: NextRequest) {
  try {
    const {
      content,
      contentType,
      targetKeywords,
      improvementsNeeded
    } = await request.json();

    if (!content || !contentType || !targetKeywords || !improvementsNeeded) {
      return NextResponse.json(
        { error: 'All parameters are required' },
        { status: 400 }
      );
    }

    const optimized = await deepseekContentWriter.optimizeContent(
      content,
      contentType,
      targetKeywords,
      improvementsNeeded
    );

    return NextResponse.json({
      success: true,
      contentType,
      originalLength: content.length,
      optimizedLength: optimized.content.length,
      optimized
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to optimize content', details: error.message },
      { status: 500 }
    );
  }
}
```

#### `/app/api/deepseek/content-writer/translate/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekContentWriter } from '@/services/api/deepseek-content-writer';

export async function POST(request: NextRequest) {
  try {
    const {
      content,
      targetLanguage,
      localize = true,
      preserveSEO = true
    } = await request.json();

    if (!content || !targetLanguage) {
      return NextResponse.json(
        { error: 'content and targetLanguage are required' },
        { status: 400 }
      );
    }

    const translated = await deepseekContentWriter.translateContent(
      content,
      targetLanguage,
      localize,
      preserveSEO
    );

    return NextResponse.json({
      success: true,
      targetLanguage,
      localize,
      preserveSEO,
      originalLength: content.length,
      translatedLength: translated.content.length,
      translated
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to translate content', details: error.message },
      { status: 500 }
    );
  }
}
```

#### `/app/api/deepseek/content-writer/product-description/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekContentWriter } from '@/services/api/deepseek-content-writer';

export async function POST(request: NextRequest) {
  try {
    const {
      productName,
      features,
      benefits,
      targetAudience,
      tone = 'persuasive',
      length = 'medium'
    } = await request.json();

    if (!productName || !features || !benefits) {
      return NextResponse.json(
        { error: 'productName, features, and benefits are required' },
        { status: 400 }
      );
    }

    const description = await deepseekContentWriter.writeProductDescription({
      type: 'product_description',
      productName,
      features,
      benefits,
      targetAudience,
      tone,
      length
    });

    return NextResponse.json({
      success: true,
      type: 'product_description',
      description
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to write product description', details: error.message },
      { status: 500 }
    );
  }
}
```

## 🚀 Quick Implementation Script

Run this command to create all remaining API routes at once:

```bash
# Navigate to project root
cd D:\GEO_SEO_Domination-Tool

# Create all API route directories
mkdir -p app/api/deepseek/backlinks/discover
mkdir -p app/api/deepseek/backlinks/opportunities
mkdir -p app/api/deepseek/content-gaps/analyze
mkdir -p app/api/deepseek/local-seo/gbp-analysis
mkdir -p app/api/deepseek/local-seo/solv
mkdir -p app/api/deepseek/local-seo/local-pack
mkdir -p app/api/deepseek/aggregator/domain-overview
mkdir -p app/api/deepseek/social-media/profile-analysis
mkdir -p app/api/deepseek/social-media/influencer-discovery
mkdir -p app/api/deepseek/social-media/hashtag-research
mkdir -p app/api/deepseek/social-media/viral-content
mkdir -p app/api/deepseek/social-media/posting-schedule
mkdir -p app/api/deepseek/social-media/social-listening
mkdir -p app/api/deepseek/social-media/competitor-analysis
mkdir -p app/api/deepseek/content-writer/blog-article
mkdir -p app/api/deepseek/content-writer/social-post
mkdir -p app/api/deepseek/content-writer/ad-copy
mkdir -p app/api/deepseek/content-writer/email-campaign
mkdir -p app/api/deepseek/content-writer/optimize
mkdir -p app/api/deepseek/content-writer/translate
mkdir -p app/api/deepseek/content-writer/product-description
```

Then copy the code snippets above into each respective `route.ts` file.

## ✅ Testing Checklist

After implementing all routes:

1. **Build Test**: `npm run build` (should complete with 0 errors)
2. **Start Server**: `npm run dev`
3. **Test Root Endpoint**: `curl http://localhost:3000/api/deepseek`
4. **Test Each Module**: Use Postman or curl to test each endpoint
5. **MCP Server Test**: Configure Claude Desktop and test natural language queries
6. **Integration Test**: Run end-to-end workflows (SEO campaign, social media, content creation)

## 📊 Implementation Status

- ✅ Root endpoint (1/27)
- ✅ Keywords research (2/27)
- ✅ Competitor analysis (3/27)
- ✅ Find competitors (4/27)
- 🔄 Backlinks (2 routes) - Ready to implement
- 🔄 Content gaps (1 route) - Ready to implement
- 🔄 Local SEO (3 routes) - Ready to implement
- 🔄 Data aggregation (1 route) - Ready to implement
- 🔄 Social media (7 routes) - Ready to implement
- 🔄 Content writer (7 routes) - Ready to implement

**Total Progress**: 4/27 routes (15%) complete

## 🎯 Next Steps

1. Copy-paste the code snippets above into their respective files
2. Run `npm run build` to verify no TypeScript errors
3. Test each endpoint with sample data
4. Configure Claude Desktop with MCP server
5. Test natural language queries through Claude
6. Add to UI dashboard (optional)
7. Deploy to production

## 💡 Tips

- All routes follow the same error handling pattern
- Always validate required parameters
- Return consistent JSON structure
- Include success/error status
- Log errors for debugging
- Use TypeScript types from service modules

## 🔗 Related Documentation

- `mcp-server/README.md` - Complete MCP server documentation
- `DEEPSEEK_COMPLETE_SOLUTION.md` - Full solution overview
- `services/api/deepseek-*.ts` - Service module implementations
- `PRE_LAUNCH_CHECKLIST.md` - Pre-launch requirements
