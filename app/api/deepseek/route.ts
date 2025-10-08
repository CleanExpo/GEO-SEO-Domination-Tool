import { NextRequest, NextResponse } from 'next/server';

/**
 * DeepSeek V3 Marketing Intelligence API
 *
 * Root endpoint providing API documentation and health check
 */

export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: 'DeepSeek V3 Marketing Intelligence API',
    version: '1.0.0',
    status: 'operational',
    modules: {
      seo: {
        endpoint: '/api/deepseek/seo',
        features: ['keyword research', 'competitor analysis', 'SERP analysis']
      },
      backlinks: {
        endpoint: '/api/deepseek/backlinks',
        features: ['backlink discovery', 'quality scoring', 'opportunities']
      },
      contentGaps: {
        endpoint: '/api/deepseek/content-gaps',
        features: ['gap analysis', 'topic clustering', 'content briefs']
      },
      localSeo: {
        endpoint: '/api/deepseek/local-seo',
        features: ['GBP optimization', 'SoLV calculation', 'local rankings']
      },
      aggregator: {
        endpoint: '/api/deepseek/aggregator',
        features: ['domain overview', '117 data points', 'multi-source']
      },
      socialMedia: {
        endpoint: '/api/deepseek/social-media',
        features: ['profile analytics', 'influencer discovery', 'social listening']
      },
      contentWriter: {
        endpoint: '/api/deepseek/content-writer',
        features: ['blog articles', 'social posts', 'ad copy', 'emails']
      }
    },
    documentation: 'See /mcp-server/README.md for complete API documentation',
    costSavings: {
      industry: '$19,140/year',
      deepseek: '$480-960/year',
      savingsPercent: '95-97%'
    }
  });
}
