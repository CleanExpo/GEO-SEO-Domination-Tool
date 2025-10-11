import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { createGSCService } from '@/services/api/google-search-console';
import { createGMBService } from '@/services/api/google-my-business';
import { createBingService } from '@/services/api/bing-webmaster';
import { LighthouseService } from '@/services/api/lighthouse';
import { calculateVitalsHealthScore } from '@/lib/vitals-health-score';
import type {
  CaptureVitalsRequest,
  CaptureVitalsResponse,
  OnboardingVitals,
} from '@/types/onboarding-vitals';

// POST /api/onboarding/vitals/capture - Capture comprehensive baseline vitals
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = createAdminClient();
    const body: CaptureVitalsRequest = await request.json();
    const { companyId, options = {} } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    console.log(`[Vitals Capture] Starting for company ${companyId}`);

    // Fetch company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const siteUrl = company.website;
    if (!siteUrl) {
      return NextResponse.json(
        { error: 'Company website URL is required' },
        { status: 400 }
      );
    }

    const errors: Array<{ source: string; message: string }> = [];
    const dataSources: string[] = [];
    const vitalsData: Partial<OnboardingVitals> = {
      companyId,
      capturedAt: new Date(),
    };

    // 1. Google Search Console (if enabled and key available)
    if (options.includeGSC !== false) {
      const gscApiKey = process.env.GOOGLE_API_KEY;
      const gscService = createGSCService(gscApiKey);

      if (gscService) {
        try {
          console.log('[Vitals Capture] Fetching GSC data...');
          const gscData = await gscService.getBaselineVitals(siteUrl);
          vitalsData.gsc = {
            impressions: gscData.impressions,
            clicks: gscData.clicks,
            ctr: gscData.ctr,
            avgPosition: gscData.avgPosition,
            indexedPages: gscData.indexedPages,
            coverageIssues: gscData.coverageIssues,
            mobileUsabilityIssues: 0,
            manualActions: 0,
            httpsStatus: siteUrl.startsWith('https://'),
            mobileFriendly: true, // Requires separate API call
            structuredDataErrors: 0,
            topKeywords: gscData.topKeywords,
            topPages: gscData.topPages,
          };
          vitalsData.gscData = gscData;
          dataSources.push('gsc');
          console.log('[Vitals Capture] ✓ GSC data captured');
        } catch (error: any) {
          console.error('[Vitals Capture] GSC error:', error.message);
          errors.push({ source: 'gsc', message: error.message });
        }
      } else {
        console.warn('[Vitals Capture] GSC skipped - no API key');
      }
    }

    // 2. Google My Business (if enabled and token available)
    if (options.includeGMB !== false) {
      // Use auto-refreshing OAuth service
      const { createGMBServiceWithRefresh } = await import('@/services/api/google-my-business');
      const gmbService = await createGMBServiceWithRefresh();

      if (gmbService && company.gmb_location_id) {
        try {
          console.log('[Vitals Capture] Fetching GMB data...');
          const gmbData = await gmbService.getBaselineVitals(company.gmb_location_id);
          vitalsData.gmb = {
            profileCompleteness: gmbData.profileCompleteness,
            napConsistency: gmbData.napConsistency,
            categories: gmbData.categories,
            primaryCategory: gmbData.primaryCategory,
            totalReviews: gmbData.totalReviews,
            avgRating: gmbData.avgRating,
            reviewResponseRate: gmbData.reviewResponseRate,
            photosCount: gmbData.photosCount,
            postsLast30Days: gmbData.postsLast30Days,
            searchViews: gmbData.searchViews,
            mapViews: gmbData.mapViews,
            directionRequests: gmbData.directionRequests,
            phoneCalls: gmbData.phoneCalls,
            websiteClicks: gmbData.websiteClicks,
          };
          vitalsData.gmbData = gmbData;
          dataSources.push('gmb');
          console.log('[Vitals Capture] ✓ GMB data captured');
        } catch (error: any) {
          console.error('[Vitals Capture] GMB error:', error.message);
          errors.push({ source: 'gmb', message: error.message });
        }
      } else {
        console.warn('[Vitals Capture] GMB skipped - no access token or location ID');
      }
    }

    // 3. Bing Webmaster Tools (if enabled and key available)
    if (options.includeBing !== false) {
      const bingApiKey = process.env.BING_WEBMASTER_API_KEY;
      const bingService = createBingService(bingApiKey);

      if (bingService) {
        try {
          console.log('[Vitals Capture] Fetching Bing data...');
          const bingData = await bingService.getBaselineVitals(siteUrl);
          vitalsData.bing = {
            impressions: bingData.impressions,
            clicks: bingData.clicks,
            ctr: bingData.ctr,
            seoScore: bingData.seoScore,
            pagesIndexed: bingData.pagesIndexed,
            crawlErrors: bingData.crawlErrors,
            blockedUrls: bingData.blockedUrls,
            mobileFriendly: bingData.mobileFriendly,
            backlinks: bingData.backlinks,
            linkingDomains: bingData.linkingDomains,
            crawlRate: bingData.crawlRate,
            lastCrawlDate: bingData.lastCrawlDate ? new Date(bingData.lastCrawlDate) : undefined,
          };
          vitalsData.bingData = bingData;
          dataSources.push('bing');
          console.log('[Vitals Capture] ✓ Bing data captured');
        } catch (error: any) {
          console.error('[Vitals Capture] Bing error:', error.message);
          errors.push({ source: 'bing', message: error.message });
        }
      } else {
        console.warn('[Vitals Capture] Bing skipped - no API key');
      }
    }

    // 4. Technical SEO via Lighthouse (if enabled)
    if (options.includeTechnical !== false) {
      const googleApiKey = process.env.GOOGLE_SPEED_KEY ||
                           process.env.GOOGLE_PAGESPEED_API_KEY ||
                           process.env.GOOGLE_API_KEY;

      if (googleApiKey) {
        try {
          console.log('[Vitals Capture] Fetching Lighthouse data...');
          const lighthouse = new LighthouseService(googleApiKey);

          const [mobileScores, desktopScores] = await Promise.all([
            lighthouse.auditPage(siteUrl, 'mobile'),
            lighthouse.auditPage(siteUrl, 'desktop'),
          ]);

          vitalsData.technical = {
            pageSpeed: {
              mobile: mobileScores.performance,
              desktop: desktopScores.performance,
            },
            totalPages: 0, // Requires crawling
            blogPosts: 0,
            avgWordCount: 0,
            thinContentPages: 0,
            duplicateContentPct: 0,
            seoFundamentals: {
              titleTagsCoverage: mobileScores.seo >= 90 ? 90 : mobileScores.seo,
              metaDescCoverage: mobileScores.seo >= 90 ? 90 : mobileScores.seo,
              h1TagsCoverage: mobileScores.seo >= 90 ? 90 : mobileScores.seo,
              altTextCoverage: mobileScores.accessibility >= 90 ? 90 : mobileScores.accessibility,
              internalLinkingDensity: 0,
            },
            hasRobotsTxt: true, // Requires separate check
            hasXmlSitemap: true, // Requires separate check
            hasSsl: siteUrl.startsWith('https://'),
          };
          dataSources.push('lighthouse');
          console.log('[Vitals Capture] ✓ Lighthouse data captured');
        } catch (error: any) {
          console.error('[Vitals Capture] Lighthouse error:', error.message);
          errors.push({ source: 'lighthouse', message: error.message });
        }
      } else {
        console.warn('[Vitals Capture] Lighthouse skipped - no API key');
      }
    }

    // Calculate health score
    let vitalsHealthScore = 0;
    if (dataSources.length > 0) {
      const scoreBreakdown = calculateVitalsHealthScore(vitalsData as OnboardingVitals);
      vitalsHealthScore = scoreBreakdown.overall;
      console.log(`[Vitals Capture] Health score: ${vitalsHealthScore}/100`);
    }

    // Save to database
    const dbRecord = {
      company_id: companyId,
      captured_at: vitalsData.capturedAt,

      // GSC
      gsc_impressions: vitalsData.gsc?.impressions,
      gsc_clicks: vitalsData.gsc?.clicks,
      gsc_ctr: vitalsData.gsc?.ctr,
      gsc_avg_position: vitalsData.gsc?.avgPosition,
      gsc_indexed_pages: vitalsData.gsc?.indexedPages,
      gsc_coverage_issues: vitalsData.gsc?.coverageIssues,
      gsc_https_status: vitalsData.gsc?.httpsStatus,
      gsc_mobile_friendly: vitalsData.gsc?.mobileFriendly,

      // GMB
      gmb_profile_completeness: vitalsData.gmb?.profileCompleteness,
      gmb_nap_consistency: vitalsData.gmb?.napConsistency,
      gmb_total_reviews: vitalsData.gmb?.totalReviews,
      gmb_avg_rating: vitalsData.gmb?.avgRating,
      gmb_review_response_rate: vitalsData.gmb?.reviewResponseRate,
      gmb_photos_count: vitalsData.gmb?.photosCount,
      gmb_search_views: vitalsData.gmb?.searchViews,
      gmb_map_views: vitalsData.gmb?.mapViews,

      // Bing
      bing_impressions: vitalsData.bing?.impressions,
      bing_clicks: vitalsData.bing?.clicks,
      bing_ctr: vitalsData.bing?.ctr,
      bing_seo_score: vitalsData.bing?.seoScore,
      bing_pages_indexed: vitalsData.bing?.pagesIndexed,
      bing_crawl_errors: vitalsData.bing?.crawlErrors,
      bing_backlinks: vitalsData.bing?.backlinks,

      // Technical
      tech_page_speed_mobile: vitalsData.technical?.pageSpeed.mobile,
      tech_page_speed_desktop: vitalsData.technical?.pageSpeed.desktop,
      tech_has_ssl: vitalsData.technical?.hasSsl,

      // Overall score
      vitals_health_score: vitalsHealthScore,

      // JSON data
      gsc_data: vitalsData.gscData,
      gmb_data: vitalsData.gmbData,
      bing_data: vitalsData.bingData,

      // Metadata
      audit_duration_ms: Date.now() - startTime,
      data_sources: dataSources,
      errors: errors.length > 0 ? errors : null,
    };

    const { data, error: insertError } = await supabase
      .from('onboarding_vitals')
      .insert([dbRecord])
      .select()
      .single();

    if (insertError) {
      console.error('[Vitals Capture] Database insert failed:', insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    console.log(`[Vitals Capture] ✓ Completed in ${Date.now() - startTime}ms`);

    const response: CaptureVitalsResponse = {
      result: {
        success: true,
        vitalsId: data.id,
        vitals: vitalsData as OnboardingVitals,
        errors: errors.length > 0 ? errors : undefined,
        duration: Date.now() - startTime,
        dataSources,
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('[Vitals Capture] Unexpected error:', error.message);
    return NextResponse.json(
      {
        error: `Failed to capture vitals: ${error.message}`,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
