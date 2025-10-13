import { NextRequest, NextResponse } from 'next/server';
import { BacklinkAnalyzer } from '@/services/api/backlink-analyzer';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/backlinks/[id]
 * Analyze backlinks for a company
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // 1. Get company data
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // 2. Check if we have recent backlink data (less than 7 days old)
    const { data: existingProfile } = await supabase
      .from('backlink_profiles')
      .select('*, anchor_text_distribution(*), referring_domains(*), backlink_recommendations(*)')
      .eq('company_id', id)
      .single();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const isDataFresh = existingProfile &&
                        new Date(existingProfile.last_analyzed) > sevenDaysAgo;

    if (isDataFresh) {
      // Return cached data
      return NextResponse.json({
        profile: existingProfile,
        cached: true,
        lastAnalyzed: existingProfile.last_analyzed,
      });
    }

    // 3. Analyze backlinks (fresh data)
    const analyzer = new BacklinkAnalyzer();
    const profile = await analyzer.analyzeBacklinks(company.website.replace(/^https?:\/\//, ''));

    // 4. Save profile to database
    const { data: savedProfile, error: profileError } = await supabase
      .from('backlink_profiles')
      .upsert({
        id: `profile_${id}_${Date.now()}`,
        company_id: id,
        total_backlinks: profile.totalBacklinks,
        referring_domains: profile.referringDomains,
        domain_rating: profile.domainRating,
        url_rating: profile.urlRating,
        dofollow_links: profile.dofollowLinks,
        nofollow_links: profile.nofollowLinks,
        broken_links: profile.brokenLinks,
        link_velocity_gained: profile.linkVelocity.gained,
        link_velocity_lost: profile.linkVelocity.lost,
        last_analyzed: new Date().toISOString(),
      }, {
        onConflict: 'company_id',
      })
      .select()
      .single();

    if (profileError) {
      console.error('[Backlinks API] Profile save error:', profileError);
    }

    const profileId = savedProfile?.id || `profile_${id}_${Date.now()}`;

    // 5. Save anchor text distribution
    if (profile.anchorTextDistribution.length > 0) {
      await supabase
        .from('anchor_text_distribution')
        .delete()
        .eq('company_id', id);

      const anchorTextData = profile.anchorTextDistribution.map((anchor, index) => ({
        id: `anchor_${id}_${index}`,
        company_id: id,
        profile_id: profileId,
        anchor_text: anchor.text,
        count: anchor.count,
        percentage: anchor.percentage,
        type: anchor.type,
      }));

      await supabase
        .from('anchor_text_distribution')
        .insert(anchorTextData);
    }

    // 6. Save referring domains
    if (profile.topReferringDomains.length > 0) {
      await supabase
        .from('referring_domains')
        .delete()
        .eq('company_id', id);

      const referringDomainsData = profile.topReferringDomains.map((domain, index) => ({
        id: `domain_${id}_${index}`,
        company_id: id,
        profile_id: profileId,
        domain: domain.domain,
        backlinks: domain.backlinks,
        domain_rating: domain.domainRating,
        first_seen: domain.firstSeen.toISOString(),
        last_seen: domain.lastSeen.toISOString(),
        link_type: domain.linkType,
      }));

      await supabase
        .from('referring_domains')
        .insert(referringDomainsData);
    }

    // 7. Save top backlinks
    if (profile.topBacklinks.length > 0) {
      // Delete old backlinks for this company
      await supabase
        .from('backlinks')
        .delete()
        .eq('company_id', id);

      const backlinksData = profile.topBacklinks.map((link) => ({
        id: link.id,
        company_id: id,
        source_url: link.sourceUrl,
        target_url: link.targetUrl,
        source_domain: link.sourceDomain,
        target_domain: link.targetDomain,
        anchor_text: link.anchorText,
        link_type: link.linkType,
        discovered_date: link.discoveredDate.toISOString(),
        last_seen_date: link.lastSeenDate.toISOString(),
        status: link.status,
        authority_score: link.authorityScore,
        metadata: link.metadata || {},
      }));

      await supabase
        .from('backlinks')
        .insert(backlinksData);
    }

    // 8. Save historical domain rating
    await supabase
      .from('domain_rating_history')
      .insert({
        id: `history_${id}_${new Date().toISOString().split('T')[0]}`,
        company_id: id,
        date: new Date().toISOString().split('T')[0],
        referring_domains: profile.referringDomains,
        total_backlinks: profile.totalBacklinks,
        domain_rating: profile.domainRating,
      });

    // 9. Generate AI recommendations
    const recommendations = await analyzer.generateBacklinkRecommendations(
      company.website.replace(/^https?:\/\//, ''),
      profile
    );

    // 10. Save recommendations
    if (recommendations.length > 0) {
      await supabase
        .from('backlink_recommendations')
        .delete()
        .eq('company_id', id);

      const recommendationsData = recommendations.map((rec, index) => ({
        id: `rec_${id}_${index}`,
        company_id: id,
        profile_id: profileId,
        recommendation: rec,
        priority: index < 2 ? 'Critical' : index < 5 ? 'High' : 'Medium',
        status: 'pending',
      }));

      await supabase
        .from('backlink_recommendations')
        .insert(recommendationsData);
    }

    // 11. Return complete profile with recommendations
    return NextResponse.json({
      profile: {
        ...profile,
        anchorTextDistribution: profile.anchorTextDistribution,
        topReferringDomains: profile.topReferringDomains,
        recommendations,
      },
      cached: false,
      lastAnalyzed: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Backlinks API] Analysis failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze backlinks',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/backlinks/[id]/refresh
 * Force refresh backlink analysis
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Delete cached data to force refresh
    await supabase
      .from('backlink_profiles')
      .delete()
      .eq('company_id', id);

    // Call GET to regenerate
    return GET(request, { params });
  } catch (error) {
    console.error('[Backlinks API] Refresh failed:', error);
    return NextResponse.json(
      { error: 'Failed to refresh backlinks' },
      { status: 500 }
    );
  }
}
