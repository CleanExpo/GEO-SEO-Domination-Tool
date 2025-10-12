/**
 * Free Backlink Checker API - Public Tool
 *
 * POST /api/tools/backlink-checker
 * Body: { domain: string }
 *
 * Returns:
 * - Domain Rating (0-100)
 * - Total backlinks
 * - Referring domains
 * - Top 10 referring domains (limited data for free tier)
 */

import { NextRequest, NextResponse } from 'next/server';
import { BacklinkAnalyzer } from '@/services/api/backlink-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json(
        { error: 'domain is required' },
        { status: 400 }
      );
    }

    // Clean domain
    const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

    console.log(`[Free Backlink Checker] Checking: ${cleanDomain}`);

    // Analyze backlinks
    const analyzer = new BacklinkAnalyzer();
    const profile = await analyzer.analyzeBacklinks(cleanDomain);

    // Return limited data for free tier (top 10 referring domains only)
    const freeData = {
      domainRating: profile.domainRating,
      totalBacklinks: profile.totalBacklinks,
      referringDomains: profile.referringDomains,
      dofollowPercentage: Math.round(
        (profile.dofollowLinks / profile.totalBacklinks) * 100
      ),
      topReferringDomains: profile.topBacklinks
        .slice(0, 10)
        .map((backlink) => ({
          domain: new URL(backlink.sourceUrl).hostname,
          domainRating: backlink.authorityScore,
          backlinksToYou: 1, // Simplified for free tier
          linkType: backlink.linkType,
        }))
        // Group by domain and sum backlinks
        .reduce((acc, curr) => {
          const existing = acc.find((d) => d.domain === curr.domain);
          if (existing) {
            existing.backlinksToYou += 1;
          } else {
            acc.push(curr);
          }
          return acc;
        }, [] as typeof profile.topBacklinks extends Array<infer T> ? any[] : never)
        .slice(0, 10),
    };

    return NextResponse.json({
      success: true,
      data: freeData,
    });
  } catch (error: any) {
    console.error('[Free Backlink Checker] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check backlinks' },
      { status: 500 }
    );
  }
}
