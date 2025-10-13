/**
 * Free Authority Checker API - Public Tool
 *
 * POST /api/tools/authority-checker
 * Body: { domain: string }
 *
 * Returns:
 * - Domain Rating (0-100)
 * - Total backlinks
 * - Referring domains
 * - Authority level (Low/Medium/High/Very High)
 * - Trust score
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

    console.log(`[Free Authority Checker] Checking: ${cleanDomain}`);

    // Analyze domain authority
    const analyzer = new BacklinkAnalyzer();
    const profile = await analyzer.analyzeBacklinks(cleanDomain);

    // Calculate authority level
    let authorityLevel: 'Low' | 'Medium' | 'High' | 'Very High';
    if (profile.domainRating >= 70) {
      authorityLevel = 'Very High';
    } else if (profile.domainRating >= 50) {
      authorityLevel = 'High';
    } else if (profile.domainRating >= 30) {
      authorityLevel = 'Medium';
    } else {
      authorityLevel = 'Low';
    }

    // Calculate trust score (based on dofollow ratio and referring domains diversity)
    const dofollowRatio = profile.totalBacklinks > 0
      ? profile.dofollowLinks / profile.totalBacklinks
      : 0;
    const diversityScore = profile.referringDomains > 0
      ? Math.min(profile.referringDomains / 100, 1)
      : 0;
    const trustScore = Math.round((dofollowRatio * 0.6 + diversityScore * 0.4) * 100);

    // Generate recommendations using AI
    const recommendations = await analyzer.generateBacklinkRecommendations(cleanDomain, profile);

    // Estimate organic traffic based on DR and backlinks
    const estimatedTraffic = profile.domainRating > 60
      ? `${Math.round(profile.referringDomains * 50).toLocaleString()}+`
      : `${Math.round(profile.referringDomains * 20).toLocaleString()}+`;

    // Estimate top keywords based on DR
    const estimatedKeywords = Math.max(10, Math.round(profile.domainRating * 10));

    return NextResponse.json({
      success: true,
      data: {
        domainRating: profile.domainRating,
        trustScore,
        authorityLevel,
        recommendations,
        metrics: {
          backlinks: profile.totalBacklinks,
          referringDomains: profile.referringDomains,
          organicTraffic: estimatedTraffic,
          topKeywords: estimatedKeywords,
        },
      },
    });
  } catch (error: any) {
    console.error('[Free Authority Checker] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check authority' },
      { status: 500 }
    );
  }
}
